const COINS = {
  "BTC/USDT": "bitcoin",
  "ETH/USDT": "ethereum",
  "SOL/USDT": "solana",
  "BNB/USDT": "binancecoin",
  "XRP/USDT": "ripple"
};

const IDS = Object.values(COINS).join(",");

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "AlgoTrade market API",
        provider: "CoinGecko",
        time: new Date().toISOString()
      });
    }

    if (url.pathname === "/api/prices") {
      try {
        const upstream = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${IDS}&vs_currencies=usd`,
          {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "User-Agent": "AlgoTrade/3.0"
            },
            cf: {
              cacheTtl: 0,
              cacheEverything: false
            }
          }
        );

        if (!upstream.ok) {
          return json({
            ok: false,
            error: `Market provider returned HTTP ${upstream.status}`
          }, 502);
        }

        const raw = await upstream.json();
        const prices = {};

        for (const [pair, coinId] of Object.entries(COINS)) {
          const value = raw?.[coinId]?.usd;

          if (typeof value === "number" && Number.isFinite(value)) {
            prices[pair] = value;
          }
        }

        if (!Object.keys(prices).length) {
          return json({
            ok: false,
            error: "Market provider returned no usable prices."
          }, 502);
        }

        return json({
          ok: true,
          source: "CoinGecko public market data",
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
