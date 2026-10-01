const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const ts = require(root + '/node_modules/typescript');
const cache = {};
let fixtures = [];
function load(name) {
  if (cache[name]) return cache[name];
  const exports = {};
  cache[name] = exports;
  const code = ts.transpileModule(fs.readFileSync(root + '/lib/' + name + '.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { exports, console: { log() {}, warn() {} }, Date, Set, Map,
    require: n => n === '@react-native-ml-kit/text-recognition' ? {} :
      n === './fixtureCache' ? { fetchAndCacheFixtures: async () => fixtures } :
      load(n.replace(/^\.\//, '').replace('@/lib/', '')),
  });
  return exports;
}
const { venueForFixture } = load('clubGroundMatching');
const fixture = { homeName: 'Chelsea', date: '2026-04-26', season: '2025-2026', competition: 'FA Cup', round: 'Semi-finals' };
assert.equal(venueForFixture(fixture), 'Wembley Stadium');
for (const round of ['Semi-final', 'Semi Final', 'Semifinals', 'Final']) {
  assert.equal(venueForFixture({ ...fixture, round }), 'Wembley Stadium');
}
assert.equal(venueForFixture({ ...fixture, season: '2006-2007', date: '2007-04-15' }), null);
assert.equal(venueForFixture({ ...fixture, season: '2006-2007', date: '2007-05-19', round: 'Final' }), 'Wembley Stadium');
assert.equal(venueForFixture({ ...fixture, season: '2005-2006', round: 'Final' }), null);
assert.equal(venueForFixture({ ...fixture, venue: 'Millennium Stadium' }), 'Millennium Stadium');
assert.equal(venueForFixture({ ...fixture, competition: 'League Cup' }), null);
assert.equal(venueForFixture({ ...fixture, round: 'Semi-final replay' }), null);
assert.notEqual(venueForFixture({ ...fixture, round: 'Quarter-final' }), 'Wembley Stadium');
assert.equal(venueForFixture({ ...fixture, season: undefined }), 'Wembley Stadium');
assert.equal(venueForFixture({ ...fixture, season: 'invalid' }), null);
assert.equal(venueForFixture({ ...fixture, season: undefined, date: 'invalid' }), null);
assert.equal(venueForFixture({ ...fixture, competition: 'Premier League', round: null }), 'Stamford Bridge');
(async () => {
  fixtures = [{ fixtureId: 'chelsea-leeds', opponent: 'Leeds United', homeAway: 'home', date: '2026-04-26', season: '2025-2026', competition: 'FA Cup', round: 'Semi-finals', venue: null }];
  const { recogniseFromText } = load('ticketRecognition');
  const result = await recogniseFromText('Chelsea v Leeds United\nFA Cup Semi-final\n26 April 2026\nKick off 15:00\nBlock 101 Row 10 Seat 20', 'Chelsea', '2025/26');
  assert.equal(result.fixtureBacked, true);
  assert.equal(result.ground, 'Wembley Stadium');
  fixtures[0] = { ...fixtures[0], competition: 'League Cup' };
  const unknown = await recogniseFromText('Chelsea v Leeds United\nLeague Cup Semi-final\n26 April 2026\nBlock 101 Row 10 Seat 20', 'Chelsea', '2025/26');
  assert.equal(unknown.fixtureBacked, true);
  assert.equal(unknown.ground, null);
  console.log('PASS: Wembley boundaries, explicit venues, excluded rounds, ordinary home fixtures, and OCR fixture-to-ground integration');
})().catch(e => { console.error(e); process.exitCode = 1; });
