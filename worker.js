const PAIRS = ["btcusdt","ethusdt","solusdt","bnbusdt","xrpusdt"];
const DEFAULT_INTERVAL = "1m";
const ALLOWED_INTERVALS = new Set(["1m","3m","5m","15m","30m","1h","2h","4h","6h","8h","12h","1d","3d","1w","1M"]);
const ADMIN_EMAIL = "devolkscapital@gmail.com";
const SESSION_DAYS = 7;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/health") {
        return json({
          ok:true,
          service:"DevolksCapital",
          storage:!!env.DB,
          time:new Date().toISOString()
        });
      }

      if (url.pathname === "/market") {
        return proxyMarketWebSocket(
          request,
          url.searchParams.get("interval") || DEFAULT_INTERVAL
        );
      }

      if (url.pathname === "/api/klines") {
        return historicalKlines(url);
      }

      if (url.pathname === "/api/admin/login") {
        return adminLogin(request, env);
      }if (url.pathname === "/api/admin/logout") {
        return adminLogout();
      }

      if (url.pathname === "/api/admin/me") {
        return adminMe(request, env);
      }

      if (url.pathname === "/api/admin/state") {
        return adminState(request, env);
      }

      if (url.pathname === "/api/admin/credit") {
        return adminCredit(request, env);
      }

      if (url.pathname === "/api/simulation") {
        return handleSimulation(request, url, env);
      }

      if (url.pathname === "/api/trades") {
        return handleTrades(request, env);
      }

      if (url.pathname === "/api/prices") {
        return json({
          ok:false,
          error:"Live prices are delivered through /market."
        },426);
      }

      return env.ASSETS.fetch(request);

    } catch (e) {
      return json({
        ok:false,
        error:"Server error."
      },500);
    }
  }
};
async function adminLogin(request, env) {

  if(request.method !== "POST") {
    return json({
      ok:false,
      error:"Method not allowed."
    },405);
  }

  let b;

  try {
    b = await request.json();
  } catch {
    return json({
      ok:false,
      error:"Invalid JSON."
    },400);
  }

  const email =
    String(b.email || "").trim().toLowerCase();

  const password =
    String(b.password || "");

  if(
    email !== ADMIN_EMAIL ||
    !env.ADMIN_PASSWORD ||
    !timingSafeEqual(password,env.ADMIN_PASSWORD)
  ) {
    return json({
      ok:false,
      error:"Invalid admin credentials."
    },401);
  }const token = await signSession(
    {
      role:"admin",
      email,
      exp:Date.now() + SESSION_DAYS * 86400000
    },
    env.SESSION_SECRET
  );

  return new Response(
    JSON.stringify({
      ok:true,
      admin:true
    }),
    {
      headers:{
        "Content-Type":"application/json",
        "Set-Cookie":cookie(token)
      }
    }
  );
}


async function adminLogout(){

  return new Response(
    JSON.stringify({ok:true}),
    {
      headers:{
        "Content-Type":"application/json",
        "Set-Cookie":
          "dc_admin=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax"
      }
    }
  );
}
async function adminMe(request,env){

  const s =
    await readAdminSession(request,env);

  return json({
    ok:true,
    admin:!!s,
    email:s?.email || null
  });
}


async function requireAdmin(request,env){

  return await readAdminSession(request,env);

}


async function readAdminSession(request,env){

  const token =
    getCookie(request,"dc_admin");

  if(!token || !env.SESSION_SECRET) {
    return null;
  }

  const s =
    await verifySession(
      token,
      env.SESSION_SECRET
    );

  return
    s?.role === "admin" &&
    s.email === ADMIN_EMAIL
      ? s
      : null;
}async function adminState(request,env){

  const a =
    await requireAdmin(request,env);

  if(!a) {
    return json({
      ok:false,
      error:"Admin authentication required."
    },403);
  }

  if(!env.DB) {
    return json({
      ok:true,
      storage:false,
      users:0,
      trades:0,
      audit:[]
    });
  }

  const users =
    await env.DB
      .prepare(
        "SELECT COUNT(*) c FROM users WHERE email != ?"
      )
      .bind(ADMIN_EMAIL)
      .first();

  const trades =
    await env.DB
      .prepare(
        "SELECT COUNT(*) c FROM trades WHERE status='OPEN'"
      )
      .first();const userList =
    await env.DB
      .prepare(
        "SELECT id,name,email,balance FROM users WHERE email != ? ORDER BY created_at DESC LIMIT 200"
      )
      .bind(ADMIN_EMAIL)
      .all();

  const audit =
    await env.DB
      .prepare(
        "SELECT created_at time, action text FROM audit ORDER BY id DESC LIMIT 50"
      )
      .all();

  return json({
    ok:true,
    storage:true,
    users:Number(users?.c || 0),
    trades:Number(trades?.c || 0),
    userList:userList.results || [],
    audit:audit.results || []
  });
}


async function adminCredit(request,env){

  const a =
    await requireAdmin(request,env);

  if(!a) {
    return json({
      ok:false,
      error:"Admin authentication required."
    },403);
  }if(!env.DB) {
    return json({
      ok:false,
      error:"D1 storage is not configured."
    },503);
  }

  let b;

  try {
    b = await request.json();
  } catch {
    return json({
      ok:false,
      error:"Invalid JSON."
    },400);
  }

  const amount =
    Number(b.amount);

  const dir =
    b.direction === "debit"
      ? -1
      : 1;

  const userId =
    String(b.userId || "");

  if(
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !userId
  ) {
    return json({
      ok:false,
      error:"User and valid amount are required."
    },400);
  }const r =
    await env.DB
      .prepare(
        "UPDATE users SET balance=MAX(0,balance+?) WHERE id=? AND email!=?"
      )
      .bind(
        dir * amount,
        userId,
        ADMIN_EMAIL
      )
      .run();

  if(!r.meta.changes) {
    return json({
      ok:false,
      error:"User not found."
    },404);
  }

  const u =
    await env.DB
      .prepare(
        "SELECT balance FROM users WHERE id=?"
      )
      .bind(userId)
      .first();

  await env.DB
    .prepare(
      "INSERT INTO audit(action,created_at) VALUES(?,?)"
    )
    .bind(
      `${dir > 0 ? "Credit" : "Debit"} ${amount} for user ${userId}`,
      new Date().toISOString()
    )
    .run();

  return json({
    ok:true,
    balance:Number(u.balance)
  });
}async function handleTrades(request,env){

  const token =
    await readAdminSession(request,env);

  if(!env.DB) {
    return json({
      ok:false,
      error:"D1 storage is not configured."
    },503);
  }

  if(request.method === "GET") {

    if(!token) {
      return json({
        ok:false,
        error:"Admin authentication required."
      },403);
    }

    const r =
      await env.DB
        .prepare(
          "SELECT * FROM trades ORDER BY opened_at DESC LIMIT 500"
        )
        .all();

    return json({
      ok:true,
      trades:r.results || []
    });
  }

  if(request.method !== "POST") {
    return json({
      ok:false,
      error:"Method not allowed."
    },405);
  }
  const b =
    await request.json().catch(() => null);

  if(!b) {
    return json({
      ok:false,
      error:"Invalid JSON."
    },400);
  }

  const userId =
    String(b.userId || "");

  if(!userId) {
    return json({
      ok:false,
      error:"User required."
    },400);
  }

  await env.DB
    .prepare(
      `INSERT INTO trades(
        id,
        user_id,
        pair,
        side,
        volume,
        leverage,
        margin,
        entry,
        sl,
        tp,
        status,
        opened_at
      )
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id)DO UPDATE SET
        status=excluded.status,
        exit=excluded.exit,
        pl=excluded.pl,
        reason=excluded.reason,
        closed_at=excluded.closed_at`
    )
    .bind(
      String(b.id),
      userId,
      b.pair,
      b.side,
      Number(b.volume || 0),
      Number(b.leverage || 1),
      Number(b.margin || 0),
      Number(b.entry || 0),
      b.sl == null ? null : Number(b.sl),
      b.tp == null ? null : Number(b.tp),
      b.status || "OPEN",
      b.openedAt || new Date().toISOString()
    )
    .run();

  return json({ok:true});
}


async function handleSimulation(request,url,env){

  const symbol =
    (
      url.searchParams.get("symbol") ||
      url.searchParams.get("pair") ||
      ""
    ).toLowerCase();

  if(!PAIRS.includes(symbol)) {
    return json({ok:false,
      error:"Unsupported symbol."
    },400);
  }

  if(!env.DB) {
    return json({
      ok:false,
      error:"D1 storage is not configured."
    },503);
  }

  if(request.method === "GET") {

    const r =
      await env.DB
        .prepare(
          "SELECT price,updated_at FROM simulation WHERE symbol=?"
        )
        .bind(symbol)
        .first();

    return json({
      ok:true,
      symbol,
      simulationPrice:
        r ? Number(r.price) : null,
      updatedAt:
        r?.updated_at || null
    });
  }

  const a =
    await requireAdmin(request,env);

  if(!a) {
    return json({
      ok:false,
      error:"Admin authentication required."
    },403);
  }if(request.method === "DELETE") {

    await env.DB
      .prepare(
        "DELETE FROM simulation WHERE symbol=?"
      )
      .bind(symbol)
      .run();

    await audit(
      env,
      `Simulation reset ${symbol}`
    );

    const live =
      await fetchLivePrice(symbol);

    return json({
      ok:true,
      symbol,
      simulationPrice:null,
      livePrice:live
    });
  }

  if(request.method !== "POST") {
    return json({
      ok:false,
      error:"Method not allowed."
    },405);
  }

  const b =
    await request.json().catch(() => null);

  const amount =
    Number(b?.amount);const direction =
    b?.direction === "down"
      ? -1
      : b?.direction === "up"
        ? 1
        : 0;

  if(
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !direction
  ) {
    return json({
      ok:false,
      error:"Invalid movement."
    },400);
  }

  const old =
    await env.DB
      .prepare(
        "SELECT price FROM simulation WHERE symbol=?"
      )
      .bind(symbol)
      .first();

  let current =
    old
      ? Number(old.price)
      : await fetchLivePrice(symbol);

  if(!Number.isFinite(current)) {
    return json({
      ok:false,
      error:"Live market price unavailable."
    },503);
  }

  const next =
    current + direction * amount;const now =
    new Date().toISOString();

  await env.DB
    .prepare(
      `INSERT INTO simulation(
        symbol,
        price,
        updated_at
      )
      VALUES(?,?,?)
      ON CONFLICT(symbol)
      DO UPDATE SET
        price=excluded.price,
        updated_at=excluded.updated_at`
    )
    .bind(
      symbol,
      next,
      now
    )
    .run();

  await audit(
    env,
    `Simulation ${symbol} ${direction > 0 ? "+" : "-"}${amount} => ${next}`
  );

  return json({
    ok:true,
    symbol,
    simulationPrice:next,
    updatedAt:now
  });
}async function audit(env,text){

  if(env.DB) {
    await env.DB
      .prepare(
        "INSERT INTO audit(action,created_at) VALUES(?,?)"
      )
      .bind(
        text,
        new Date().toISOString()
      )
      .run();
  }

}


async function fetchLivePrice(symbol){

  try {

    const r =
      await fetch(
        `https://data-api.binance.vision/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`,
        {
          headers:{
            Accept:"application/json"
          },
          cf:{
            cacheTtl:0,
            cacheEverything:false
          }
        }
      );

    if(!r.ok) {
      return null;
    }

    const d =
      await r.json();return Number(d.price) || null;

  } catch {

    return null;

  }

}


async function historicalKlines(url){

  const symbol =
    (
      url.searchParams.get("symbol") ||
      "BTCUSDT"
    ).toUpperCase();

  const interval =
    url.searchParams.get("interval") ||
    DEFAULT_INTERVAL;

  const limit =
    Math.min(
      Math.max(
        Number(
          url.searchParams.get("limit") || 120
        ),
        1
      ),
      1000
    );

  if(!PAIRS.includes(symbol.toLowerCase())) {
    return json({
      ok:false,
      error:"Unsupported symbol."
    },400);
  }
  if(!ALLOWED_INTERVALS.has(interval)) {
    return json({
      ok:false,
      error:"Unsupported interval."
    },400);
  }

  try {

    const r =
      await fetch(
        `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
        {
          headers:{
            Accept:"application/json"
          },
          cf:{
            cacheTtl:0,
            cacheEverything:false
          }
        }
      );

    return new Response(
      await r.text(),
      {
        status:r.status,
        headers:{
          "Content-Type":"application/json",
          "Cache-Control":"no-store",
          "Access-Control-Allow-Origin":"*"
        }
      }
    );

  } catch {return json({
      ok:false,
      error:"Unable to load historical candles."
    },502);

  }

}


async function proxyMarketWebSocket(request,interval){

  if(
    request.headers.get("Upgrade") !==
    "websocket"
  ) {
    return new Response(
      "Expected WebSocket upgrade.",
      {status:426}
    );
  }

  if(!ALLOWED_INTERVALS.has(interval)) {
    interval = DEFAULT_INTERVAL;
  }

  const streams =
    PAIRS
      .flatMap(
        s => [
          `${s}@ticker`,
          `${s}@kline_${interval}`
        ]
      )
      .join("/");

  const upstreamUrl =
    `https://stream.binance.com:443/stream?streams=${streams}`;const pair =
    new WebSocketPair();

  const [client,server] =
    Object.values(pair);

  server.accept({
    allowHalfOpen:true
  });

  try {

    const r =
      await fetch(
        upstreamUrl,
        {
          headers:{
            Upgrade:"websocket"
          }
        }
      );

    if(
      r.status !== 101 ||
      !r.webSocket
    ) {

      server.send(
        JSON.stringify({
          type:"error",
          message:
            `Upstream WebSocket handshake failed (HTTP ${r.status}).`
        })
      );

      server.close(
        1011,
        "Market provider unavailable"
      );

      return new Response(
        null,{
          status:101,
          webSocket:client
        }
      );
    }

    const up =
      r.webSocket;

    up.accept({
      allowHalfOpen:true
    });

    up.binaryType =
      "arraybuffer";

    up.addEventListener(
      "message",
      e => {
        if(
          server.readyState ===
          WebSocket.OPEN
        ) {
          server.send(e.data);
        }
      }
    );

    up.addEventListener(
      "close",
      e => {
        if(
          server.readyState !==
          WebSocket.CLOSED
        ) {
          server.close(
            e.code || 1000,
            "Market stream closed"
          );
        }
      });

    server.addEventListener(
      "message",
      e => {
        if(
          up.readyState ===
          WebSocket.OPEN
        ) {
          up.send(e.data);
        }
      }
    );

    server.addEventListener(
      "close",
      e => {
        if(
          up.readyState !==
          WebSocket.CLOSED
        ) {
          up.close(
            e.code || 1000,
            "Client disconnected"
          );
        }
      }
    );

  } catch {

    if(
      server.readyState ===
      WebSocket.OPEN
    ) {

      server.send(
        JSON.stringify({
          type:"error",
          message:
            "Unable to connect to the live market stream."})
      );

      server.close(
        1011,
        "Market connection failed"
      );
    }

  }

  return new Response(
    null,
    {
      status:101,
      webSocket:client
    }
  );
}


function cookie(v){

  return `dc_admin=${v}; Max-Age=${SESSION_DAYS * 86400}; Path=/; HttpOnly; Secure; SameSite=Lax`;

}


function getCookie(req,name){

  const m =
    (
      req.headers.get("Cookie") || ""
    ).match(
      new RegExp(
        `(?:^|; )${name}=([^;]+)`
      )
    );return m
    ? m[1]
    : null;

}


async function signSession(obj,secret){

  const data =
    b64u(
      JSON.stringify(obj)
    );

  const key =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      {
        name:"HMAC",
        hash:"SHA-256"
      },
      false,
      ["sign"]
    );

  const sig =
    b64uBytes(
      await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(data)
      )
    );

  return data + "." + sig;

}async function verifySession(token,secret){

  try {

    const [data,sig] =
      token.split(".");

    const key =
      await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        {
          name:"HMAC",
          hash:"SHA-256"
        },
        false,
        ["verify"]
      );

    const ok =
      await crypto.subtle.verify(
        "HMAC",
        key,
        b64uDecode(sig),
        new TextEncoder().encode(data)
      );

    if(!ok) {
      return null;
    }

    const o =
      JSON.parse(
        new TextDecoder().decode(
          b64uDecode(data)
        )
      );

    return o.exp > Date.now()
      ? o
      : null;  } catch {

    return null;

  }

}


function b64u(s){

  return b64uBytes(
    new TextEncoder().encode(s)
  );

}


function b64uBytes(b){

  let s = "";

  const a =
    new Uint8Array(b);

  for(
    let i = 0;
    i < a.length;
    i += 0x8000
  ) {
    s += String.fromCharCode(
      ...a.subarray(
        i,
        i + 0x8000
      )
    );
  }

  return btoa(s)
    .replace(/\+/g,"-")
    .replace(/\//g,"_")
    .replace(/=+$/g,"");}


function b64uDecode(s){

  s =
    s.replace(/-/g,"+")
     .replace(/_/g,"/");

  while(
    s.length % 4
  ) {
    s += "=";
  }

  const bin =
    atob(s);

  const a =
    new Uint8Array(
      bin.length
    );

  for(
    let i = 0;
    i < bin.length;
    i++
  ) {
    a[i] =
      bin.charCodeAt(i);
  }

  return a;

}
function timingSafeEqual(a,b){

  if(
    a.length !==
    b.length
  ) {
    return false;
  }

  let x = 0;

  for(
    let i = 0;
    i < a.length;
    i++
  ) {
    x |=
      a.charCodeAt(i) ^
      b.charCodeAt(i);
  }

  return x === 0;

}


function json(data,status=200){

  return new Response(
    JSON.stringify(data),
    {
      status,
      headers:{
        "Content-Type":
          "application/json;charset=UTF-8",
        "Cache-Control":
          "no-store"
      }
    }
  );

}
