import { ServerRequest } from "https://deno.land/std@0.79.0/http/server.ts";

/**
 * Handle a query to api/. At the moment, there's nothing to present here.
 * @param req
 */
export default function handleRequest(req: ServerRequest) {
  return req.respond({
    body: JSON.stringify({ error: "Try /asn, /ip, or /prefix endpoints." }),
    status: 404,
  });
}
