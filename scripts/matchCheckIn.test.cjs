const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname, '..');
const ts=require(root+'/node_modules/typescript');
let now=Date.parse('2026-09-20T13:30:00Z'),handler,started=false,registrations=0,background=true,notify=true,services=true,failStart=false;
const data=new Map(), notices=new Map(); let seq=0;
class Clock extends Date {constructor(...a){super(...(a.length?a:[now]));}static now(){return now;}}
const storage={getItem:async k=>data.get(k)??null,setItem:async(k,v)=>data.set(k,v)};
const location={getBackgroundPermissionsAsync:async()=>({granted:background}),hasServicesEnabledAsync:async()=>services,hasStartedGeofencingAsync:async()=>started,stopGeofencingAsync:async()=>{started=false},startGeofencingAsync:async(t,r)=>{if(failStart)throw Error('native failure');registrations++;started=true;location.regions=r},GeofencingEventType:{Enter:1,Exit:2}};
const notifications={getPermissionsAsync:async()=>({granted:notify}),scheduleNotificationAsync:async n=>{const id=String(++seq);notices.set(id,n);return id},cancelScheduledNotificationAsync:async id=>notices.delete(id),SchedulableTriggerInputTypes:{DATE:'date'}};
const cache={};function load(name){if(cache[name])return cache[name];const exports={};cache[name]=exports;const code=ts.transpileModule(fs.readFileSync(root+'/lib/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;vm.runInNewContext(code,{exports,require:n=>n.includes('async-storage')?storage:n==='expo-location'?location:n==='expo-notifications'?notifications:n==='expo-task-manager'?{defineTask:(name,fn)=>handler=fn}:load(n.replace(/^\.\//,'').replace('@/lib/','')),Date:Clock,console,Set,Map});return exports;}
const m=load('matchCheckIn');
const row=(extra={})=>({date:'2026-09-20',kickoff:'2026-09-20T14:00:00Z',homeName:'Brighton',awayName:'Arsenal',venue:null,competition:'Premier League',...extra});
const event=async(type,key)=>handler({data:{eventType:type,region:{identifier:key}}});
(async()=>{
 const fixtures=m.buildMatchCheckInFixtures([row({date:'2026-09-27',kickoff:'2026-09-27T14:00:00Z'}),row()], 'Brighton & Hove Albion');
 assert.equal(fixtures.length,2);assert.equal(fixtures[0].date,'2026-09-20');assert.equal(fixtures[0].ground,'American Express Stadium');
 assert.equal(m.matchKickoffMs(fixtures[0]),Date.parse('2026-09-20T14:00:00Z'));
 assert.equal(m.buildMatchCheckInFixtures([row({venue:'Unknown Neutral Ground'})],'Brighton').length,0);
 assert.equal(m.buildMatchCheckInFixtures([row({round:'Final'})],'Brighton').length,0);
 assert.equal(m.buildMatchCheckInFixtures([row({status:'STATUS_POSTPONED'})],'Brighton').length,0);
 assert.notEqual(fixtures[0].key,m.buildMatchCheckInFixtures([row()],'Arsenal')[0].key);
 await m.setMatchCheckInEnabled(true);await m.configureMatchGeofences(fixtures);assert.equal(location.regions.length,2);assert.equal(location.regions[0].radius,966);
 await m.configureMatchGeofences(fixtures);assert.equal(registrations,1);
 notify=false;await assert.rejects(m.configureMatchGeofences(fixtures),/notifications/);notify=true;
 background=false;await assert.rejects(m.configureMatchGeofences(fixtures),/Always/);background=true;
 services=false;await assert.rejects(m.configureMatchGeofences(fixtures),/Location Services/);services=true;
 const key=fixtures[0].key;await event(1,key);assert.equal([...notices.values()].filter(n=>n.trigger===null).length,1);
 await event(1,key);assert.equal([...notices.values()].filter(n=>n.trigger===null).length,1);
 await event(2,key);await event(1,key);assert.equal([...notices.values()].filter(n=>n.trigger===null).length,2);
 await m.acknowledgeAndCancelMatchCheckIn(key);const count=notices.size;await event(1,key);assert.equal(notices.size,count);
 await m.configureMatchGeofences(fixtures);assert.equal(location.regions.length,1);
 await m.setMatchCheckInEnabled(false);assert.equal(started,false);
 data.clear();notices.clear();await m.setMatchCheckInEnabled(true);
 now=Date.parse('2026-09-20T11:00:00Z');await m.configureMatchGeofences(fixtures);await event(1,key);
 assert.equal(notices.size,3);assert.equal([...notices.values()].filter(n=>n.trigger===null).length,0);
 await event(2,key);assert.equal(notices.size,0);
 failStart=true;await assert.rejects(m.configureMatchGeofences([fixtures[1]]),/native failure/);failStart=false;await m.configureMatchGeofences([fixtures[1]]);
 // Legacy answers survive the new club-scoped identifier without suppressing another club.
 data.clear();await m.setMatchCheckInEnabled(true);now=Date.parse('2026-09-20T13:30:00Z');
 const old={...fixtures[0],key:'next|2026-09-20|arsenal'};
 data.set(m.MATCH_CHECKIN_FIXTURES_KEY,JSON.stringify([old]));
 data.set(m.MATCH_CHECKIN_ACK_KEY,JSON.stringify([old.key]));
 await m.configureMatchGeofences(fixtures);assert.equal(await m.isMatchCheckInAcknowledged(fixtures[0].key),true);
 assert.equal(location.regions.length,1);
 // Concurrent native events must not overwrite each other's stored presence.
 data.clear();notices.clear();await m.setMatchCheckInEnabled(true);await m.configureMatchGeofences(fixtures);
 await Promise.all(fixtures.map(f=>event(1,f.key)));
 assert.equal(Object.keys(JSON.parse(data.get(m.MATCH_CHECKIN_PRESENCE_KEY))).length,2);
 // Notification scheduling failures remain retryable after presence is written.
 await event(2,key);const schedule=notifications.scheduleNotificationAsync;
 notifications.scheduleNotificationAsync=async()=>{throw Error('notification failure')};
 await assert.rejects(event(1,key),/notification failure/);notifications.scheduleNotificationAsync=schedule;
 const beforeRetry=seq;await event(1,key);assert.ok(seq>beforeRetry);
 // Exercise the actual React effect without opening Matchday Experience.
 data.clear();await m.setMatchCheckInEnabled(true);
 let timer,resume,cleanup,pending=null,distance=5,removed=false;
 const appState={currentState:'active',addEventListener:(_,fn)=>{resume=fn;return {remove:()=>{removed=true}}}};
 location.Accuracy={Balanced:3};location.getCurrentPositionAsync=async()=>({coords:{latitude:1,longitude:1}});
 const source=fs.readFileSync(root+'/app/index.tsx','utf8');
 const start=source.indexOf('  useEffect(() => {\n    if (!storageReady || !matchCheckInEnabled)');
 const end=source.indexOf('  useEffect(() => {\n    const processResponse',start);
 assert.ok(start>=0 && end>start);
 assert.ok(source.includes('if (!matchCheckInEnabled && activeTab !=='));
 assert.ok(source.includes('[activeTab, loadFixtures, matchCheckInEnabled]'));
 const effect=ts.transpileModule(source.slice(start,end),{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(effect,{...m,Date:Clock,console,Error,Location:location,AppState:appState,
  storageReady:true,matchCheckInEnabled:true,favouriteClub:{id:'brighton',name:'Brighton & Hove Albion'},
  PLACEHOLDER_CLUB_ID:'none',seasonFixtures:[row()],checkInPromptedRef:{current:new Set()},
  setMatchCheckInIssue:()=>{},setPendingMatchCheckIn:fn=>{pending=fn(pending)},distanceMiles:()=>distance,
  useEffect:fn=>{cleanup=fn()},setInterval:fn=>{timer=fn;return 1},clearInterval:()=>{}});
 const flush=()=>new Promise(resolve=>setImmediate(resolve));await flush();assert.equal(pending,null);
 distance=0.1;timer();await flush();assert.equal(pending?.date,'2026-09-20');
 pending=null;resume('active');await flush();assert.equal(pending,null);
 cleanup();assert.equal(removed,true);
 console.log('PASS: migration, concurrent events, failed notification retry and automatic foreground arrival/resume without Matchday Experience');
 console.log('PASS: aliases, ISO time, sorting, neutral venues, postponed games, scoped IDs, preregistration, idempotence, permission failures, enter/duplicate/exit/re-entry, acknowledgement, disable, early arrival/cancellation and registration retry');
})().catch(e=>{console.error(e);process.exitCode=1});
