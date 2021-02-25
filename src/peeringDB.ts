// deno-lint-ignore-file camelcase
import urlcat from "https://deno.land/x/urlcat/src/index.ts";
import { parseAsn } from "./util.ts";

/**
 * PeeringDB API /net response.
 * @see https://www.peeringdb.com/apidocs/#operation/list%20net
 */
interface Net {
  aka: string;
  allow_ixp_update: boolean;
  asn: number;
  created: string;
  id: number;
  info_ipv6: boolean;
  info_mulitcast: boolean;
  info_never_via_route_servers: boolean;
  info_prefixes4: number;
  info_prefixes6: number;
  info_ratio: string;
  info_scope: string;
  info_traffic: string;
  info_type: string;
  info_unicast: boolean;
  irr_as_set: string;
  looking_glass: "";
  name: string;
  netfac_updated: string | null;
  netixlan_updated: string | null;
  notes: string;
  org_id: 17298;
  poc_updated: string;
  policy_contracts: string;
  policy_general: string;
  policy_locations: string;
  policy_ratio: boolean;
  policy_url: string;
  route_server: string;
  status: string;
  updated: string;
  website: string;
}

/**
 * PeeringDB Base Response.
 */
interface PeeringDB<T> {
  meta: Record<string, unknown>;
  data: T[];
}

/**
 * Query PeeringDB API by AS Number.
 * @param target
 */
export async function getPeeringDbNet(target: string): Promise<PeeringDB<Net>> {
  const asn = parseAsn(target);
  const url = urlcat("https://peeringdb.com/api/net", { asn });
  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
  });
  const json = (await res.json()) as PeeringDB<Net>;
  return json;
}
