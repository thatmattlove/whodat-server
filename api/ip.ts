import { ServerRequest } from "https://deno.land/std@0.79.0/http/server.ts";
import { getParams, getHeaders, errorResponse } from "../src/util.ts";
import { getIPInfo } from "../src/queries.ts";

/**
 * Handle an IP address query.
 * @param req
 */
export default async function handleRequest(req: ServerRequest) {
  const params = getParams(req);
  const target = params.get("target");
  if (target === null) {
    return req.respond({
      body: JSON.stringify({ error: "Target required." }),
      status: 400,
      headers: getHeaders(),
    });
  }
  try {
    const ipInfo = await getIPInfo(target);
    return req.respond({
      body: JSON.stringify(ipInfo),
      status: 200,
      headers: getHeaders(),
    });
  } catch (err) {
    return req.respond(errorResponse(err, target));
  }
}
