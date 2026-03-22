import { createServer } from "node:http";
import { parse as parseUrl } from "node:url";

import handler from "./render-handler";

const PORT = Number(process.env.RENDER_PORT || 3002);

const server = createServer(async (req, res) => {
  const parsed = parseUrl(req.url || "", true);

  if (parsed.pathname !== "/api/render") {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  const apiReq = {
    query: parsed.query as Record<string, string | string[] | undefined>,
  };

  const apiRes = {
    setHeader: (name: string, value: string) => {
      res.setHeader(name, value);
    },
    status: (code: number) => {
      res.statusCode = code;
      return apiRes;
    },
    send: (body: string) => {
      res.end(body);
    },
  };

  try {
    await handler(apiReq, apiRes);
  } catch (err) {
    console.error("[render-server] Error:", err);
    res.statusCode = 500;
    res.end("Internal server error");
  }
});

server.listen(PORT, () => {
  console.log(`[render-server] Listening on http://localhost:${PORT}`);
});
