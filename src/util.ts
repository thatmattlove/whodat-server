import {
  ServerRequest,
  Response,
} from "https://deno.land/std@0.79.0/http/server.ts";

/**
 * Thrown when an ASN-type is unsupported or invalid.
 */
export class AsnError extends Error {}

export const ERROR_HEADERS = new Headers({
  "content-type": "application/json",
});

/**
 * Construct an error response.
 * @param err
 * @param target
 */
export function errorResponse(err: unknown, target: string): Response {
  const status = 500;
  const headers = ERROR_HEADERS;
  if (err instanceof Error) {
    return { status, headers, body: JSON.stringify({ error: err.message }) };
  } else {
    return {
      status,
      headers,
      body: JSON.stringify({
        error: `Something went wrong while performing a query for ${target}`,
      }),
    };
  }
}

// Use the bgp.tools 6 hour figure.
const CACHE_TIMEOUT = 21_600 as number;

/**
 * Parse a URL's query parameters.
 * @param req
 */
export function getParams(req: ServerRequest): URLSearchParams {
  const parts = req.url.split("?");
  const search = parts.slice(-1)[0];
  const params = new URLSearchParams(search);
  return params;
}

/**
 * Create response headers which include caching directives for Vercel.
 * @param age
 *
 * @see https://vercel.com/docs/serverless-functions/edge-caching
 */
export function getHeaders(age: number = CACHE_TIMEOUT): Headers {
  const headers = new Headers({
    "content-type": "application/json",
    "cache-control": `max-age=0, s-maxage=${age}`,
  });
  return headers;
}

/**
 * Parse an ASN string (optionally preceded with 'AS') to an integer. Also rejects invalid ASNs.
 * @param asn
 */
export function parseAsn(asn: string): number {
  try {
    const asnAsInt = Number(asn.replaceAll("AS", ""));
    switch (true) {
      case asnAsInt === 0:
        throw new AsnError(`'${asn}' is invalid.`);
      case asnAsInt === 23456:
        throw new AsnError(
          `'${asn}' is reserved for 4-byte ASN transition (See RFCs 4893 & 6793).`
        );
      case asnAsInt >= 65000 && asnAsInt <= 65535:
        throw new AsnError(`'${asn}' is reserved for private use.`);
      case asnAsInt >= 4200000000 && asnAsInt <= 4294967294:
        throw new AsnError(`'${asn}' is reserved for private use.`);
      default:
        return asnAsInt;
    }
  } catch (err) {
    if (err instanceof AsnError) {
      throw err;
    } else {
      throw new Error(`Error validating ASN '${asn}': ${err.message}`);
    }
  }
}

/**
 * Parse a CIDR string (e.g. 192.0.2.0/24) to the base IP (e.g. 192.0.2.0).
 * @param cidr
 */
export function cidrToIP(cidr: string) {
  return cidr.split("/")[0];
}
