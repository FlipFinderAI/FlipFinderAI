type D1Result = { meta: { changes: number } };
type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  run: () => Promise<D1Result>;
  first: <T>() => Promise<T | null>;
};
type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
};

type Env = {
  DB: D1Database;
  OWNER_CODE: string;
  PUBLIC_ORIGIN: string;
};

type DemoRow = {
  payload: string;
  expires_at: string;
  redeemed_at: string | null;
  session_hash: string | null;
};

const encoder = new TextEncoder();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function cookie(request: Request, name: string) {
  const raw = request.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return "";
}

function validSnapshot(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return item.schemaVersion === 1 && item.viewerName === "David Batty" && Array.isArray(item.tickets);
}

async function createDemo(request: Request, env: Env) {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!supplied || (await sha256(supplied)) !== (await sha256(env.OWNER_CODE))) {
    return json({ error: "Owner code not accepted." }, 401);
  }
  const raw = await request.text();
  if (raw.length > 750_000) return json({ error: "Demo data is too large." }, 413);
  let payload: unknown;
  try { payload = JSON.parse(raw); } catch { return json({ error: "Invalid demo data." }, 400); }
  if (!validSnapshot(payload)) return json({ error: "Invalid demo snapshot." }, 400);

  const token = randomToken();
  const tokenHash = await sha256(token);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  await env.DB.prepare(
    "INSERT INTO demos (token_hash, payload, created_at, expires_at) VALUES (?, ?, ?, ?)",
  ).bind(tokenHash, raw, createdAt.toISOString(), expiresAt.toISOString()).run();
  const origin = env.PUBLIC_ORIGIN.replace(/\/$/, "");
  return json({ url: `${origin}/d/${token}`, expiresAt: expiresAt.toISOString() }, 201);
}

async function viewDemo(request: Request, env: Env, token: string) {
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(token)) return expiredPage();
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    "SELECT payload, expires_at, redeemed_at, session_hash FROM demos WHERE token_hash = ?",
  ).bind(tokenHash).first<DemoRow>();
  if (!row || Date.parse(row.expires_at) <= Date.now()) return expiredPage();

  const existingSession = cookie(request, "tf_demo_session");
  if (row.redeemed_at) {
    if (!existingSession || !row.session_hash || (await sha256(existingSession)) !== row.session_hash) {
      return expiredPage("This private link has already been opened in another browser.");
    }
    return demoPage(row.payload);
  }

  const session = randomToken();
  const sessionHash = await sha256(session);
  const redeemedAt = new Date().toISOString();
  const update = await env.DB.prepare(
    "UPDATE demos SET redeemed_at = ?, session_hash = ? WHERE token_hash = ? AND redeemed_at IS NULL",
  ).bind(redeemedAt, sessionHash, tokenHash).run();
  if (!update.meta.changes) return expiredPage("This private link has already been opened.");
  const response = demoPage(row.payload);
  response.headers.append(
    "set-cookie",
    `tf_demo_session=${encodeURIComponent(session)}; Path=/d/${token}; Max-Age=31536000; HttpOnly; Secure; SameSite=Strict`,
  );
  return response;
}

function pageHeaders() {
  return {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store, private",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  };
}

function expiredPage(message = "This private demo link is invalid or has expired.") {
  return new Response(`<!doctype html><meta name="viewport" content="width=device-width"><style>body{margin:0;background:#10261c;color:#f7f1e3;font:16px system-ui;display:grid;place-items:center;min-height:100vh}.c{max-width:430px;padding:36px;text-align:center}b{color:#d5aa43;font:800 25px Georgia}</style><div class="c"><b>Ticket Frame</b><p>${message}</p></div>`, { status: 410, headers: pageHeaders() });
}

function demoPage(payload: string) {
  const safePayload = payload.replace(/</g, "\\u003c").replace(/-->/g, "--\\u003e");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><meta name="robots" content="noindex,nofollow,noarchive"><title>Private Ticket Frame Demo</title>
<style>
:root{--club:#174a91;--accent:#e9c46a;--ink:#10261c;--cream:#f4efe4}*{box-sizing:border-box;-webkit-user-select:none;user-select:none}body{margin:0;background:#07140f;color:var(--ink);font:15px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden}.stage{height:100dvh;display:grid;place-items:center;padding:12px}.phone{width:min(430px,100%);height:min(900px,100%);background:var(--cream);border-radius:30px;overflow:hidden;position:relative;box-shadow:0 24px 90px #000b;border:1px solid #ffffff22}.top{height:90px;background:var(--club);color:#fff;padding:24px 22px 12px}.brand{font:800 24px Georgia}.sub{opacity:.75;font-size:11px;letter-spacing:1.5px}.screen{height:calc(100% - 151px);padding:18px;overflow:hidden}.slide{display:none;height:100%;animation:in .5s ease}.slide.on{display:block}@keyframes in{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}h1{font:800 29px Georgia;margin:2px 0 5px}h2{font:800 18px Georgia;margin:0 0 12px}.muted{color:#69746e}.hero{background:linear-gradient(145deg,var(--club),#071c14);color:white;padding:20px;border-radius:20px;margin:15px 0}.big{font:800 46px Georgia;color:var(--accent)}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.stat,.card{background:#fff;border:1px solid #ded7ca;border-radius:14px;padding:12px}.stat b{display:block;font:800 23px Georgia;color:var(--club)}.list{display:grid;gap:8px;margin-top:12px}.row{display:grid;grid-template-columns:58px 1fr auto;gap:9px;align-items:center;background:#fff;border:1px solid #ded7ca;border-radius:12px;padding:10px}.date{font-weight:900;color:var(--club);font-size:12px}.result{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--club);color:#fff;font-weight:900}.frame{border:12px solid #321f16;outline:4px solid #d0a84b;background:#e9e2d4;padding:7px;display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:14px;min-height:360px}.ticket{background:linear-gradient(155deg,#fff,var(--accent));border:1px dashed var(--club);padding:7px;min-height:96px;font-size:9px;overflow:hidden}.ticket b{display:block;font-size:11px;color:var(--club);margin-bottom:5px}.nav{height:61px;display:flex;background:#fff;border-top:1px solid #ddd;justify-content:space-around;padding:8px 3px}.nav span{font-size:9px;text-align:center;color:#68736d}.nav b{display:block;font-size:19px;color:var(--club)}.controls{position:absolute;left:14px;right:14px;bottom:72px;background:#07140fe8;color:white;border-radius:99px;padding:8px 12px;display:flex;align-items:center;gap:10px;z-index:5;transition:.25s}.controls.idle{opacity:0}.controls button{border:0;background:var(--accent);width:34px;height:34px;border-radius:50%;font-size:16px}.bar{height:3px;flex:1;background:#ffffff44;border-radius:3px}.progress{height:100%;background:var(--accent);width:0}.watermark{position:absolute;inset:auto 0 100px;transform:rotate(-24deg);font:900 22px Georgia;color:#173f3022;text-align:center;pointer-events:none;z-index:4}.privacy{position:fixed;inset:0;background:#07140f;color:#fff;display:none;place-items:center;text-align:center;padding:35px;z-index:20}.privacy.on{display:grid}.pill{display:inline-block;background:#fff2;padding:5px 9px;border-radius:99px;font-size:11px}.ground{font-size:38px;margin:16px 0}.table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden}.table td{padding:8px;border-bottom:1px solid #eee;font-size:12px}.table tr:first-child{background:var(--club);color:white;font-weight:900}
</style></head><body><div class="stage"><main class="phone" id="phone"><header class="top"><div class="brand">Ticket Frame</div><div class="sub">PRIVATE VIEW-ONLY DEMO</div></header><section class="screen" id="screen"></section><div class="watermark">PRIVATE · DAVID BATTY · DO NOT FORWARD</div><div class="controls" id="controls"><button id="toggle">Ⅱ</button><div class="bar"><div class="progress" id="progress"></div></div><span id="counter">1/7</span></div><nav class="nav"><span><b>▣</b>FRAMES</span><span><b>▤</b>FIXTURES</span><span><b>◷</b>HISTORY</span><span><b>⌖</b>GROUNDS</span><span><b>⚙</b>SETTINGS</span></nav></main></div><div class="privacy" id="privacy"><div><div class="brand">Playback paused</div><p>This private demo pauses whenever the page is hidden or loses focus.</p></div></div>
<script>const D=${safePayload};const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));document.documentElement.style.setProperty('--club',D.club.primary||'#174a91');document.documentElement.style.setProperty('--accent',D.club.secondary||'#e9c46a');const tickets=D.tickets||[],history=D.history||[],fixtures=D.fixtures||[],table=D.table||[];const result=r=>r==='win'?'W':r==='loss'?'L':r==='draw'?'D':'–';const screens=[
()=>'<div class="slide on"><span class="pill">WELCOME, DAVID BATTY</span><h1>Your football life,<br>beautifully framed.</h1><div class="hero"><div class="big">'+tickets.length+'</div><b>tickets in your private collection</b><p>Every match, season and ground in one place.</p></div><div class="stats"><div class="stat"><b>'+new Set(tickets.map(x=>x.season)).size+'</b>Seasons</div><div class="stat"><b>'+new Set(history.map(x=>x.ground).filter(Boolean)).size+'</b>Grounds</div><div class="stat"><b>'+history.length+'</b>Matches</div></div></div>',
()=>'<div class="slide on"><span class="pill">MY FRAME</span><h1>Every ticket together</h1><div class="frame">'+tickets.slice(0,12).map(t=>'<div class="ticket"><b>'+esc(t.homeTeam||D.club.name)+'</b>'+esc(t.awayTeam)+'<br>'+esc(t.matchDate)+'<br>'+esc(t.competition)+'</div>').join('')+'</div></div>',
()=>'<div class="slide on"><span class="pill">WALLET</span><h1>Match tickets</h1><div class="list">'+tickets.slice(0,5).map(t=>'<div class="row"><span class="date">'+esc(t.matchDate.slice(5))+'</span><span><b>'+esc(t.homeTeam)+' v '+esc(t.awayTeam)+'</b><br><small>'+esc(t.ground)+'</small></span><span>›</span></div>').join('')+'</div></div>',
()=>'<div class="slide on"><span class="pill">FIXTURES</span><h1>'+esc(D.club.name)+'</h1><div class="list">'+fixtures.slice(0,6).map(f=>'<div class="row"><span class="date">'+esc((f.date||'').slice(5))+'</span><span><b>'+esc(f.homeName)+' v '+esc(f.awayName)+'</b><br><small>'+esc(f.competition||'')+'</small></span><span>'+esc(f.kickoff||'')+'</span></div>').join('')+'</div></div>',
()=>'<div class="slide on"><span class="pill">FOOTBALL HISTORY</span><h1>Your match archive</h1><div class="list">'+history.slice(0,6).map(h=>'<div class="row"><span class="date">'+esc(h.matchDate.slice(5))+'</span><span><b>'+esc(h.club)+' v '+esc(h.opponent)+'</b><br><small>'+esc(h.competition)+'</small></span><span class="result">'+result(h.result)+'</span></div>').join('')+'</div></div>',
()=>'<div class="slide on"><span class="pill">GROUND TRACKER</span><div class="ground">⌖</div><h1>'+new Set(history.map(x=>x.ground).filter(Boolean)).size+' grounds visited</h1><div class="list">'+[...new Set(history.map(x=>x.ground).filter(Boolean))].slice(0,6).map((g,i)=>'<div class="card"><b>'+(i+1)+'. '+esc(g)+'</b><br><small>Confirmed match visit</small></div>').join('')+'</div></div>',
()=>'<div class="slide on"><span class="pill">MATCH MEMORY</span><h1>The full match day</h1><div class="hero"><h2>Private by design</h2><p>Photos, videos, nearby places, parking, weather and travel sit with the match in the real app.</p><p>This shared demo deliberately contains no personal media or faces.</p></div><div class="card"><b>View only</b><p>Nothing here can be edited, exported or added to a collection.</p></div></div>'
];let i=0,playing=true,start=Date.now(),elapsed=0,duration=7000,timer;const screen=document.querySelector('#screen'),progress=document.querySelector('#progress'),counter=document.querySelector('#counter'),toggle=document.querySelector('#toggle'),controls=document.querySelector('#controls');function render(){screen.innerHTML=screens[i]();counter.textContent=(i+1)+'/'+screens.length;start=Date.now();elapsed=0}function tick(){if(!playing)return;elapsed=Date.now()-start;progress.style.width=Math.min(100,elapsed/duration*100)+'%';if(elapsed>=duration){i=(i+1)%screens.length;render()}timer=requestAnimationFrame(tick)}function pause(){playing=false;cancelAnimationFrame(timer);toggle.textContent='▶'}function play(){if(playing)return;playing=true;start=Date.now()-elapsed;toggle.textContent='Ⅱ';tick()}toggle.onclick=()=>playing?pause():play();document.querySelector('#phone').onclick=e=>{controls.classList.remove('idle');setTimeout(()=>controls.classList.add('idle'),2200)};document.addEventListener('visibilitychange',()=>{const hidden=document.hidden;document.querySelector('#privacy').classList.toggle('on',hidden);if(hidden)pause()});window.addEventListener('blur',pause);document.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('dragstart',e=>e.preventDefault());render();tick();
</script></body></html>`;
  return new Response(html, { headers: pageHeaders() });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/api/demos") return createDemo(request, env);
    const match = request.method === "GET" ? url.pathname.match(/^\/d\/([^/]+)$/) : null;
    if (match) return viewDemo(request, env, match[1]);
    if (url.pathname === "/health") return json({ ok: true });
    return new Response("Not found", { status: 404 });
  },
};
