<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DevolksCapital Crypto</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#06101c;color:#f4f7fb;font:14px Arial,sans-serif}
.top{height:65px;background:#081522;border-bottom:1px solid #1d3349;display:flex;align-items:center;justify-content:space-between;padding:0 22px;gap:15px}
.logo{font-size:21px;font-weight:800}.logo b{color:#27d69b}
.badge{padding:7px 10px;border-radius:20px;background:#103a31;color:#27d69b;font-size:11px;white-space:nowrap}
.badge.off{background:#3b1720;color:#ff6170}
.layout{display:grid;grid-template-columns:210px 1fr;min-height:calc(100vh - 65px)}
aside{background:#081522;padding:15px 10px;border-right:1px solid #1d3349}
aside button{width:100%;padding:12px;margin:3px 0;border:0;border-radius:8px;background:0;color:#9ab0c3;text-align:left}
aside button.active,aside button:hover{background:#10243a;color:#fff}
main{padding:25px;max-width:1450px;width:100%;margin:auto}
.view{display:none}.view.active{display:block}
.title{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:10px}
.title h1{margin:0;font-size:27px}
.muted{color:#8fa4b8;font-size:12px}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:13px}
.card,.box{background:#0c1928;border:1px solid #1d3349;border-radius:13px;padding:17px}
.label{color:#8fa4b8;font-size:12px}
.value{font-size:23px;font-weight:800;margin-top:7px}
.grid{display:grid;grid-template-columns:2fr 1fr;gap:15px;margin-top:15px}
.chart{height:310px;background:linear-gradient(180deg,#0d1b2b,#091522);border-radius:10px;position:relative;overflow:hidden;background-image:linear-gradient(#183049 1px,transparent 1px),linear-gradient(90deg,#183049 1px,transparent 1px);background-size:48px 48px}
.spark{position:absolute;inset:0;width:100%;height:100%}
.line{fill:none;stroke:#27d69b;stroke-width:2.5}
.dot{fill:#27d69b}
.row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #1d3349;gap:10px}
.btn{border:0;border-radius:8px;padding:10px 15px;color:#fff;font-weight:700;background:#659cff}
.green{background:#159b73}.red{background:#c53d51}.dark{background:#172b40}
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
input,select{width:100%;padding:11px;background:#071321;color:#fff;border:1px solid #1d3349;border-radius:8px;margin:5px 0 10px}
.field label{font-size:12px;color:#8fa4b8}
table{width:100%;border-collapse:collapse;min-width:750px}
th,td{padding:11px 8px;text-align:left;border-bottom:1px solid #1d3349}
.table-wrap{overflow:auto}
.up{color:#27d69b}.down{color:#ff6170}
.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.plan{background:#10243a;border:1px solid #1d3349;padding:18px;border-radius:12px}
.auth{min-height:100vh;display:grid;place-items:center;padding:20px;background:#06101c}
.authbox{width:min(430px,100%);padding:28px;background:#0c1928;border:1px solid #1d3349;border-radius:15px}
.authbox h1{margin-bottom:5px}.authbox p{color:#8fa4b8}.authbox .btn{width:100%}
.link{text-align:center;color:#659cff;margin-top:13px;cursor:pointer}
.toast{display:none;position:fixed;right:15px;bottom:15px;padding:13px;background:#17344e;border:1px solid #1d3349;border-radius:9px;z-index:20}
.note{color:#8fa4b8;font-size:12px;line-height:1.5;margin-top:10px}
.market-status{display:flex;align-items:center;gap:8px;margin:10px 0}
.pulse{width:8px;height:8px;border-radius:50%;background:#ff6170}.pulse.on{background:#27d69b}
@media(max-width:900px){.layout{grid-template-columns:1fr}aside{display:flex;overflow:auto}aside button{min-width:125px}.cards{grid-template-columns:repeat(2,1fr)}.grid,.plans{grid-template-columns:1fr}}
@media(max-width:520px){.cards{grid-template-columns:1fr}main{padding:15px}.top{padding:0 12px}}
</style>
</head>
<body>

<div id="auth" class="auth">
  <div class="authbox">
    <div class="logo">Algo<b>Trade</b></div>
    <h1 id="at">Create your account</h1>
    <p>Crypto trading simulator with real market prices</p>
    <form id="af">
      <div id="nw"><label class="muted">Full name</label><input id="name" placeholder="Demo Trader"></div>
      <label class="muted">Email</label><input id="email" type="email" required>
      <label class="muted">Password</label><input id="pw" type="password" required>
      <button class="btn green" id="ab">Create account</button>
    </form>
    <div class="link" id="toggle">Already have an account? Sign in</div>
  </div>
</div>

<div id="app" style="display:none">
<header class="top">
  <div class="logo">Algo<b>Trade</b></div>
  <div>
    <span id="mode" class="badge">SIMULATION MODE</span>
    <span id="user" class="muted"></span>
    <button class="btn dark" onclick="logout()">Log out</button>
  </div>
</header>

<div class="layout">
<aside>
<button class="active" data-v="dash">📊 Dashboard</button>
<button data-v="trade">₿ Crypto Trade</button>
<button data-v="plans">🤖 Plans & Bots</button>
<button data-v="hist">📜 History</button>
<button data-v="wallet">💳 Wallet</button>
<button data-v="profile">⚙️ Profile</button>
<button data-v="admin">🛠️ Admin</button>
</aside>

<main>
<section id="dash" class="view active">
  <div class="title">
    <div><h1>Crypto Dashboard</h1><span class="muted">Live public market data · simulated trading</span></div>
    <span id="live" class="badge off">LIVE FEED: CONNECTING</span>
  </div>

  <div class="cards">
    <div class="card"><div class="label">Balance</div><div class="value" id="bal">$10,000.00</div></div>
    <div class="card"><div class="label">Today's P/L</div><div class="value up" id="daily">+$0.00</div></div>
    <div class="card"><div class="label">Open Positions</div><div class="value" id="pos">0</div></div>
    <div class="card"><div class="label">BTC/USDT</div><div class="value" id="btc">—</div></div>
  </div>

  <div class="grid">
    <div class="box">
      <h3>BTC/USDT <span id="dprice" class="muted">—</span></h3>
      <div class="market-status"><span id="pulse" class="pulse"></span><span id="marketText" class="muted">Waiting for market data...</span></div>
      <div class="chart">
        <svg class="spark" viewBox="0 0 1000 310" preserveAspectRatio="none">
          <polyline id="chartLine" class="line" points="0,155 1000,155"></polyline>
          <circle id="chartDot" class="dot" cx="990" cy="155" r="5"></circle>
        </svg>
      </div>
      <div class="actions">
        <button class="btn green" onclick="openTrade('BUY')">BUY BTC</button>
        <button class="btn red" onclick="openTrade('SELL')">SELL BTC</button>
      </div>
      <div class="note">Prices are real public market prices. Orders and balances are simulated.</div>
    </div>
    <div class="box">
      <h3>Account Summary</h3>
      <div class="row"><span>Balance</span><b id="eq">$10,000.00</b></div>
      <div class="row"><span>Free Balance</span><b id="free">$10,000.00</b></div>
      <div class="row"><span>Open P/L</span><b id="upl">$0.00</b></div>
      <div class="row"><span>Win Rate</span><b class="up">—</b></div>
    </div>
  </div>
</section>

<section id="trade" class="view">
  <div class="title"><h1>Crypto Trading Terminal</h1><span id="tlive" class="badge off">LIVE FEED: CONNECTING</span></div>
  <div class="grid">
    <div class="box">
      <h3 id="tradeTitle">BTC/USDT · Live</h3>
      <div class="chart"><svg class="spark" viewBox="0 0 1000 310" preserveAspectRatio="none"><polyline id="tradeLine" class="line" points="0,155 1000,155"></polyline><circle id="tradeDot" class="dot" cx="990" cy="155" r="5"></circle></svg></div>
      <div class="row"><span>Current market price</span><b id="tpv">—</b></div>
    </div>
    <div class="box">
      <h3>Order Ticket</h3>
      <div class="field"><label>Asset</label>
        <select id="pair" onchange="renderTradePrice()">
          <option>BTC/USDT</option><option>ETH/USDT</option><option>SOL/USDT</option><option>BNB/USDT</option><option>XRP/USDT</option>
        </select>
      </div>
      <div class="field"><label>Amount (USDT)</label><input id="amt" type="number" min="1" value="1000"></div>
      <div class="field"><label>Stop Loss</label><input id="sl" placeholder="Market price level"></div>
      <div class="field"><label>Take Profit</label><input id="tp" placeholder="Market price level"></div>
      <div class="actions"><button class="btn green" onclick="openTrade('BUY')">Buy</button><button class="btn red" onclick="openTrade('SELL')">Sell</button></div>
      <div class="note">No real exchange order is submitted.</div>
    </div>
  </div>
</section>

<section id="plans" class="view">
  <h1>Plans & Automated Trading</h1>
  <div class="plans">
    <div class="plan"><h3>Crypto Standard</h3><p class="muted">Test crypto portfolio strategies.</p><button class="btn" onclick="notify('Crypto Standard activated')">Start</button></div>
    <div class="plan"><h3>Crypto AI Bot</h3><p class="muted">Test automated crypto strategy execution.</p><button class="btn" onclick="notify('Crypto AI Bot activated')">Activate</button></div>
    <div class="plan"><h3>Copy Trading</h3><p class="muted">Simulate copying a crypto trader.</p><button class="btn" onclick="notify('Copy Trading activated')">Copy</button></div>
  </div>
</section>

<section id="hist" class="view">
  <h1>Crypto Trade History</h1>
  <div class="box table-wrap"><table><thead><tr><th>Time</th><th>Pair</th><th>Side</th><th>Amount</th><th>Entry</th><th>SL</th><th>TP</th><th>Status</th></tr></thead><tbody id="hb"></tbody></table></div>
</section>

<section id="wallet" class="view">
  <h1>Wallet</h1>
  <div class="cards"><div class="card"><div class="label">Demo Balance</div><div class="value" id="wb">$10,000.00</div></div></div>
  <div class="box" style="margin-top:15px"><button class="btn green" onclick="addFunds()">Add demo funds</button> <button class="btn dark" onclick="notify('Withdrawal request created (simulation)')">Request withdrawal</button></div>
</section>

<section id="profile" class="view">
  <h1>Profile</h1>
  <div class="box"><div class="row"><span>Name</span><b id="pn"></b></div><div class="row"><span>Email</span><b id="pe"></b></div><div class="row"><span>Account</span><b>Crypto Demo</b></div></div>
</section>

<section id="admin" class="view">
  <div class="title"><h1>Admin Control Panel</h1><span class="badge">ADMIN</span></div>
  <div class="grid">
    <div class="box">
      <h3>Demo Balance Control</h3>
      <input id="aa" type="number" value="5000">
      <div class="actions"><button class="btn green" onclick="admin('add')">Add funds</button><button class="btn red" onclick="admin('remove')">Remove funds</button><button class="btn dark" onclick="admin('set')">Set balance</button></div>
    </div>
    <div class="box">
      <h3>Local Simulation Override</h3>
      <select id="sp"><option>BTC/USDT</option><option>ETH/USDT</option><option>SOL/USDT</option><option>BNB/USDT</option><option>XRP/USDT</option></select>
      <input id="sv" type="number" value="100000">
      <div class="actions"><button class="btn green" onclick="sim('up')">Move UP</button><button class="btn red" onclick="sim('down')">Move DOWN</button><button class="btn dark" onclick="clearOverride()">Use live price</button></div>
      <div class="note">This is a demo-only local override. It does not move the real external market.</div>
    </div>
  </div>
  <div class="box" style="margin-top:15px"><h3>Admin Audit</h3><div id="audit" class="muted"></div></div>
</section>
</main>
</div>
</div>

<div id="toast" class="toast"></div>

<script>
const K='devolkscapital_crypto_v3';
const DEFAULT_PRICES={'BTC/USDT':null,'ETH/USDT':null,'SOL/USDT':null,'BNB/USDT':null,'XRP/USDT':null};
let s=JSON.parse(localStorage.getItem(K)||'null')||{
  user:null,balance:10000,trades:[],prices:{...DEFAULT_PRICES},history:{'BTC/USDT':[],'ETH/USDT':[],'SOL/USDT':[],'BNB/USDT':[],'XRP/USDT':[]},live:false,audit:[],overrides:{}
};
const q=x=>document.getElementById(x);
const save=()=>localStorage.setItem(K,JSON.stringify(s));
const money=n=>'$'+Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const priceOf=p=>s.overrides[p]??s.prices[p];

function notify(t){let x=q('toast');x.textContent=t;x.style.display='block';clearTimeout(window._toast);window._toast=setTimeout(()=>x.style.display='none',2200)}

function currentOpenPL(){
  return s.trades.filter(t=>t.status==='Open').reduce((sum,t)=>{
    const p=priceOf(t.pair); if(!p)return sum;
    const units=t.amount/t.entryNum;
    return sum+(t.side==='BUY'?(p-t.entryNum)*units:(t.entryNum-p)*units);
  },0);
}

function updateChart(points,lineId,dotId){
  if(points.length<2)return;
  const vals=points.map(Number), min=Math.min(...vals), max=Math.max(...vals), range=max-min||1;
  const pts=vals.map((v,i)=>`${(i/(vals.length-1))*1000},${285-((v-min)/range)*250}`).join(' ');
  q(lineId).setAttribute('points',pts);
  const last=pts.split(' ').pop().split(',');
  q(dotId).setAttribute('cx',last[0]);q(dotId).setAttribute('cy',last[1]);
}

function render(){
  const btc=priceOf('BTC/USDT');
  q('bal').textContent=money(s.balance);q('wb').textContent=money(s.balance);
  q('eq').textContent=money(s.balance);q('free').textContent=money(s.balance);
  q('btc').textContent=btc?money(btc):'—';q('dprice').textContent=btc?money(btc):'—';
  q('pos').textContent=s.trades.filter(t=>t.status==='Open').length;
  const upl=currentOpenPL();q('upl').textContent=(upl>=0?'+':'')+money(upl);q('upl').className=upl>=0?'up':'down';
  q('daily').textContent=(upl>=0?'+':'')+money(upl);
  const live=s.live;
  q('live').textContent=live?'LIVE DATA':'LIVE FEED: OFFLINE';
  q('tlive').textContent=live?'LIVE DATA':'LIVE FEED: OFFLINE';
  q('live').classList.toggle('off',!live);q('tlive').classList.toggle('off',!live);
  q('pulse').classList.toggle('on',live);q('marketText').textContent=live?'Real public market data connected':'Waiting for Worker market API';
  q('hb').innerHTML=s.trades.length?s.trades.map(t=>`<tr><td>${t.time}</td><td>${t.pair}</td><td class="${t.side==='BUY'?'up':'down'}">${t.side}</td><td>${money(t.amount)}</td><td>${money(t.entryNum)}</td><td>${t.sl||'—'}</td><td>${t.tp||'—'}</td><td>${t.status}</td></tr>`).join(''):'<tr><td colspan="8" class="muted">No trades yet.</td></tr>';
  q('audit').innerHTML=s.audit.slice().reverse().map(a=>`<div class="row"><span>${a.time}</span><b>${a.text}</b></div>`).join('')||'No changes yet.';
  renderTradePrice();
  updateChart(s.history['BTC/USDT']||[], 'chartLine','chartDot');
  const pair=q('pair')?.value||'BTC/USDT';updateChart(s.history[pair]||[], 'tradeLine','tradeDot');
}

function renderTradePrice(){
  const pair=q('pair').value, p=priceOf(pair);
  q('tradeTitle').textContent=pair+' · Live';
  q('tpv').textContent=p?money(p):'—';
  updateChart(s.history[pair]||[], 'tradeLine','tradeDot');
}

let marketSocket = null;
let marketReconnectTimer = null;

function connectMarket(){
  if (marketSocket && (marketSocket.readyState === WebSocket.OPEN ||
                       marketSocket.readyState === WebSocket.CONNECTING)) return;

  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  marketSocket = new WebSocket(protocol + '//' + location.host + '/market');

  marketSocket.onopen = () => {
    s.live = true;
    render();
  };

  marketSocket.onmessage = event => {
    try{
      const msg = JSON.parse(event.data);

      if(msg.type === 'error'){
        s.live = false;
        render();
        return;
      }

      const payload = msg.data || msg;
      const symbol = payload.s;
      const closePrice = Number(payload.c);

      const map = {
        BTCUSDT:'BTC/USDT',
        ETHUSDT:'ETH/USDT',
        SOLUSDT:'SOL/USDT',
        BNBUSDT:'BNB/USDT',
        XRPUSDT:'XRP/USDT'
      };

      const pair = map[symbol];

      if(pair && Number.isFinite(closePrice)){
        s.prices[pair] = closePrice;
        if(!s.history[pair]) s.history[pair] = [];
        s.history[pair].push(closePrice);
        if(s.history[pair].length > 60) s.history[pair].shift();
        s.live = true;
        save();
        render();
      }
    }catch(e){
      s.live = false;
      render();
    }
  };

  marketSocket.onerror = () => {
    s.live = false;
    render();
  };

  marketSocket.onclose = () => {
    s.live = false;
    render();
    clearTimeout(marketReconnectTimer);
    marketReconnectTimer = setTimeout(connectMarket, 3000);
  };
}

function openTrade(side){
  const pair=q('pair').value, p=priceOf(pair);
  if(!p)return notify('Live market price is not available');
  const a=Number(q('amt').value||0);
  if(a<=0)return notify('Enter a valid amount');
  if(a>s.balance)return notify('Insufficient demo balance');
  s.balance-=a;
  s.trades.unshift({
    time:new Date().toLocaleTimeString(),
    pair,side,amount:a,entryNum:p,
    sl:q('sl').value||'—',tp:q('tp').value||'—',
    status:'Open'
  });
  save();render();notify(side+' '+pair+' simulated order opened at '+money(p));
}

function admin(t){
  const n=Number(q('aa').value||0);
  if(t==='add')s.balance+=n;if(t==='remove')s.balance=Math.max(0,s.balance-n);if(t==='set')s.balance=n;
  s.audit.push({time:new Date().toLocaleString(),text:'Admin '+t+' '+money(n)+' demo balance'});
  save();render();notify('Balance updated');
}

function sim(d){
  const p=q('sp').value,n=Number(q('sv').value||0),next=d==='up'?n*1.005:n*.995;
  s.overrides[p]=next;s.audit.push({time:new Date().toLocaleString(),text:'Local simulation override '+p+' '+d.toUpperCase()});
  save();render();notify(p+' local simulation moved '+d.toUpperCase());
}
function clearOverride(){
  const p=q('sp').value;delete s.overrides[p];save();render();notify(p+' returned to live price');
}
function addFunds(){s.balance+=1000;save();render();notify('$1,000 demo funds added')}
function logout(){s.user=null;save();location.reload()}

let signup=true;
q('af').onsubmit=e=>{
  e.preventDefault();
  const email=q('email').value,pw=q('pw').value;
  if(pw.length<6)return notify('Password must be at least 6 characters');
  if(signup){s.user={name:q('name').value||'Demo Trader',email,password:pw};save();show()}
  else{if(!s.user||s.user.email!==email||s.user.password!==pw)return notify('Login details not found');show()}
};
function show(){
  q('auth').style.display='none';q('app').style.display='block';
  q('user').textContent=s.user.name+' · '+s.user.email;
  q('pn').textContent=s.user.name;q('pe').textContent=s.user.email;render();
}
q('toggle').onclick=()=>{
  signup=!signup;q('at').textContent=signup?'Create your account':'Welcome back';
  q('ab').textContent=signup?'Create account':'Sign in';q('nw').style.display=signup?'block':'none';
};
document.querySelectorAll('aside button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('aside button').forEach(x=>x.classList.remove('active'));b.classList.add('active');
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));q(b.dataset.v).classList.add('active');render();
});
if(s.user)show();else{q('app').style.display='none'}
connectMarket();
</script>
</body>
</html>
