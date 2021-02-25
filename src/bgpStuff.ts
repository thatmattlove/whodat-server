/**
 * BGPStuff.net is a wonderful tool written by Darren O'Connor.
 * ©2021 Darren O'Connor
 *
 * @see https://bgpstuff.net
 */
const BGP_STUFF_URL = "https://bgpstuff.net";

interface BGPStuff<T> {
  CurrentYear: number;
  ID: string;
  IP: string;
  Locale: string;
  Timer: string;
  Response: {
    CacheTime: string;
    Exists: boolean;
    Action: string;
    IP: string;
    Origin: string;
  } & T;
}

interface Sourced {
  Sourced: {
    Ipv4: number;
    Ipv6: number;
    Prefixes: string[];
  };
}

export async function getASNPrefixes(asn: string) {
  try {
    const res = await fetch(`${BGP_STUFF_URL}/sourced/${asn}`, {
      method: "GET",
      headers: { "content-type": "application/json" },
    });
    if (res.ok) {
      const json = (await res.json()) as BGPStuff<Sourced>;
      return json.Response.Sourced.Prefixes;
    }
  } catch (err) {
    throw new Error(`Error getting prefixes for ASN '${asn}': ${err.message}`);
  }
}
