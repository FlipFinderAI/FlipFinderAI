#!/usr/bin/env python3
"""Guarded UEFA 2026/27 final-result updater for the TFD public snapshot.

Update ONLY scores+status of unique, confirmed final fixtures in CL/EL/ECL.
Preserve every other property, including stadiums, IDs and all other leagues.
"""
import argparse
import copy
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
from pathlib import Path
import sys
import unicodedata
from urllib.parse import urlencode
from urllib.request import Request, urlopen

LEAGUES = {
    'UEFA Champions League': 2,
    'UEFA Europa League': 3,
    'UEFA Conference League': 848,
}
SEASON = '2026-2027'
FINISHED = {'FT', 'AET', 'PEN'}
ALIASES = {
    'acmilan': 'milan', 'bayerleverkusen': 'leverkusen',
    'rbsalzburg': 'salzburg', '1899hoffenheim': 'hoffenheim',
    'olympiakospiraeus': 'olympiacos', 'olympiakos': 'olympiacos',
    'nec': 'necnijmegen', 'viktoriaplzen': 'plzen',
    'gnkdinamo': 'dinamozagreb', 'ferencvarositc': 'ferencvaros',
    'ferencvrosi': 'ferencvaros', 'beikta': 'besiktas',
    'beiktas': 'besiktas', 'unionsg': 'unionsaintgilloise',
    'royaleunionsaintgilloise': 'unionsaintgilloise',
    'hbeersheva': 'hapoelbeersheva', 'celta': 'celtadevigo',
    'omonia': 'omonianicosia', 'rennes': 'rennesfc',
    'kaagent': 'gent', 'agfaarhus': 'aarhus',
    'aarhusgf': 'aarhus', 'borac': 'boracbanjaluka',
    'fkboracbanjaluka': 'boracbanjaluka',
    'panathinaikosfc': 'panathinaikos',
}

def normalize(value):
    word = ''.join(c for c in unicodedata.normalize('NFKD', str(value or ''))
                   if not unicodedata.combining(c))
    key = ''.join(c for c in word.lower() if c.isalnum())
    return ALIASES.get(key, key)

def check_finished(game):
    return (game.get('status') == 'FINISHED'
            and type(game.get('homeScore')) is int
            and type(game.get('awayScore')) is int)

def kickoff_time(game):
    raw = game.get('kickoff')
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace('Z', '+00:00')).astimezone(timezone.utc)
    except (ValueError, TypeError):
        return None

def provider_fixtures(league, date, key):
    query = urlencode({'league': league, 'season': 2026, 'date': date})
    req = Request('https://v3.football.api-sports.io/fixtures?' + query,
                  headers={'x-apisports-key': key, 'Accept': 'application/json'})
    with urlopen(req, timeout=30) as response:
        payload = json.load(response)
    if payload.get('errors'):
        raise RuntimeError('API-Sports returned an error: ' + str(payload['errors']))
    if not isinstance(payload.get('response'), list):
        raise RuntimeError('API-Sports returned invalid results')
    return payload['response']

def exact_matches(game, provider):
    home, away = normalize(game.get('homeName')), normalize(game.get('awayName'))
    if not home or not away:
        return []
    matched = []
    for item in provider:
        metadata = item.get('fixture') or {}
        teams = item.get('teams') or {}
        if (str(metadata.get('date', ''))[:10] == game.get('date')
            and normalize((teams.get('home') or {}).get('name')) == home
            and normalize((teams.get('away') or {}).get('name')) == away):
            matched.append(item)
    return matched

def verify_untouched(old, updated):
    protected_old = copy.deepcopy(old['competitions'])
    protected_new = copy.deepcopy(updated['competitions'])
    for comp in LEAGUES:
        protected_old.get(comp, {}).pop(SEASON, None)
        protected_new.get(comp, {}).pop(SEASON, None)
    if protected_old != protected_new:
        raise RuntimeError('Protected competition or season changed')
    for comp in LEAGUES:
        before = old['competitions'][comp][SEASON]['fixtures']
        after = updated['competitions'][comp][SEASON]['fixtures']
        if len(before) != len(after):
            raise RuntimeError('Fixture count changed: ' + comp)
        for a, b in zip(before, after):
            x, y = dict(a), dict(b)
            if not check_finished(a):
                for field in ('homeScore', 'awayScore', 'status'):
                    x.pop(field, None)
                    y.pop(field, None)
            if x != y:
                raise RuntimeError('Existing fixture metadata or score altered: ' + str(a.get('id')))
            if check_finished(a) and a != b:
                raise RuntimeError('A completed result was changed')

def refresh(snap, *, key, now, catchup=False, probe=False, fetch=provider_fixtures):
    if snap.get('schemaVersion') != 1 or not isinstance(snap.get('competitions'), dict):
        raise RuntimeError('Unexpected snapshot schema')
    original = copy.deepcopy(snap)
    if probe:
        # A key can be valid while coverage is empty or from a different
        # fixture catalogue. Require at least one historical team/date match.
        proven = 0
        for comp, number in LEAGUES.items():
            rows = fetch(number, '2026-11-05', key)
            historical = [game for game in
                          snap['competitions'][comp][SEASON]['fixtures']
                          if game.get('date') == '2026-11-05'
                          and check_finished(game)]
            matched = sum(len(exact_matches(game, rows)) == 1
                          for game in historical)
            print('PROBE:', comp, 'provider:', len(rows),
                  'known historical:', len(historical), 'exact matches:', matched)
            proven += matched
        if proven == 0:
            raise RuntimeError('Provider key may be valid but has no compatible UEFA fixtures')
        print('PASS: Provider returned exact historical fixture matches')
        return snap, 0
    work = {}
    for comp, number in LEAGUES.items():
        bundle = snap['competitions'].get(comp, {}).get(SEASON)
        if not bundle or not isinstance(bundle.get('fixtures'), list):
            raise RuntimeError('Missing 2026/27 fixtures: ' + comp)
        games = bundle['fixtures']
        ids = [g.get('id') for g in games]
        if len(set(ids)) != len(ids):
            raise RuntimeError('Duplicate fixture IDs: ' + comp)
        for game in games:
            if check_finished(game):
                continue
            kickoff = kickoff_time(game)
            if not kickoff:
                continue
            age = now - kickoff
            near = timedelta(minutes=-45) <= age <= timedelta(hours=12)
            retry = catchup and timedelta(0) <= age <= timedelta(hours=72)
            if near or retry:
                work.setdefault((comp, number, game['date']), []).append(game)
    print('Eligible competition/date windows:', len(work))
    changed = 0
    missing = []
    for (comp, number, date), games in sorted(work.items()):
        source = fetch(number, date, key)
        print(comp, date, 'provider fixtures:', len(source), 'local pending:', len(games))
        if not source and any(now-kickoff_time(g) > timedelta(hours=3) for g in games):
            raise RuntimeError('Provider supplied no fixtures for ' + comp + ' ' + date)
        for game in games:
            candidate = exact_matches(game, source)
            if len(candidate) > 1:
                raise RuntimeError('Ambiguous provider fixture: ' + str(game.get('id')))
            if not candidate:
                if now-kickoff_time(game) > timedelta(hours=6):
                    missing.append(str(game.get('id')))
                continue
            row = candidate[0]
            status = ((row.get('fixture') or {}).get('status') or {}).get('short')
            if status not in FINISHED:
                continue  # In-play scores MUST NOT enter completed league tables.
            goals = row.get('goals') or {}
            h, a = goals.get('home'), goals.get('away')
            if type(h) is not int or type(a) is not int or h < 0 or a < 0:
                raise RuntimeError('Invalid final score for ' + str(game.get('id')))
            if game.get('homeScore') is not None or game.get('awayScore') is not None:
                if game.get('homeScore') != h or game.get('awayScore') != a:
                    raise RuntimeError('Existing score conflict: ' + str(game.get('id')))
            game['homeScore'], game['awayScore'], game['status'] = h, a, 'FINISHED'
            changed += 1
            print('FINAL:', comp, game['date'], game.get('homeName'), h, '-', a, game.get('awayName'))
    for fixture in missing:
        print('WARNING: No unique provider match for', fixture, file=sys.stderr)
    verify_untouched(original, snap)
    if changed:
        snap['generatedAt'] = now.isoformat(timespec='milliseconds').replace('+00:00','Z')
        compact = json.dumps(snap['competitions'], ensure_ascii=False, separators=(',',':'))
        snap['contentHash'] = hashlib.sha256(compact.encode('utf-8')).hexdigest()
    return snap, changed

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('snapshot', type=Path)
    parser.add_argument('--catchup', action='store_true')
    parser.add_argument('--probe', action='store_true')
    args = parser.parse_args()
    key = os.environ.get('API_SPORTS_KEY', '').strip()
    if not key:
        raise RuntimeError('API_SPORTS_KEY GitHub Actions secret not configured')
    loaded = json.loads(args.snapshot.read_text(encoding='utf-8'))
    new_data, updates = refresh(loaded, key=key, now=datetime.now(timezone.utc),
                                catchup=args.catchup, probe=args.probe)
    if updates:
        temp = args.snapshot.with_suffix('.json.tmp')
        temp.write_text(json.dumps(new_data, ensure_ascii=False,
                                   separators=(',', ':'))+'\n', encoding='utf-8')
        temp.replace(args.snapshot)
    print('Final results updated:', updates)
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as out:
            out.write('changed=' + ('true' if updates else 'false') + '\n')

if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print('BLOCKED:', exc, file=sys.stderr)
        raise SystemExit(1)
