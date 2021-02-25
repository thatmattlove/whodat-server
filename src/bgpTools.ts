/**
 * bgp.tools is a wonderful tool maintained by Basil Fillan, Ben Cartwright-Cox, Cynthia Revström, Igloo22225, Job Snijders, Molly Miller, Roelf Wichertjes, Tim Stallard, Tommy Bowditch.
 *
 * @see https://bgp.tools/credits
 */
import { parseAsn } from "./util.ts";

type Nullable<T> = T | null;

type BGPToolsResponse = {
  asn: Nullable<string>;
  ip: Nullable<string>;
  prefix: Nullable<string>;
  country: Nullable<string>;
  registry: Nullable<string>;
  allocated: Nullable<string>;
  org: Nullable<string>;
};

/**
 * Match an string containing only numbers, optionally preceded by 'AS'.
 */
const ASN_PATTERN = new RegExp(/^(AS)?\d+$/gm);

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

/**
 * Parse the plain text socket response to a usable object.
 * @param response
 */
function parseResponse(response: string): BGPToolsResponse {
  const lines = response.split("\n");
  if (lines.length == 1) {
    return {} as BGPToolsResponse;
  }
  const parts = lines[1].split("|").map((p) => {
    if (typeof p === "string") {
      const value = p.replaceAll("\x00", "").trim();
      if (value === "") {
        return null;
      }
      return value;
    } else {
      return null;
    }
  });
  const [asn, ip, prefix, country, registry, allocated, org] = parts;
  return {
    asn,
    ip,
    prefix,
    country,
    registry,
    allocated,
    org,
  };
}

/**
 * Open a TCP socket to bgp.tools and perform a query of the specified target.
 * @param target
 * @see https://bgp.tools/kb/api
 */
export async function bgpToolsQuery(target: string): Promise<BGPToolsResponse> {
  // Ensure an ASN query is prepended with 'AS'.
  if (target.match(ASN_PATTERN)) {
    target = `AS${parseAsn(target)}`;
  }

  const connection = await Deno.connect({ hostname: "bgp.tools", port: 43 });
  const buf = new Uint8Array(1024);

  await connection.write(ENCODER.encode(`${target}\n`));
  await connection.read(buf);

  const res = DECODER.decode(buf);

  connection.close();

  const parsed = parseResponse(res);

  if (Object.keys(parsed).length !== 0) {
    return parsed;
  } else {
    throw new Error(`Error requesting data for '${target}'`);
  }
}
