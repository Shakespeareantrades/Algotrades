const PAIRS = {
  BTCUSDT: "BTC/USDT",
  ETHUSDT: "ETH/USDT",
  SOLUSDT: "SOL/USDT",
  BNBUSDT: "BNB/USDT",
  XRPUSDT: "XRP/USDT"
};

const STREAMS =
  "btcusdt@ticker/ethusdt@ticker/solusdt@ticker/bnbusdt@ticker/xrpusdt@ticker";

const BINANCE_WS_HTTP =
  `https://stream.binance.com:443/stream?streams=${STREAMS}`;

const BINANCE_KLINE_HTTP =
  "https://api.binance.com/api/v3/klines";

const KLINE_INTERVALS = new Set([
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M"
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "DevolksCapital live market gateway",
        provider: "Binance WebSocket + Kline API",
        time: new Date().toISOString()
      });
    }

    // Live Binance market WebSocket
    if (url.pathname === "/market") {
      return proxyMarketWebSocket(request);
    }

    // Historical candlestick/Kline data
    if (url.pathname === "/api/klines") {
      return getKlines(url);
    }

    // Old prices endpoint is intentionally disabled.
    if (url.pathname === "/api/prices") {
      return json(
        {
          ok: false,
          error:
            "Live prices are delivered through the /market WebSocket.",
          endpoint: "/market"
        },
        426
      );
    }

    // Serve public/index.html and other static files
    return env.ASSETS.fetch(request);
  }
};

async function getKlines(url) {
  const symbol = (
    url.searchParams.get("symbol") || "BTCUSDT"
  ).toUpperCase();

  const interval =
    url.searchParams.get("interval") || "1m";

  const requestedLimit = Number(
    url.searchParams.get("limit") || 200
  );

  const limit = Math.min(
    Math.max(
      Number.isFinite(requestedLimit)
        ? requestedLimit
        : 200,
      1
    ),
    1000
  );

  // Only allow the pairs used by DevolksCapital
  if (!Object.prototype.hasOwnProperty.call(PAIRS, symbol)) {
    return json(
      {
        ok: false,
        error: "Unsupported symbol.",
        supported: Object.keys(PAIRS)
      },
      400
    );
  }

  // Only allow supported Binance intervals
  if (!KLINE_INTERVALS.has(interval)) {
    return json(
      {
        ok: false,
        error: "Unsupported interval.",
        supported: [...KLINE_INTERVALS]
      },
      400
    );
  }

  const target =
    `${BINANCE_KLINE_HTTP}` +
    `?symbol=${encodeURIComponent(symbol)}` +
    `&interval=${encodeURIComponent(interval)}` +
    `&limit=${limit}`;

  try {
    const response = await fetch(target, {
      headers: {
        Accept: "application/json"
      }
    });

    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error:
          "Unable to retrieve Binance Kline data."
      },
      502
    );
  }
}

async function proxyMarketWebSocket(request) {
  // Browser must request /market as WebSocket
  if (
    request.headers.get("Upgrade") !==
    "websocket"
  ) {
    return new Response(
      "Expected WebSocket upgrade.",
      {
        status: 426
      }
    );
  }

  const pair = new WebSocketPair();
  const [client, server] =
    Object.values(pair);

  server.accept({
    allowHalfOpen: true
  });

  let upstream;

  try {
    // Connect Cloudflare Worker to Binance
    const response = await fetch(
      BINANCE_WS_HTTP,
      {
        headers: {
          Upgrade: "websocket"
        }
      }
    );

    if (
      response.status !== 101 ||
      !response.webSocket
    ) {
      if (
        server.readyState ===
        WebSocket.OPEN
      ) {
        server.send(
          JSON.stringify({
            type: "error",
            message:
              `Upstream WebSocket handshake failed (HTTP ${response.status}).`
          })
        );

        server.close(
          1011,
          "Market provider unavailable"
        );
      }

      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }

    upstream = response.webSocket;

    upstream.accept({
      allowHalfOpen: true
    });

    upstream.binaryType = "arraybuffer";

    // Binance -> DevolksCapital
    upstream.addEventListener(
      "message",
      event => {
        if (
          server.readyState ===
          WebSocket.OPEN
        ) {
          server.send(event.data);
        }
      }
    );

    upstream.addEventListener(
      "error",
      () => {
        if (
          server.readyState ===
          WebSocket.OPEN
        ) {
          server.send(
            JSON.stringify({
              type: "error",
              message:
                "Upstream market stream error."
            })
          );
        }
      }
    );

    upstream.addEventListener(
      "close",
      event => {
        if (
          server.readyState !==
          WebSocket.CLOSED
        ) {
          server.close(
            event.code || 1000,
            "Market stream closed"
          );
        }
      }
    );

    // DevolksCapital -> Binance
    server.addEventListener(
      "message",
      event => {
        if (
          upstream &&
          upstream.readyState ===
            WebSocket.OPEN
        ) {
          upstream.send(event.data);
        }
      }
    );

    // Close Binance connection when browser disconnects
    server.addEventListener(
      "close",
      event => {
        if (
          upstream &&
          upstream.readyState !==
            WebSocket.CLOSED
        ) {
          upstream.close(
            event.code || 1000,
            "Client disconnected"
          );
        }
      }
    );
  } catch (error) {
    if (
      server.readyState ===
      WebSocket.OPEN
    ) {
      server.send(
        JSON.stringify({
          type: "error",
          message:
            "Unable to connect to the live market stream."
        })
      );

      server.close(
        1011,
        "Market connection failed"
      );
    }
  }

  return new Response(null, {
    status: 101,
    webSocket: client
  });
}

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    }
  );
}
              
