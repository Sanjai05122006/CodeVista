import dns from "dns";
import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";
import { logger } from "../utils/logger";

const buildPgConnectionString = (databaseUrl: string) => {
  const shouldManageSslInCode =
    databaseUrl.includes("supabase.co") ||
    databaseUrl.includes("supabase.com") ||
    /sslmode=/i.test(databaseUrl);

  if (!shouldManageSslInCode) {
    return databaseUrl;
  }

  const parsed = new URL(databaseUrl);
  parsed.searchParams.delete("sslmode");
  parsed.searchParams.delete("sslcert");
  parsed.searchParams.delete("sslkey");
  parsed.searchParams.delete("sslrootcert");

  return parsed.toString();
};

const pgConnectionString = buildPgConnectionString(env.DATABASE_URL);

const lookupWithDnsFallback = (
  hostname: string,
  options: any,
  callback: any
) => {
  const normalizedOptions =
    typeof options === "function" ? undefined : options ?? {};
  const normalizedCallback =
    typeof options === "function" ? options : callback;

  dns.lookup(hostname, normalizedOptions as any, (lookupError, address, family) => {
    if (!lookupError) {
      normalizedCallback?.(null, address as any, family);
      return;
    }

    dns.resolve4(hostname, (resolve4Error, ipv4Addresses) => {
      if (!resolve4Error && ipv4Addresses.length > 0) {
        normalizedCallback?.(null, ipv4Addresses[0] as any, 4);
        return;
      }

      dns.resolve6(hostname, (resolve6Error, ipv6Addresses) => {
        if (!resolve6Error && ipv6Addresses.length > 0) {
          normalizedCallback?.(null, ipv6Addresses[0] as any, 6);
          return;
        }

        normalizedCallback?.(lookupError, undefined as any, undefined as any);
      });
    });
  });
};

export const db = new Pool({
  connectionString: pgConnectionString,
  ssl:
    env.DATABASE_URL.includes("supabase.co") ||
    env.DATABASE_URL.includes("supabase.com") ||
    /sslmode=require/i.test(env.DATABASE_URL)
      ? { rejectUnauthorized: env.PG_SSL_REJECT_UNAUTHORIZED }
      : undefined,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
  lookup: lookupWithDnsFallback,
} as any);

db.on("error", (error) => {
  logger.error("db.pool.error", {
    message: error.message,
    code: (error as NodeJS.ErrnoException).code,
  });
});

export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
