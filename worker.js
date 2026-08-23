const STREAMS =
  "btcusdt@ticker/ethusdt@ticker/solusdt@ticker/bnbusdt@ticker/xrpusdt@ticker";

const BINANCE_WS_HTTP =
  `https://stream.binance.com:443/stream?streams=${STREAMS}`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "AlgoTrade live market gateway",
        provider: "Binance WebSocket",
        time: new Date().toISOString()
      });
    }

    if (url.pathname === "/market") {
      return proxyMarketWebSocket(request);
    }

    if (url.pathname === "/api/prices") {
      return json({
        ok: false,
        error: "Live prices are delivered through the /market WebSocket.",
        endpoint: "/market"
      }, 426);
    }

    return env.ASSETS.fetch(request);
  }
};

async function proxyMarketWebSocket(request) {
  if (request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected WebSocket upgrade.", { status: 426 });
  }

  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair);

  server.accept({ allowHalfOpen: true });

  let upstream;

  try {
    const response = await fetch(BINANCE_WS_HTTP, {
      headers: {
        "Upgrade": "websocket"
      }
    });

    if (response.status !== 101 || !response.webSocket) {
      server.send(JSON.stringify({
        type: "error",
        message: `Upstream WebSocket handshake failed (HTTP ${response.status}).`
      }));
      server.close(1011, "Market provider unavailable");
      return new Response(null, { status: 101, webSocket: client });
    }

    upstream = response.webSocket;
    upstream.accept({ allowHalfOpen: true });
    upstream.binaryType = "arraybuffer";

    upstream.addEventListener("message", event => {
      if (server.readyState === WebSocket.OPEN) {
        server.send(event.data);
      }
    });

    upstream.addEventListener("error", () => {
      if (server.readyState === WebSocket.OPEN) {
        server.send(JSON.stringify({
          type: "error",
          message: "Upstream market stream error."
        }));
      }
    });

    upstream.addEventListener("close", event => {
      if (server.readyState !== WebSocket.CLOSED) {
        server.close(event.code || 1000, "Market stream closed");
      }
    });

    server.addEventListener("message", event => {
      // The browser normally does not need to send anything.
      // Forwarding messages keeps the proxy generic.
      if (upstream && upstream.readyState === WebSocket.OPEN) {
        upstream.send(event.data);
      }
    });

    server.addEventListener("close", event => {
      if (upstream && upstream.readyState !== WebSocket.CLOSED) {
        upstream.close(event.code || 1000, "Client disconnected");
      }
    });

  } catch (error) {
    if (server.readyState === WebSocket.OPEN) {
      server.send(JSON.stringify({
        type: "error",
        message: "Unable to connect to the live market stream."
      }));
      server.close(1011, "Market connection failed");
    }
  }

  return new Response(null, {
    status: 101,
    webSocket: client
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}
