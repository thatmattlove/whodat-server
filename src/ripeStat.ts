// deno-lint-ignore-file camelcase
/**
 * Retrieve data from the RIPEStat API.
 *
 * @see https://stat.ripe.net/docs/data_api
 */

import urlcat from "https://deno.land/x/urlcat/src/index.ts";

/**
 * RIPEStat Base Response.
 */
export interface RIPEStat<T> {
  build_version: string;
  cached: boolean;
  data_call_status: string;
  messages: string[][];
  process_time: number;
  query_id: string;
  see_also: string[];
  server_id: string;
  status: string;
  status_code: number;
  time: string;
  version: string;
  data: T;
}

/**
 * RIPEStat Network Info Response.
 * @see https://stat.ripe.net/docs/data_api#network-info
 */
interface NetworkInfo {
  asns: string[];
  prefix: string;
}

/**
 * RIPEStat Prefix Overview > asns Response.
 * @see https://stat.ripe.net/docs/data_api#prefix-overview
 */
interface PrefixOverViewAsn {
  asn: number;
  holder: string;
}

/**
 * RIPEStat Prefix Overview Response.
 * @see https://stat.ripe.net/docs/data_api#prefix-overview
 */
interface PrefixOverView {
  actual_num_related: number;
  announced: boolean;
  asns: PrefixOverViewAsn[];
  block: {
    desc: string;
    name: string;
    resource: string;
  };
  is_less_specific: boolean;
  num_filtered_out: number;
  query_time: string;
  related_prefixes: string[];
  type: string;
}

/**
 * RIPEStat Whois > irr_records/records Response.
 * @see https://stat.ripe.net/docs/data_api#whois
 */
interface WhoisRecord {
  details_link: string | null;
  key: string;
  value: string;
}

/**
 * RIPEStat Whois Response.
 * @see https://stat.ripe.net/docs/data_api#whois
 */
export interface Whois {
  resource: string;
  query_time: string;
  records: WhoisRecord[][];
  irr_records: WhoisRecord[][];
  authorities: string[];
}

/**
 * Extracted & post-parsed RIPEStat whois object.
 */
type ParsedWhois = {
  name: string;
  org: string;
  handle: string;
  range: string;
  cidr: string;
};

/**
 * Different RIRs use different key names for each value we care about. This is a crude — but
 * effective — method of "translating" those keys into recognizable values for us to extract.
 */
const WHOIS_KEYMAP = {
  Organization: "org",
  OrgName: "org",
  org: "org",
  NetHandle: "handle",
  NetName: "name",
  netname: "name",
  CIDR: "cidr",
  inetnum: "cidr",
  inet6num: "cidr",
} as { [k: string]: keyof ParsedWhois };

const WHOIS_KEYS = Object.keys(WHOIS_KEYMAP);

/**
 * Construct a RIPEStat API URL.
 * @param path
 * @param resource
 */
function ripeStatURL(path: string, resource: string) {
  return urlcat(`https://stat.ripe.net/data/${path}/data.json`, { resource });
}

/**
 * Query the RIPEStat prefix-overview endpoint.
 * @param prefix
 */
export async function getPrefixOverView(
  prefix: string
): Promise<RIPEStat<PrefixOverView>> {
  const res = await fetch(ripeStatURL("prefix-overview", prefix));
  const json = (await res.json()) as RIPEStat<PrefixOverView>;
  return json;
}

/**
 * Query the RIPEStat network-info endpoint.
 * @param ip
 */
export async function getNetworkInfo(
  ip: string
): Promise<RIPEStat<NetworkInfo>> {
  const res = await fetch(ripeStatURL("network-info", ip));
  const json = (await res.json()) as RIPEStat<NetworkInfo>;
  return json;
}

/**
 * Query the RIPEStat whois endpoint.
 * @param target
 */
export async function whoisLookup(target: string): Promise<RIPEStat<Whois>> {
  const res = await fetch(ripeStatURL("whois", target));
  const json = (await res.json()) as RIPEStat<Whois>;
  return json;
}

/**
 * Parse the RIPEStat whois response.
 * @param whois
 */
export function parseWhois(whois: RIPEStat<Whois>): ParsedWhois {
  /**
   * The records block is an array of arrays containing each key/value pair in a whois response.
   * RIPE (likely by way of the whois protocol) puts less specific information first and more
   * specific information last. For example, the IANA's whois records for 192.0.0.0/8 would come
   * first in the response, and a RIR's records for a more specific allocation such as 192.0.2.0/24
   * would come last.
   */
  const records = whois.data.records
    // Flatten the array of arrays to a single array of whois k/v objects.
    .flat()
    // Remove records that don't contain keys we care about.
    .filter((record) => WHOIS_KEYS.includes(record.key))
    // Reverse the order so we're matching on the most specific information first.
    .reverse();

  const parsed = {} as ParsedWhois;

  for (const record of records) {
    if (WHOIS_KEYS.includes(record.key)) {
      // Map the RIR's whois key to one of our keys.
      const key = WHOIS_KEYMAP[record.key];
      if (!Object.keys(parsed).includes(key)) {
        /* Only add it to the object if it hasn't already been added. This way, the most specific
        information will always be used. */
        parsed[key] = record.value;
      }
    }
  }
  return parsed;
}
