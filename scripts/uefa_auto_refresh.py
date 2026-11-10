#!/usr/bin/env python3
"""No-key UEFA 2026/27 final-score updater for TFD live snapshot.

Fetches ESPN's undocumented public JSON scoreboard. Exact-date, exact-name
matches only; never guesses results, alters previous finished results, or
changes any fixture/competition metadata. No ESPN reliability guarantee.
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

SEASON = '2026-2027'
SLUGS = {
    'UEFA Champions League': 'uefa.champions',
    'UEFA Europa League': 'uefa.europa',
    'UEFA Conference League': 'uefa.europa.conf',
}
ALIASES = {
    'acmilan': 'milan', 'bayerleverkusen': 'leverkusen',
    'rbsalzburg': 'salzburg', '1899hoffenheim': 'hoffenheim',
    'olympiakospiraeus': 'olympiacos', 'olympiakos': 'olympiacos',
    'necnijmegen': 'nec', 'viktoriaplzen': 'plzen',
    'gnkdinamo': 'dinamozagreb', 'ferencvarositc': 'ferencvaros',
    'ferencvrosi': 'ferencvaros', 'ferencvros': 'ferencvaros',
    'beikta': 'besiktas', 'beiktas': 'besiktas',
    'unionsg': 'unionsaintgilloise',
    'royaleunionsaintgilloise': 'unionsaintgilloise',
    'hbeersheva': 'hapoelbeersheva', 'celta': 'celtadevigo',
    'omonia': 'omonianicosia', 'rennes': 'rennesfc',
    'kaagent': 'gent', 'agfaarhus': 'aarhus',
    'aarhusgf': 'aarhus', 'borac': 'boracbanjaluka',
    'fkboracbanjaluka': 'boracbanjaluka',
    'panathinaikosfc': 'panathinaikos',
    'sparta': 'spartapraha', 'spartaprague': 'spartapraha',
    'brightonhovealbion': 'brighton',
    'crystalpalacefc': 'crystalpalace',
    'fcbrugge': 'clubbrugge', 'clubbruggekv': 'clubbrugge',
    'astonvillafc': 'astonvilla',
    'hearts': 'heartofmidlothian',
    'heartofmidlothianfc': 'heartofmidlothian',
    'fcporto': 'porto',
}

def normalized(value):
    text = ''.join(c for c in unicodedata.normalize('NFKD', str(value or ''))
                   if not unicodedata.combining(c))
    key = ''.join(c for c in text.lower() if c.isalnum())
    return ALIASES.get(key, key)

def is_finished(game):
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

def scoreboard(league_slug, iso_day):
    date = iso_day.replace('-', '')
    url = ('https://site.api.espn.com/apis/site/v2/sports/soccer/'
           + league_slug + '/scoreboard?' + urlencode({'dates': date, 'limit': 500}))
    request = Request(url, headers={
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; UEFA-TFD-Final-Score-Checker/1.0)'
    })
    with urlopen(request, timeout=25) as resp:
        payload = json.load(resp)
    events = payload.get('events')
    if not isinstance(events, list):
        raise RuntimeError('Unexpected ESPN JSON response for ' + league_slug)
    rows = []
    for event in events:
        details = (event.get('competitions') or [{}])[0]
        by_side = {str(item.get('homeAway', '')).lower(): item
                   for item in details.get('competitors', [])}
        home, away = by_side.get('home'), by_side.get('away')
        if not home or not away:
            continue
        status = event.get('status') or details.get('status') or {}
        completed = (status.get('type') or {}).get('completed') is True
        event_date = event.get('date') or details.get('date') or ''
        if not event_date:
            continue
        try:
            date_iso = datetime.fromisoformat(event_date.replace('Z', '+00:00')).date().isoformat()
        except (ValueError, TypeError):
            continue
        def team_name(item):
            team = item.get('team') or {}
            return team.get('displayName') or team.get('name') or team.get('shortDisplayName')
        def get_score(item):
            value = item.get('score')
            if isinstance(value, dict):
                value = value.get('displayValue') or value.get('value')
            try:
                return int(value) if str(value).strip().isdigit() else None
            except (TypeError, ValueError):
                return None
        rows.append({'date': date_iso, 'home': team_name(home), 'away': team_name(away),
                     'homeScore': get_score(home), 'awayScore': get_score(away),
                     'complete': completed, 'sourceId': event.get('id')})
    return rows

def matching(game, rows):
    home, away = normalized(game.get('homeName')), normalized(game.get('awayName'))
    if not home or not away:
        return []
    return [r for r in rows if r['date'] == game.get('date')
            and normalized(r.get('home')) == home
            and normalized(r.get('away')) == away]

def protected(competitions):
    clone = copy.deepcopy(competitions)
    for competition in SLUGS:
        clone.get(competition, {}).pop(SEASON, None)
    return clone

def safeguard(original, updated):
    if protected(original['competitions']) != protected(updated['competitions']):
        raise RuntimeError('Other competitions or seasons changed')
    for name in SLUGS:
        old_bundle = original['competitions'][name][SEASON]
        new_bundle = updated['competitions'][name][SEASON]
        a, b = old_bundle['fixtures'], new_bundle['fixtures']
        if len(a) != len(b):
            raise RuntimeError('Fixture count changed: ' + name)
        for before, after in zip(a, b):
            x, y = dict(before), dict(after)
            if not is_finished(before):
                for field in ('homeScore', 'awayScore', 'status'):
                    x.pop(field, None)
                    y.pop(field, None)
            if x != y:
                raise RuntimeError('Existing fixture metadata/result changed: ' + str(before.get('id')))
            if is_finished(before) and before != after:
                raise RuntimeError('Previously final score altered: ' + str(before.get('id')))

def run(snapshot, *, now, probe=False, catchup=False, fetch=scoreboard):
    if snapshot.get('schemaVersion') != 1 or not isinstance(snapshot.get('competitions'), dict):
        raise RuntimeError('Unexpected TFD feed schema')
    original = copy.deepcopy(snapshot)
    for name in SLUGS:
        bundle = snapshot['competitions'].get(name, {}).get(SEASON)
        if not isinstance(bundle, dict) or not isinstance(bundle.get('fixtures'), list):
            raise RuntimeError('Missing European 2026/27 fixtures: ' + name)
        ids = [g.get('id') for g in bundle['fixtures']]
        if len(ids) != len(set(ids)):
            raise RuntimeError('Duplicate fixture IDs: ' + name)
    if probe:
        for name, slug in SLUGS.items():
            games = [g for g in snapshot['competitions'][name][SEASON]['fixtures']
                     if is_finished(g) and g.get('stage') == 'league'
                     and g.get('date') and 0 <= (now.date() - datetime.fromisoformat(g['date']).date()).days <= 45]
            dates = sorted(set(g['date'] for g in games), reverse=True)[:3]
            if not dates:
                raise RuntimeError('No eligible completed league fixtures to probe: ' + name)
            matched = 0
            for day in dates:
                rows = fetch(slug, day)
                hits = [g for g in games if g['date'] == day]
                for g in hits:
                    possible = matching(g, rows)
                    if len(possible) > 1:
                        raise RuntimeError('Ambiguous provider match in probe: ' + str(g.get('id')))
                    if len(possible) == 1 and possible[0]['complete']:
                        r = possible[0]
                        if (r['homeScore'], r['awayScore']) != (g['homeScore'], g['awayScore']):
                            raise RuntimeError('Existing completed-score conflict: ' + str(g.get('id')))
                        matched += 1
                print('PROBE', name, day, '| ESPN events:', len(rows), '| exact final matches to existing data:', matched)
            if matched < 1:
                raise RuntimeError('ESPN has no matching completed fixtures for ' + name)
        print('PASS: All three ESPN feeds match existing European results; nothing published')
        return snapshot, 0

    windows = {}
    for name, slug in SLUGS.items():
        for game in snapshot['competitions'][name][SEASON]['fixtures']:
            if is_finished(game):
                continue
            kickoff = kickoff_time(game)
            if kickoff is None or not game.get('date'):
                continue
            age = now - kickoff
            near = timedelta(minutes=-45) <= age <= timedelta(hours=14)
            retry = catchup and timedelta(0) <= age <= timedelta(hours=72)
            if near or retry:
                windows.setdefault((name, slug, game['date']), []).append(game)
    print('ESPN date windows to check:', len(windows))
    updates = 0
    for (name, slug, date), games in sorted(windows.items()):
        rows = fetch(slug, date)
        print('CHECK', name, date, '| ESPN events:', len(rows), '| pending:', len(games))
        for game in games:
            candidates = matching(game, rows)
            if len(candidates) > 1:
                raise RuntimeError('Duplicate matching ESPN fixtures: ' + str(game.get('id')))
            if not candidates:
                # No name guessing. Never publish another fixture's score.
                if now - kickoff_time(game) > timedelta(hours=6):
                    raise RuntimeError('ESPN cannot match pending fixture: ' + str(game.get('id')))
                continue
            row = candidates[0]
            if not row['complete']:
                continue
            h, a = row['homeScore'], row['awayScore']
            if type(h) is not int or type(a) is not int or h < 0 or a < 0:
                raise RuntimeError('Invalid ESPN final score: ' + str(game.get('id')))
            # A match may have an in-progress score from another service;
            # do not replace it if it conflicts with the final score.
            if (game.get('homeScore') is not None and game['homeScore'] != h
                    or game.get('awayScore') is not None and game['awayScore'] != a):
                raise RuntimeError('Conflicting existing score: ' + str(game.get('id')))
            game.update({'homeScore': h, 'awayScore': a, 'status': 'FINISHED'})
            updates += 1
            print('FINAL:', name, game['date'], game.get('homeName'), h, '-', a, game.get('awayName'))
    safeguard(original, snapshot)
    if updates:
        snapshot['generatedAt'] = now.isoformat(timespec='milliseconds').replace('+00:00', 'Z')
        content = json.dumps(snapshot['competitions'], ensure_ascii=False, separators=(',', ':'))
        snapshot['contentHash'] = hashlib.sha256(content.encode('utf-8')).hexdigest()
    return snapshot, updates

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('snapshot', type=Path)
    parser.add_argument('--probe', action='store_true')
    parser.add_argument('--catchup', action='store_true')
    args = parser.parse_args()
    data = json.loads(args.snapshot.read_text(encoding='utf-8'))
    candidate, updates = run(data, now=datetime.now(timezone.utc), probe=args.probe, catchup=args.catchup)
    if updates:
        temp = args.snapshot.with_suffix('.json.tmp')
        temp.write_text(json.dumps(candidate, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
        temp.replace(args.snapshot)
    print('Final scores published into local working copy:', updates)
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as fh:
            fh.write('changed=' + ('true' if updates else 'false') + '\n')

if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print('BLOCKED:', exc, file=sys.stderr)
        raise SystemExit(1)
