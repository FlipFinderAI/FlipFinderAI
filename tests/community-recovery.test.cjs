const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, file);
const { communityFetch } = require('../private-demo-service/src/community.ts');
function setup() {
 const db = new DatabaseSync(':memory:');
 const dir = path.join(__dirname, '../private-demo-service/migrations');
 for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) db.exec(fs.readFileSync(path.join(dir, file), 'utf8'));
 function prepare(query) {
  let args = [];
  return { bind(...values) { args = values; return this; },
   async first() { return db.prepare(query).get(...args) || null; },
   async all() { return { results: db.prepare(query).all(...args) }; },
   async run() { return { meta: { changes: Number(db.prepare(query).run(...args).changes) } }; }
  };
 }
 const env = { DB: { prepare, async batch(stmts) { db.exec('BEGIN'); try { for (const s of stmts) await s.run(); db.exec('COMMIT'); } catch(e) { db.exec('ROLLBACK'); throw e; } } },
 COMMUNITY_AUTH: { async fetch(r) { return Response.json({ subject: r.headers.get('authorization').slice(7), emailVerified: true, communityEligible: true, isChild: false }); } } };
 async function call(user, route, data, method) {
  const response = await communityFetch(new Request('https://test/api/community' + route, { method: method || (data === undefined ? 'GET' : 'POST'), headers: user ? { authorization: 'Bearer ' + user } : {}, body: data === undefined ? undefined : JSON.stringify(data) }), env);
  return { status: response.status, body: await response.json() };
 }
 async function member(user) {
  const result = await call(user, '/profile', { displayName: user, avatar: '⚽', clubId: 'club-a', gamesAttended: 3, groundsVisited: ['Private Ground'] });
  assert.equal(result.status, 200);
  assert.equal((await call(user, '/preferences', { enabled: true, locationVisible: false, shareGames: false, shareGrounds: false, photoSharing: false })).status, 200);
  return result.body.profile.id;
 }
 return { db, env, call, member };
}
test('blocked routes require authentication and only expose outgoing block identities', async () => {
 const { db, call, member, env } = setup();
 try {
  const a = await member('a'), b = await member('b'), c = await member('c');
  await call('a', '/block', { target: b });
  await call('c', '/block', { target: a });
  assert.equal((await call(null, '/blocked')).status, 401);
  assert.equal((await call(null, '/unblock', { target: b })).status, 401);
  const result = await call('a', '/blocked?blocker=' + c);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.blocked.map(p => p.id), [b]);
  assert.deepEqual(Object.keys(result.body.blocked[0]).sort(), ['displayName', 'friendId', 'id']);
  assert.deepEqual((await call('b', '/blocked')).body.blocked, []);
  env.COMMUNITY_AUTH.fetch = async () => Response.json({ subject: 'a', emailVerified: false, communityEligible: true, isChild: false });
  assert.equal((await call('a', '/blocked')).status, 403);
  assert.equal((await call('a', '/unblock', { target: b })).status, 403);
 } finally { db.close(); }
});
test('unblock is owner-scoped, idempotent and preserves reciprocal blocks', async () => {
 const { db, call, member } = setup();
 try {
  const a = await member('a'), b = await member('b'), c = await member('c');
  await call('a', '/block', { target: b });
  await call('b', '/block', { target: a });
  await call('c', '/unblock', { target: b, blocker: a });
  assert.equal(db.prepare('SELECT count(*) n FROM community_blocks').get().n, 2);
  for (const target of [undefined, '', ' ', 12, a]) assert.equal((await call('a', '/unblock', { target })).status, 400);
  assert.equal((await call('a', '/unblock', { target: b, blocker: b })).status, 200);
  assert.equal((await call('a', '/unblock', { target: b })).status, 200);
  assert.equal(db.prepare('SELECT count(*) n FROM community_blocks WHERE blocker=? AND blocked=?').get(b, a).n, 1);
  assert.equal((await call('a', '/friend-request', { target: b, friendType: 'full_time', lookup: 'b' })).status, 409);
 } finally { db.close(); }
});
test('recovery preserves messages and privacy and requires a fresh accepted friendship', async () => {
 const { db, call, member } = setup();
 try {
  const a = await member('alice'), b = await member('bob');
  assert.equal((await call('alice', '/friend-request', { target: b, friendType: 'full_time', lookup: 'bob' })).status, 200);
  const old = (await call('bob', '/friends')).body.relationships[0];
  await call('bob', '/relationship', { id: old.id, action: 'accept' });
  assert.equal((await call('alice', '/message', { target: b, body: 'Keep this message' })).status, 200);
  const messages = db.prepare('SELECT * FROM community_messages').all();
  const preferences = db.prepare('SELECT * FROM community_members ORDER BY id').all();
  await call('alice', '/block', { target: b });
  assert.deepEqual((await call('alice', '/friend-search?q=bob')).body.people, []);
  await call('alice', '/unblock', { target: b });
  assert.deepEqual((await call('alice', '/friends')).body.relationships, []);
  assert.equal((await call('alice', '/message', { target: b, body: 'Still forbidden' })).status, 403);
  assert.deepEqual(db.prepare('SELECT * FROM community_messages').all(), messages);
  assert.deepEqual(db.prepare('SELECT * FROM community_members ORDER BY id').all(), preferences);
  assert.equal((await call('alice', '/friend-search?q=bob')).body.people[0].id, b);
  assert.equal((await call('alice', '/friend-request', { target: b, friendType: 'full_time', lookup: 'bob' })).status, 200);
  const fresh = (await call('bob', '/friends')).body.relationships[0];
  assert.notEqual(fresh.id, old.id);
  assert.equal(fresh.status, 'pending');
  assert.equal((await call('alice', '/message', { target: b, body: 'Not accepted yet' })).status, 403);
  await call('bob', '/relationship', { id: fresh.id, action: 'accept' });
  assert.equal((await call('alice', '/message', { target: b, body: 'Friends again' })).status, 200);
 } finally { db.close(); }
});
