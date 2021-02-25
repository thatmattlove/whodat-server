import { ServerRequest } from "https://deno.land/std@0.79.0/http/server.ts";
import { getParams, getHeaders, errorResponse } from "../src/util.ts";
import { getPrefixInfo } from "../src/queries.ts";

/**
 * Handle a prefix query.
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
    const prefixInfo = await getPrefixInfo(target);
    return req.respond({
      body: JSON.stringify(prefixInfo),
      status: 200,
      headers: getHeaders(),
    });
  } catch (err) {
    return req.respond(errorResponse(err, target));
  }
}
