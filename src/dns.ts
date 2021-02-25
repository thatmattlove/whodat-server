import urlcat from "https://deno.land/x/urlcat/src/index.ts";
import {
  isIPv4,
  isIPv6,
} from "https://raw.githubusercontent.com/ako-deno/isIP/master/mod.ts";

import type { DNSResponse } from "./types/dns-over-https.ts";

/**
 * Perform a DNS-over-HTTPS query to Cloudflare.
 * @param name
 *
 * @see https://developers.cloudflare.com/1.1.1.1/dns-over-https
 */
async function dnsQuery(name: string): Promise<DNSResponse | undefined> {
  const type = "PTR";
  const url = urlcat("https://cloudflare-dns.com/dns-query", { name, type });

  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/dns-json" },
  });

  const json = (await res.json()) as DNSResponse;
  return json;
}

/**
 * Convert an IPv4 dotted-decimal address or IPv6 address to a reverse-DNS/PTR record format.
 * @param addr
 */
function toPTR(addr: string): string {
  if (isIPv4(addr)) {
    return [...addr.toString().split(".").reverse(), "in-addr", "arpa"].join(
      "."
    );
  } else if (isIPv6(addr)) {
    const expanded = addr
      .toString()
      .split(":")
      .map((oct) => oct.padStart(4, "0"))
      .join("")
      .split("")
      .reverse();
    return [...expanded, "ip6", "arpa"].join(".");
  } else {
    throw new Error(`'${addr} is not a valid IPv4 or IPv6 address.'`);
  }
}

/**
 * Perform a reverse DNS lookup for a given IPv4 or IPv6 address.
 * @param target
 */
export async function getPTR(target: string): Promise<string | null> {
  let answer = null;
  const ptr = toPTR(target);
  const doh = await dnsQuery(ptr);

  if (typeof doh !== "undefined") {
    if (doh.Status === 0) {
      const [{ data }] = doh.Answer;

      if (data[data.length - 1] === ".") {
        answer = data.slice(0, -1);
      } else {
        answer = data;
      }
    }
  }

  return answer;
}
