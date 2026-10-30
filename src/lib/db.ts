import { PrismaClient } from "@prisma/client";

/**
 * Prisma client with dual-runtime support:
 *
 * - Local dev: standard PrismaClient against SQLite (DATABASE_URL env var).
 * - Cloudflare Workers: PrismaClient with the D1 driver adapter, using the
 *   `DB` binding from the request context (provided by @opennextjs/cloudflare).
 *
 * Bindings are only available inside a request context on Workers, so we use
 * a lazy recursive proxy: `db.story.findMany()` resolves the client on first
 * call, preserving the standard Prisma promise API.
 */

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaInit?: Promise<PrismaClient>;
};

async function createClient(): Promise<PrismaClient> {
  // Reuse cached instance (survives HMR in dev)
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  // 1. Try Cloudflare D1 (request context exists only on Workers)
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    if (env?.DB) {
      const { PrismaD1 } = await import("@prisma/adapter-d1");
      const client = new PrismaClient({
        adapter: new PrismaD1(env.DB as any),
      });
      globalForPrisma.prisma = client;
      return client;
    }
  } catch {
    // Not on Cloudflare (local dev/build) — fall through to SQLite
  }

  // 2. Local / Node runtime: SQLite file via DATABASE_URL
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  globalForPrisma.prisma = client;
  return client;
}

function init(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) return Promise.resolve(globalForPrisma.prisma);
  if (!globalForPrisma.prismaInit) {
    globalForPrisma.prismaInit = createClient().then((c) => {
      globalForPrisma.prisma = c;
      return c;
    });
  }
  return globalForPrisma.prismaInit;
}

type PendingCall = { path: (string | symbol)[]; args: unknown[] };

function resolveAndCall(client: PrismaClient, { path, args }: PendingCall) {
  let target: any = client;
  for (const key of path) target = target?.[key];
  if (typeof target === "function") return target.apply(client, args);
  return target;
}

function lazyProxy(path: (string | symbol)[] = []): any {
  return new Proxy(function () {} as any, {
    get(_t, prop) {
      // Never behave like a thenable or iterate accidentally
      if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
      if (typeof prop === "symbol") return undefined;
      return lazyProxy([...path, prop]);
    },
    apply(_t, _this, args) {
      return init().then((client) => resolveAndCall(client, { path, args }));
    },
  });
}

export const db: PrismaClient = lazyProxy();
