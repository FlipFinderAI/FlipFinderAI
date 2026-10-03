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
const fixture = { id: 'verified', clubIds: ['club-a'], kickoff: new Date(kickoff).toISOString(), stadium: 'Verified Ground', latitude: 53, longitude: -1 };
const coords = { latitude: 53, longitude: -1, accuracy: 5 };
function setup() {
 const db = new DatabaseSync(':memory:');
 db.exec(fs.readFileSync(require.resolve('../private-demo-service/migrations/0001_community.sql'), 'utf8'));
 function prepare(query) {
  let args = [];
  return { bind(...values) { args = values; return this; },
   async first() { return db.prepare(query).get(...args) || null; },
   async all() { return { results: db.prepare(query).all(...args) }; },
   async run() { return { meta: { changes: Number(db.prepare(query).run(...args).changes) } }; }
  };
 }
 const env = { DB: { prepare, async batch(stmts) { db.exec('BEGIN'); try { const r = []; for (const s of stmts) r.push(await s.run()); db.exec('COMMIT'); return r; } catch(e) { db.exec('ROLLBACK'); throw e; } } },
 COMMUNITY_AUTH: { async fetch(r) { return Response.json({ subject: r.headers.get('authorization').slice(7) }); } },
 COMMUNITY_FIXTURES: { async fetch() { return Response.json({ fixtures: [fixture] }); } } };
 async function call(user, path, data, method) {
  const response = await communityFetch(new Request('https://test/api/community' + path, { method: method || (data ? 'POST' : 'GET'), headers: { authorization: 'Bearer ' + user }, body: data ? JSON.stringify(data) : undefined }), env);
  return { status: response.status, body: await response.json() };
 }
 async function member(user, clubId = 'club-a') {
  const r = await call(user, '/profile', { displayName: user, avatar: '⚽', clubId, gamesAttended: 3, groundsVisited: ['Ground'] });
  assert.equal(r.status, 200);
  await call(user, '/preferences', { enabled: true, locationVisible: true });
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
 assert.equal((await communityFetch(new Request('https://test/api/community/me'), env)).status, 503);
});
test('profile defaults off; eligibility and withdrawal use server state', async () => {
 const { call, db } = setup();
 const r = await call('private-subject', '/profile', { displayName: 'Fan', avatar: '⚽', clubId: 'club-a', gamesAttended: 1, groundsVisited: ['Ground'], email: 'secret', photo: 'secret' });
 assert.deepEqual(r.body.preferences, { enabled: false, locationVisible: false });
 assert.equal(JSON.stringify(r.body).includes('private-subject'), false);
 assert.equal(JSON.stringify(r.body).includes('secret'), false);
 assert.equal((await call('private-subject', '/presence', { fixtureId: fixture.id, ...coords })).status, 403);
 await call('private-subject', '/preferences', { enabled: true, locationVisible: true });
 const p = await call('private-subject', '/presence', { fixtureId: fixture.id, ...coords, kickoff: 'fake' });
 assert.equal(p.status, 200); assert.equal(p.body.presence.onMap, false);
 const stored = db.prepare('SELECT * FROM community_presence').get();
 assert.equal(stored.stadium_lat, fixture.latitude); assert.equal('accuracy' in stored, false);
 await call('private-subject', '/preferences', { enabled: false, locationVisible: false });
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
 assert.equal((await call('a','/friend-request',{ target:c })).status,409);
 assert.equal((await call('a','/friend-request',{ target:b })).status,200);
 const incoming = (await call('b','/friends')).body.relationships[0];
 assert.equal(incoming.incoming,true);
 assert.equal((await call('a','/relationship',{ id:incoming.id, action:'accept' })).status,409);
 assert.equal((await call('b','/relationship',{ id:incoming.id, action:'accept' })).status,200);
 assert.equal((await call('a','/friends')).body.relationships[0].status,'accepted');
 assert.equal((await call('b','/report',{ target:a, reason:'Abuse' })).status,200);
 assert.equal(db.prepare('SELECT count(*) n FROM community_reports').get().n,1);
 await call('b','/block',{ target:a });
 assert.equal((await call('a','/friends')).body.relationships.length,0);
 assert.equal((await call('a','/friend-request',{ target:b })).status,409);
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
     { target:b }
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
   { target:b }
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
