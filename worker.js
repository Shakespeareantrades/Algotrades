const MARKET_URL =
  "https://api.binance.com/api/v3/ticker/price?symbols=" +
  encodeURIComponent(JSON.stringify([
    "BTCUSDT",
    "ETHUSDT",
    "SOLUSDT",
    "BNBUSDT",
    "XRPUSDT"
  ]));

const SYMBOLS = {
  BTCUSDT: "BTC/USDT",
  ETHUSDT: "ETH/USDT",
  SOLUSDT: "SOL/USDT",
  BNBUSDT: "BNB/USDT",
  XRPUSDT: "XRP/USDT"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Real-market price API used by the AlgoTrade frontend.
    if (url.pathname === "/api/prices") {
      try {
        const upstream = await fetch(MARKET_URL, {
          headers: { "Accept": "application/json" },
          cf: { cacheTtl: 0, cacheEverything: false }
        });

        if (!upstream.ok) {
          return json({
            ok: false,
            error: `Market provider returned HTTP ${upstream.status}`
          }, 502);
        }

        const raw = await upstream.json();
        const prices = {};

        for (const item of raw) {
          if (SYMBOLS[item.symbol]) {
            prices[SYMBOLS[item.symbol]] = Number(item.price);
          }
        }

        return json({
          ok: true,
          source: "Binance public market data",
          timestamp: new Date().toISOString(),
          prices
        }, 200, {
          "Cache-Control": "no-store, max-age=0"
        });
      } catch (error) {
        return json({
          ok: false,
          error: "Unable to reach the market data provider."
        }, 502);
      }
    }

    // Optional simple health check.
    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "AlgoTrade market API",
        time: new Date().toISOString()
      });
    }

    // Everything else is served from /public by Cloudflare Static Assets.
    return env.ASSETS.fetch(request);
  }
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      ...extraHeaders
    }
  });
}
