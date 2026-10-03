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
