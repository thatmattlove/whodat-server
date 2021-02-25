import { getPTR } from "./dns.ts";
import { cidrToIP } from "./util.ts";
import { bgpToolsQuery } from "./bgpTools.ts";
import { getPeeringDbNet } from "./peeringDB.ts";
import { getPrefixOverView, whoisLookup, parseWhois } from "./ripeStat.ts";

type StrNull = string | null;

type Origin = {
  asn: StrNull;
  org: StrNull;
  name: StrNull;
};

type IPInfo = {
  ip: StrNull;
  prefix: StrNull;
  asn: StrNull;
  ptr: StrNull;
  rir: StrNull;
  org: StrNull;
  name: StrNull;
};

type PrefixInfo = {
  prefix: StrNull;
  name: StrNull;
  org: StrNull;
  rir: StrNull;
  origins: Origin[];
};

type ASNInfo = {
  org: StrNull;
  asn: StrNull;
  country: StrNull;
  lg: StrNull;
  website: StrNull;
};

/**
 * Get information about an IP address.
 * @param target
 */
export async function getIPInfo(target: string): Promise<IPInfo> {
  const ptr = await getPTR(target);
  const info = await bgpToolsQuery(target);
  const whois = await whoisLookup(target);
  const { name } = parseWhois(whois);
  const { asn, org, ip, prefix, registry: rir } = info;
  return { asn, org, ip, prefix, rir, ptr, name };
}

/**
 * Get information about a prefix.
 * @param target
 */
export async function getPrefixInfo(target: string): Promise<PrefixInfo> {
  const asIP = cidrToIP(target);
  const { org, prefix, registry: rir } = await bgpToolsQuery(asIP);
  const {
    data: { asns },
  } = await getPrefixOverView(target);

  let origins = [] as Origin[];
  for (const as of asns) {
    const { org, asn } = await bgpToolsQuery(as.asn.toString());
    origins = [...origins, { org, asn, name: as.holder }];
  }

  const whois = await whoisLookup(target);
  const { name } = parseWhois(whois);
  return { org, prefix, rir, origins, name };
}

/**
 * Get information about an ASN.
 * @param target
 */
export async function getASNInfo(target: string): Promise<ASNInfo> {
  const { org, asn, country } = await bgpToolsQuery(target);
  const { data } = await getPeeringDbNet(target);
  let lg = null;
  let website = null;

  if (data.length !== 0) {
    // deno-lint-ignore camelcase
    const [{ looking_glass, website: _website }] = data;
    if (looking_glass !== "") {
      lg = looking_glass;
    }
    if (_website !== "") {
      website = _website;
    }
  }

  return { org, asn, country, lg, website };
}
