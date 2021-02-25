import { ServerRequest } from "https://deno.land/std@0.79.0/http/server.ts";
import { getHeaders, getParams, errorResponse } from "../src/util.ts";
import { getASNInfo } from "../src/queries.ts";

/**
 * Handle an ASN query.
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
    const asnInfo = await getASNInfo(target);
    return req.respond({
      body: JSON.stringify(asnInfo),
      status: 200,
      headers: getHeaders(),
    });
  } catch (err) {
    return req.respond(errorResponse(err, target));
  }
}
