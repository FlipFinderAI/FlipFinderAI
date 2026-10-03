const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, file);
const { eligible } = require('../lib/community/eligibility.ts');
const { attendanceSummary } = require('../lib/community/model.ts');
const { communityFetch } = require('../private-demo-service/src/community.ts');
const kickoff = Date.now();
const fixture = {
 id: 'verified',
 clubIds: ['club-a'],
 kickoff: new Date(kickoff).toISOString(),
 stadium: 'Verified Ground',
 latitude: 53,
 longitude: -1,
 homeClubId: 'club-home',
 awayClubId: 'club-a',
 competition: 'UEFA Champions League'
};
const coords = { latitude: 53, longitude: -1, accuracy: 5 };
function setup() {
 const db = new DatabaseSync(':memory:');
 const path = require('node:path');
 const migrationsDir = path.join(__dirname, '../private-demo-service/migrations');
 for (const file of fs.readdirSync(migrationsDir).filter(name => name.endsWith('.sql')).sort()) {
  db.exec(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
 }
 function prepare(query) {
  let args = [];
  return { bind(...values) { args = values; return this; },
   async first() { return db.prepare(query).get(...args) || null; },
   async all() { return { results: db.prepare(query).all(...args) }; },
   async run() { return { meta: { changes: Number(db.prepare(query).run(...args).changes) } }; }
  };
 }
 const env = { DB: { prepare, async batch(stmts) { db.exec('BEGIN'); try { const r = []; for (const s of stmts) r.push(await s.run()); db.exec('COMMIT'); return r; } catch(e) { db.exec('ROLLBACK'); throw e; } } },
 COMMUNITY_AUTH: { async fetch(r) {
  return Response.json({
   subject: r.headers.get('authorization').slice(7),
   communityEligible: true,
   isChild: false
  });
 } },
 COMMUNITY_FIXTURES: { async fetch() { return Response.json({ fixtures: [fixture] }); } } };
 async function call(user, path, data, method) {
  const response = await communityFetch(new Request('https://test/api/community' + path, { method: method || (data ? 'POST' : 'GET'), headers: { authorization: 'Bearer ' + user }, body: data ? JSON.stringify(data) : undefined }), env);
  return { status: response.status, body: await response.json() };
 }
 async function member(user, clubId = 'club-a') {
  const r = await call(user, '/profile', { displayName: user, avatar: '⚽', clubId, gamesAttended: 3, groundsVisited: ['Ground'] });
  assert.equal(r.status, 200);
  await call(user, '/preferences', {
  enabled: true,
  locationVisible: true,
  shareGames: true,
  shareGrounds: true,
  photoSharing: false
 });
  return r.body.profile.id;
 }
 return { db, env, call, member };
}
test('eligibility boundaries and missing data fail closed', () => {
 assert.equal(eligible(fixture, 'club-a', kickoff - 7200000, coords), true);
 assert.equal(eligible(fixture, 'club-a', kickoff - 7200001, coords), false);
 assert.equal(eligible(fixture, 'club-a', kickoff + 14400000, coords), false);
 assert.equal(eligible(fixture, 'club-b', kickoff, coords), false);
 assert.equal(eligible({ ...fixture, kickoff: '15:00' }, 'club-a', kickoff, coords), false);
 assert.equal(eligible(fixture, 'club-a', kickoff, { ...coords, latitude: 54 }), false);
 assert.equal(eligible(fixture, 'club-a', kickoff, { ...coords, accuracy: 4000 }), false);
 assert.equal(eligible(fixture, 'club-a', kickoff, { ...coords, latitude: NaN }), false);
});
test('public attendance projection excludes private source properties', () => {
 assert.deepEqual(attendanceSummary([{ confirmed: true, ground: 'Ground', email: 'private', photo: 'private' }, { confirmed: false, ground: 'Hidden' }]), { gamesAttended: 1, groundsVisited: ['Ground'] });
});
test('authentication missing fails closed', async () => {
 const { env } = setup(); delete env.COMMUNITY_AUTH;
 assert.equal((await communityFetch(new Request('https://test/api/community/me'), env)).status, 401);
});
test('profile defaults off; eligibility and withdrawal use server state', async () => {
 const { call, db } = setup();
 const r = await call('private-subject', '/profile', { displayName: 'Fan', avatar: '⚽', clubId: 'club-a', gamesAttended: 1, groundsVisited: ['Ground'], email: 'secret', photo: 'secret' });
 assert.deepEqual(r.body.preferences, {
  enabled: false,
  locationVisible: false,
  shareGames: false,
  shareGrounds: false,
  photoSharing: false
 });
 assert.equal(JSON.stringify(r.body).includes('private-subject'), false);
 assert.equal(JSON.stringify(r.body).includes('secret'), false);
 assert.equal((await call('private-subject', '/presence', { fixtureId: fixture.id, ...coords })).status, 403);
 await call('private-subject', '/preferences', {
  enabled: true,
  locationVisible: true,
  shareGames: true,
  shareGrounds: true,
  photoSharing: false
 });
 const p = await call('private-subject', '/presence', { fixtureId: fixture.id, ...coords, kickoff: 'fake' });
 assert.equal(p.status, 200); assert.equal(p.body.presence.onMap, false);
 const stored = db.prepare('SELECT * FROM community_presence').get();
 assert.equal(stored.stadium_lat, fixture.latitude); assert.equal('accuracy' in stored, false);
 await call('private-subject', '/preferences', {
  enabled: false,
  locationVisible: false,
  shareGames: false,
  shareGrounds: false,
  photoSharing: false
 });
 assert.equal(db.prepare('SELECT count(*) n FROM community_presence').get().n, 0);
});
module.exports = { setup, fixture, coords };

test('map is separate opt-in and discovery respects club, expiry and blocks', async () => {
 const { member, call, db } = setup();
 const a = await member('a'), b = await member('b'); await member('c', 'club-c');
 await call('a','/presence',{ fixtureId:fixture.id,...coords });
 await call('b','/presence',{ fixtureId:fixture.id,...coords });
 assert.equal((await call('a','/discover')).body.people.length,1);
 assert.equal((await call('a','/map')).body.people.length,0);
 await call('b','/map',{});
 assert.equal((await call('a','/map')).body.people.length,1);
 db.prepare('INSERT INTO community_blocks VALUES(?,?)').run(b,a);
 assert.equal((await call('a','/map')).body.people.length,0);
 db.prepare('DELETE FROM community_blocks').run();
 db.prepare('UPDATE community_presence SET expires_at=0 WHERE member_id=?').run(b);
 assert.equal((await call('a','/discover')).body.people.length,0);
 assert.equal((await call('b','/map',{})).status,403);
});
test('friend lifecycle rejects forged accept, other clubs, expired visibility and blocks', async () => {
 const { member, call, db } = setup();
 const a = await member('a'), b = await member('b'), c = await member('c','club-c');
 await call('a','/presence',{ fixtureId:fixture.id,...coords });
 await call('b','/presence',{ fixtureId:fixture.id,...coords });
 assert.equal((await call('a','/friend-request',{ target:c, friendType:'matchday' })).status,409);
 assert.equal((await call('a','/friend-request',{ target:b, friendType:'matchday' })).status,200);
 const incoming = (await call('b','/friends')).body.relationships[0];
 assert.equal(incoming.incoming,true);
 assert.equal((await call('a','/relationship',{ id:incoming.id, action:'accept' })).status,409);
 assert.equal((await call('b','/relationship',{ id:incoming.id, action:'accept' })).status,200);
 assert.equal((await call('a','/friends')).body.relationships[0].status,'accepted');
 assert.equal((await call('b','/report',{ target:a, reason:'Abuse' })).status,200);
 assert.equal(db.prepare('SELECT count(*) n FROM community_reports').get().n,1);
 await call('b','/block',{ target:a });
 assert.equal((await call('a','/friends')).body.relationships.length,0);
 assert.equal((await call('a','/friend-request',{ target:b, friendType:'matchday' })).status,409);
 assert.equal((await call('a','/discover')).body.people.length,0);
});


test('messages require accepted same-club friendship and stop after block', async () => {
 const { member, call } = setup();

 const a = await member('message-a');
 const b = await member('message-b');
 const c = await member('message-c', 'club-c');

 // No friendship yet.
 assert.equal(
   (await call('message-a','/message',{
     target:b,
     body:'Too early'
   })).status,
   403
 );

 // Different favourite club can never be messaged.
 assert.equal(
   (await call('message-a','/message',{
     target:c,
     body:'Wrong club'
   })).status,
   403
 );

 // Become eligible to discover each other.
 await call(
   'message-a',
   '/presence',
   { fixtureId:fixture.id,...coords }
 );

 await call(
   'message-b',
   '/presence',
   { fixtureId:fixture.id,...coords }
 );

 assert.equal(
   (await call(
     'message-a',
     '/friend-request',
     { target:b , friendType:'matchday' }
   )).status,
   200
 );

 const incoming =
   (await call('message-b','/friends'))
     .body.relationships[0];

 assert.equal(
   (await call(
     'message-b',
     '/relationship',
     {
       id:incoming.id,
       action:'accept'
     }
   )).status,
   200
 );

 // Accepted friendship allows private messaging.
 assert.equal(
   (await call(
     'message-a',
     '/message',
     {
       target:b,
       body:' Hello friend '
     }
   )).status,
   200
 );

 // Recipient sees one unread conversation.
 const inbox =
   await call('message-b','/conversations');

 assert.equal(inbox.status,200);
 assert.equal(inbox.body.conversations.length,1);
 assert.equal(inbox.body.conversations[0].friend.id,a);
 assert.equal(inbox.body.conversations[0].unread,1);

 // Opening the thread returns the message.
 const thread =
   await call(
     'message-b',
     `/messages?friend=${encodeURIComponent(a)}`
   );

 assert.equal(thread.status,200);
 assert.equal(thread.body.messages.length,1);
 assert.equal(thread.body.messages[0].body,'Hello friend');
 assert.equal(thread.body.messages[0].sender,a);

 // Opening marks incoming messages read.
 const readInbox =
   await call('message-b','/conversations');

 assert.equal(
   readInbox.body.conversations[0].unread,
   0
 );

 // Blocking immediately removes messaging access.
 await call(
   'message-b',
   '/block',
   { target:a }
 );

 assert.equal(
   (await call(
     'message-a',
     '/message',
     {
       target:b,
       body:'Blocked'
     }
   )).status,
   403
 );

 assert.equal(
   (await call(
     'message-a',
     `/messages?friend=${encodeURIComponent(b)}`
   )).status,
   403
 );

 assert.equal(
   (await call(
     'message-a',
     '/conversations'
   )).body.conversations.length,
   0
 );
});

test('messages reject blank and oversized content', async () => {
 const { member, call } = setup();

 const a = await member('length-a');
 const b = await member('length-b');

 await call(
   'length-a',
   '/presence',
   { fixtureId:fixture.id,...coords }
 );

 await call(
   'length-b',
   '/presence',
   { fixtureId:fixture.id,...coords }
 );

 await call(
   'length-a',
   '/friend-request',
   { target:b , friendType:'matchday' }
 );

 const incoming =
   (await call('length-b','/friends'))
     .body.relationships[0];

 await call(
   'length-b',
   '/relationship',
   {
     id:incoming.id,
     action:'accept'
   }
 );

 assert.equal(
   (await call(
     'length-a',
     '/message',
     {
       target:b,
       body:'   '
     }
   )).status,
   400
 );

 assert.equal(
   (await call(
     'length-a',
     '/message',
     {
       target:b,
       body:'x'.repeat(1001)
     }
   )).status,
   400
 );
});


test('child accounts are rejected by the trusted authentication boundary', async () => {
 const { env } = setup();

 env.COMMUNITY_AUTH = {
  async fetch(r) {
   return Response.json({
    subject: r.headers.get('authorization').slice(7),
    communityEligible: false,
    isChild: true
   });
  }
 };

 const response = await communityFetch(
  new Request('https://test/api/community/me', {
   headers: { authorization: 'Bearer child-account' }
  }),
  env
 );

 assert.equal(response.status, 403);

 const body = await response.json();
 assert.equal(body.error, 'Community is not available for this account.');
});

test('missing age eligibility fails closed', async () => {
 const { env } = setup();

 env.COMMUNITY_AUTH = {
  async fetch(r) {
   return Response.json({
    subject: r.headers.get('authorization').slice(7)
   });
  }
 };

 const response = await communityFetch(
  new Request('https://test/api/community/me', {
   headers: { authorization: 'Bearer unknown-age' }
  }),
  env
 );

 assert.equal(response.status, 403);
});

test('profile aggregates are private unless individually enabled', async () => {
 const { call } = setup();

 const created = await call('privacy-user', '/profile', {
  displayName: 'Privacy User',
  avatar: '⚽',
  clubId: 'club-a',
  gamesAttended: 42,
  groundsVisited: ['Ground A', 'Ground B']
 });

 assert.equal(created.body.profile.gamesAttended, 0);
 assert.deepEqual(created.body.profile.groundsVisited, []);
 assert.match(created.body.safetyId, /^TF-C-[A-F0-9]{12}$/);

 const gamesOnly = await call('privacy-user', '/preferences', {
  enabled: true,
  locationVisible: false,
  shareGames: true,
  shareGrounds: false,
  photoSharing: false
 });

 assert.equal(gamesOnly.body.profile.gamesAttended, 42);
 assert.deepEqual(gamesOnly.body.profile.groundsVisited, []);

 const all = await call('privacy-user', '/preferences', {
  enabled: true,
  locationVisible: true,
  shareGames: true,
  shareGrounds: true,
  photoSharing: true
 });

 assert.equal(all.body.profile.gamesAttended, 42);
 assert.deepEqual(all.body.profile.groundsVisited, ['Ground A', 'Ground B']);
 assert.equal(all.body.preferences.photoSharing, true);

 const off = await call('privacy-user', '/preferences', {
  enabled: false,
  locationVisible: true,
  shareGames: true,
  shareGrounds: true,
  photoSharing: true
 });

 assert.deepEqual(off.body.preferences, {
  enabled: false,
  locationVisible: false,
  shareGames: false,
  shareGrounds: false,
  photoSharing: false
 });
});

test('reports return moderation references without authentication subjects', async () => {
 const { member, call } = setup();

 const reporter = await member('reporter-account');
 const reported = await member('reported-account');

 assert.ok(reporter);
 assert.ok(reported);

 const result = await call('reporter-account', '/report', {
  target: reported,
  reason: 'Safety concern',
  context: 'Community profile'
 });

 assert.equal(result.status, 200);
 assert.match(result.body.reportId, /^[0-9a-f-]{36}$/i);
 assert.match(result.body.reportedSafetyId, /^TF-C-[A-F0-9]{12}$/);
 assert.equal(result.body.contact, 'info@handytize.co.uk');
 assert.equal(JSON.stringify(result.body).includes('reported-account'), false);
});


test('friendship types, known supporter lookup and message privacy', async () => {
 const { member, call, db } = setup();

 const a = await member('known-a');
 const b = await member('known-b');
 const c = await member('known-c', 'club-c');

 const bRow = db.prepare(
  'SELECT friend_id FROM community_members WHERE id=?'
 ).get(b);

 const cRow = db.prepare(
  'SELECT friend_id FROM community_members WHERE id=?'
 ).get(c);

 assert.match(bRow.friend_id, /^TF-F-[A-F0-9]{12}$/);

 // Exact Friend ID finds a same-club supporter without matchday presence.
 const byId = await call(
  'known-a',
  '/friend-search?q=' + encodeURIComponent(bRow.friend_id)
 );

 assert.equal(byId.status, 200);
 assert.equal(byId.body.people.length, 1);
 assert.equal(byId.body.people[0].id, b);
 assert.equal(byId.body.people[0].friendId, bRow.friend_id);

 // Exact Community name also works.
 const byName = await call(
  'known-a',
  '/friend-search?q=' + encodeURIComponent('known-b')
 );

 assert.equal(byName.status, 200);
 assert.equal(byName.body.people.length, 1);
 assert.equal(byName.body.people[0].id, b);

 // Partial names do not act as broad people search.
 const partial = await call(
  'known-a',
  '/friend-search?q=' + encodeURIComponent('known')
 );

 assert.equal(partial.status, 200);
 assert.equal(partial.body.people.length, 0);

 // Other-club supporters remain undiscoverable even with their Friend ID.
 const otherClub = await call(
  'known-a',
  '/friend-search?q=' + encodeURIComponent(cRow.friend_id)
 );

 assert.equal(otherClub.status, 200);
 assert.equal(otherClub.body.people.length, 0);

 // Friendship type is mandatory.
 assert.equal(
  (await call('known-a','/friend-request',{ target:b })).status,
  400
 );

 assert.equal(
  (await call('known-a','/friend-request',{
   target:b,
   friendType:'invalid',
   lookup:bRow.friend_id
  })).status,
  400
 );

 // Known supporter can be requested as a Full-Time Friend.
 assert.equal(
  (await call('known-a','/friend-request',{
   target:b,
   friendType:'full_time',
   lookup:bRow.friend_id
  })).status,
  200
 );

 const incoming = (await call('known-b','/friends')).body.relationships[0];

 assert.equal(incoming.incoming, true);
 assert.equal(incoming.friendType, 'full_time');

 // Sender still cannot forge acceptance.
 assert.equal(
  (await call('known-a','/relationship',{
   id:incoming.id,
   action:'accept'
  })).status,
  409
 );

 assert.equal(
  (await call('known-b','/relationship',{
   id:incoming.id,
   action:'accept'
  })).status,
  200
 );

 const accepted = (await call('known-a','/friends')).body.relationships[0];

 assert.equal(accepted.status, 'accepted');
 assert.equal(accepted.friendType, 'full_time');

 // Full-Time Friends can message with no matchday presence.
 assert.equal(
  (await call('known-a','/message',{
   target:b,
   body:'See you at the match'
  })).status,
  200
 );

 const conversations = await call('known-a','/conversations');

 assert.equal(conversations.status, 200);
 assert.equal(conversations.body.conversations.length, 1);
 assert.equal(conversations.body.conversations[0].friendType, 'full_time');
 assert.equal(conversations.body.conversations[0].canMessage, true);
});


test('matchday friends lock outside a shared live matchday and unlock during it', async () => {
 const { member, call, db } = setup();

 const a = await member('matchday-a');
 const b = await member('matchday-b');

 const bFriendId = db.prepare(
  'SELECT friend_id FROM community_members WHERE id=?'
 ).get(b).friend_id;

 assert.equal(
  (await call('matchday-a','/friend-request',{
   target:b,
   friendType:'matchday',
   lookup:bFriendId
  })).status,
  200
 );

 const incoming = (await call('matchday-b','/friends')).body.relationships[0];

 assert.equal(incoming.friendType, 'matchday');

 assert.equal(
  (await call('matchday-b','/relationship',{
   id:incoming.id,
   action:'accept'
  })).status,
  200
 );

 // No live presence: Matchday Friend messaging is locked.
 assert.equal(
  (await call('matchday-a','/message',{
   target:b,
   body:'Are you here?'
  })).status,
  403
 );

 assert.equal(
  (await call(
   'matchday-a',
   '/messages?friend=' + encodeURIComponent(b)
  )).status,
  403
 );

 let conversations = await call('matchday-a','/conversations');

 assert.equal(
  conversations.body.conversations[0].friendType,
  'matchday'
 );

 assert.equal(
  conversations.body.conversations[0].canMessage,
  false
 );

 // Both supporters enter the same verified normal Matchday window.
 assert.equal(
  (await call('matchday-a','/presence',{
   fixtureId:fixture.id,
   ...coords
  })).status,
  200
 );

 assert.equal(
  (await call('matchday-b','/presence',{
   fixtureId:fixture.id,
   ...coords
  })).status,
  200
 );

 conversations = await call('matchday-a','/conversations');

 assert.equal(
  conversations.body.conversations[0].canMessage,
  true
 );

 assert.equal(
  (await call('matchday-a','/message',{
   target:b,
   body:'Now I can message you'
  })).status,
  200
 );

 // Expiring either presence locks Matchday messaging again.
 db.prepare(
  'UPDATE community_presence SET expires_at=0 WHERE member_id=?'
 ).run(b);

 assert.equal(
  (await call('matchday-a','/message',{
   target:b,
   body:'This should now be locked'
  })).status,
  403
 );
});


test('Community messages reject phone numbers without blocking ordinary football numbers', async () => {
 const { member, call, db } = setup();

 const a = await member('phone-a');
 const b = await member('phone-b');

 const bFriendId = db.prepare(
  'SELECT friend_id FROM community_members WHERE id=?'
 ).get(b).friend_id;

 assert.equal(
  (await call('phone-a','/friend-request',{
   target:b,
   friendType:'full_time',
   lookup:bFriendId
  })).status,
  200
 );

 const incoming = (await call('phone-b','/friends')).body.relationships[0];

 assert.equal(
  (await call('phone-b','/relationship',{
   id:incoming.id,
   action:'accept'
  })).status,
  200
 );

 for (const body of [
  '07123 456789',
  '+44 7123 456789',
  '07123-456-789',
  'Call me on (07123) 456789'
 ]) {
  const result = await call('phone-a','/message',{ target:b, body });

  assert.equal(
   result.status,
   400,
   `expected phone-like message to be rejected: ${body}`
  );
 }

 for (const body of [
  'We won 3-1',
  'Kickoff 19:45',
  'The match is 03/10/2026'
 ]) {
  const result = await call('phone-a','/message',{ target:b, body });

  assert.equal(
   result.status,
   200,
   `expected harmless football message to be allowed: ${body}`
  );
 }
});


test('existing relationship rows default safely to Matchday Friend', async () => {
 const { member, db } = setup();

 const a = await member('legacy-a');
 const b = await member('legacy-b');

 db.prepare(`
  INSERT INTO community_relationships(id,sender,recipient,status)
  VALUES(?,?,?,'accepted')
 `).run('legacy-relationship', a, b);

 const relationship = db.prepare(`
  SELECT friend_type
  FROM community_relationships
  WHERE id='legacy-relationship'
 `).get();

 assert.equal(relationship.friend_type, 'matchday');
});

test('Matchday Experience is explicit, any-distance, snapshot-based and separate from normal presence', async () => {
  const { member, call, db } = setup();

  const a = await member('experience-a');
  const b = await member('experience-b');

  // Starting Matchday Experience itself does not require GPS.
  // Location sharing remains a separate privacy-controlled action.
  const noLocation = await member('experience-no-location');

  const noLocationStart = await call(
    'experience-no-location',
    '/experience',
    { fixtureId: fixture.id, supporter: 'away' }
  );

  assert.equal(noLocationStart.status, 200);
  assert.equal(noLocationStart.body.experience.supporter, 'away');
  assert.equal(noLocationStart.body.experience.fixtureId, fixture.id);
  assert.equal(noLocationStart.body.experience.latitude, null);
  assert.equal(noLocationStart.body.experience.longitude, null);

  assert.equal(
    db.prepare(
      'SELECT count(*) n FROM community_matchday_experience_sessions WHERE member_id=?'
    ).get(noLocation).n,
    1
  );

  const farA = {
    latitude: 51.5074,
    longitude: -0.1278,
    accuracy: 12
  };

  const farB = {
    latitude: 55.9533,
    longitude: -3.1883,
    accuracy: 18
  };

  // These locations are deliberately nowhere near the test stadium.
  // Experience uses its extended lifecycle, not the normal two-mile rule.
  let result = await call('experience-a', '/experience', {
    fixtureId: fixture.id,
    ...farA
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.experience.fixtureId, fixture.id);
  assert.equal(result.body.experience.latitude, farA.latitude);
  assert.equal(result.body.experience.longitude, farA.longitude);

  result = await call('experience-b', '/experience', {
    fixtureId: fixture.id,
    ...farB
  });

  assert.equal(result.status, 200);

  let discover = await call(
    'experience-a',
    '/experience/discover'
  );

  assert.equal(discover.status, 200);
  assert.equal(discover.body.people.length, 1);
  assert.equal(discover.body.people[0].profile.id, b);
  assert.equal(
    discover.body.people[0].latitude,
    farB.latitude
  );
  assert.equal(
    discover.body.people[0].longitude,
    farB.longitude
  );

  // Social Experience discovery must not depend on GPS or the
  // location-sharing preference. The no-location supporter joined
  // the same verified Experience without supplying coordinates.
  db.prepare(
    'UPDATE community_members SET location_visible=0 WHERE id=?'
  ).run(noLocation);

  let socialDiscover = await call(
    'experience-a',
    '/experience/supporters'
  );

  assert.equal(socialDiscover.status, 200);
  assert.ok(
    socialDiscover.body.people.some(
      person => person.profile.id === noLocation
    )
  );

  socialDiscover = await call(
    'experience-no-location',
    '/experience/supporters'
  );

  assert.equal(socialDiscover.status, 200);
  assert.ok(
    socialDiscover.body.people.some(
      person => person.profile.id === a
    )
  );
  assert.ok(
    socialDiscover.body.people.some(
      person => person.profile.id === b
    )
  );

  // A Matchday Friend request through a shared active Experience
  // also must not require the target to expose location.
  result = await call(
    'experience-a',
    '/friend-request',
    {
      target: noLocation,
      friendType: 'matchday'
    }
  );

  assert.equal(result.status, 200);

  // Normal Matchday cleanup must NOT finish an Experience.
  await call('experience-a', '/presence', undefined, 'DELETE');

  assert.equal(
    db.prepare(
      'SELECT count(*) n FROM community_matchday_experience_sessions WHERE member_id=?'
    ).get(a).n,
    1
  );

  // Location changes only when explicitly requested.
  const updated = {
    latitude: 52.4862,
    longitude: -1.8904,
    accuracy: 10
  };

  result = await call(
    'experience-a',
    '/experience/location',
    updated
  );

  assert.equal(result.status, 200);

  const stored = db.prepare(
    `SELECT latitude,longitude
     FROM community_matchday_experience_sessions
     WHERE member_id=?`
  ).get(a);

  assert.equal(stored.latitude, updated.latitude);
  assert.equal(stored.longitude, updated.longitude);

  // Explicit Finish removes the snapshot.
  assert.equal(
    (await call(
      'experience-a',
      '/experience',
      undefined,
      'DELETE'
    )).status,
    200
  );

  assert.equal(
    db.prepare(
      'SELECT count(*) n FROM community_matchday_experience_sessions WHERE member_id=?'
    ).get(a).n,
    0
  );

  discover = await call(
    'experience-b',
    '/experience/discover'
  );

  assert.equal(discover.body.people.length, 0);
});


test('Matchday Experience reminders extend safely and location updates preserve expiry', async () => {
  const { member, call, db, env } = setup();

  const a = await member('experience-reminder');

  let result = await call(
    'experience-reminder',
    '/experience',
    {
      fixtureId: fixture.id,
      supporter: 'away'
    }
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.experience.supporter, 'away');

  // Trusted European-away metadata permits the original long reminders.
  result = await call(
    'experience-reminder',
    '/experience/reminder',
    { hours: 60 }
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.experience.reminderHours, 60);

  const extendedExpiry = db.prepare(
    `SELECT expires_at
     FROM community_matchday_experience_sessions
     WHERE member_id=?`
  ).get(a).expires_at;

  assert.equal(
    extendedExpiry,
    result.body.experience.expiresAt
  );

  // Updating optional GPS must not reset the session to kickoff +11h.
  result = await call(
    'experience-reminder',
    '/experience/location',
    {
      latitude: 52.5,
      longitude: -1.9,
      accuracy: 10
    }
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.experience.expiresAt, extendedExpiry);

  assert.equal(
    db.prepare(
      `SELECT expires_at
       FROM community_matchday_experience_sessions
       WHERE member_id=?`
    ).get(a).expires_at,
    extendedExpiry
  );

  // Arbitrary reminder lengths are never accepted.
  assert.equal(
    (await call(
      'experience-reminder',
      '/experience/reminder',
      { hours: 12 }
    )).status,
    403
  );

  // Long European reminders fail closed if trusted fixture metadata
  // does not independently prove European-away status.
  env.COMMUNITY_FIXTURES = {
    async fetch() {
      return Response.json({
        fixtures: [{
          ...fixture,
          homeClubId: undefined,
          awayClubId: undefined,
          competition: undefined
        }]
      });
    }
  };

  assert.equal(
    (await call(
      'experience-reminder',
      '/experience/reminder',
      { hours: 24 }
    )).status,
    403
  );

  // Standard reminders remain valid without the extra European metadata.
  assert.equal(
    (await call(
      'experience-reminder',
      '/experience/reminder',
      { hours: 8 }
    )).status,
    200
  );
});

test('Matchday Friend messaging works during a shared active Matchday Experience', async () => {
  const { member, call, db } = setup();

  const a = await member('experience-friend-a');
  const b = await member('experience-friend-b');

  const bFriendId = db.prepare(
    'SELECT friend_id FROM community_members WHERE id=?'
  ).get(b).friend_id;

  assert.equal(
    (await call(
      'experience-friend-a',
      '/friend-request',
      {
        target: b,
        friendType: 'matchday',
        lookup: bFriendId
      }
    )).status,
    200
  );

  const incoming = (
    await call('experience-friend-b', '/friends')
  ).body.relationships[0];

  assert.equal(
    (await call(
      'experience-friend-b',
      '/relationship',
      {
        id: incoming.id,
        action: 'accept'
      }
    )).status,
    200
  );

  // No normal presence and no Experience: locked.
  assert.equal(
    (await call(
      'experience-friend-a',
      '/message',
      {
        target: b,
        body: 'Before Experience'
      }
    )).status,
    403
  );

  assert.equal(
    (await call(
      'experience-friend-a',
      '/experience',
      {
        fixtureId: fixture.id,
        latitude: 51.5,
        longitude: -0.12,
        accuracy: 10
      }
    )).status,
    200
  );

  assert.equal(
    (await call(
      'experience-friend-b',
      '/experience',
      {
        fixtureId: fixture.id,
        latitude: 55.95,
        longitude: -3.18,
        accuracy: 10
      }
    )).status,
    200
  );

  // Same verified fixture, any distance.
  assert.equal(
    (await call(
      'experience-friend-a',
      '/message',
      {
        target: b,
        body: 'Experience is active'
      }
    )).status,
    200
  );

  await call(
    'experience-friend-b',
    '/experience',
    undefined,
    'DELETE'
  );

  assert.equal(
    (await call(
      'experience-friend-a',
      '/message',
      {
        target: b,
        body: 'Experience finished'
      }
    )).status,
    403
  );
});

test('Matchday Experience rejects invalid location and closes when Community is disabled', async () => {
  const { member, call, db } = setup();

  const a = await member('experience-private');

  assert.equal(
    (await call(
      'experience-private',
      '/experience',
      {
        fixtureId: fixture.id,
        latitude: 999,
        longitude: -1,
        accuracy: 5
      }
    )).status,
    400
  );

  assert.equal(
    (await call(
      'experience-private',
      '/experience',
      {
        fixtureId: fixture.id,
        latitude: 52,
        longitude: -1,
        accuracy: 10
      }
    )).status,
    200
  );

  assert.equal(
    db.prepare(
      'SELECT count(*) n FROM community_matchday_experience_sessions WHERE member_id=?'
    ).get(a).n,
    1
  );

  await call('experience-private', '/preferences', {
    enabled: false,
    locationVisible: false,
    shareGames: false,
    shareGrounds: false,
    photoSharing: false
  });

  assert.equal(
    db.prepare(
      'SELECT count(*) n FROM community_matchday_experience_sessions WHERE member_id=?'
    ).get(a).n,
    0
  );
});
