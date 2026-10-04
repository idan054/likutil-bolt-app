import type { FastDeliveryProductCategory } from "../../types/fastDelivery";

const MAX_PRODUCTS_PER_REQUEST = 100;
const REQUEST_TIMEOUT_MS = 10_000;
const CATEGORY_CACHE_TTL_MS = 5 * 60 * 1000;

type CachedCategories = FastDeliveryProductCategory[] | null;
type CategoryCacheEntry = {
  value: CachedCategories;
  expiresAt: number;
};

const categoryCache = new Map<string, CategoryCacheEntry>();
const batchRequestCache = new Map<string, Promise<Map<number, CachedCategories>>>();

const normalizeStoreOrigin = (storeUrl: string) => {
  const raw = storeUrl.trim();
  const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  return parsed.origin;
};

const getCandidateOrigins = (storeUrl: string) => {
  const origin = normalizeStoreOrigin(storeUrl);
  const parsed = new URL(origin);
  const alternate = new URL(origin);
  alternate.hostname = parsed.hostname.startsWith("www.")
    ? parsed.hostname.slice(4)
    : `www.${parsed.hostname}`;

  return alternate.origin === origin ? [origin] : [origin, alternate.origin];
};

const normalizeCategories = (value: unknown): FastDeliveryProductCategory[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((category) => {
      if (!category || typeof category !== "object") return null;
      const raw = category as Record<string, unknown>;
      const name = typeof raw.name === "string" ? raw.name.trim() : "";
      if (!name) return null;

      const id = Number(raw.id);
      return {
        ...(Number.isInteger(id) && id > 0 ? { id } : {}),
        name,
        ...(typeof raw.slug === "string" && raw.slug.trim()
          ? { slug: raw.slug.trim() }
          : {}),
      };
    })
    .filter((category): category is FastDeliveryProductCategory => category !== null);
};

const fetchProductBatch = async (
  storeUrl: string,
  productIds: number[]
): Promise<Map<number, CachedCategories>> => {
  let lastError: unknown = null;

  for (const origin of getCandidateOrigins(storeUrl)) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const url = new URL("/wp-json/wc/store/v1/products", origin);
      url.searchParams.set("include", productIds.join(","));
      url.searchParams.set("per_page", String(productIds.length));

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-cache",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Product category lookup failed with HTTP ${response.status}`);
      }

      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) {
        throw new Error("Product category lookup returned an invalid response");
      }

      const result = new Map<number, CachedCategories>();
      for (const product of payload) {
        if (!product || typeof product !== "object") continue;
        const raw = product as Record<string, unknown>;
        const id = Number(raw.id);
        if (!Number.isInteger(id) || id <= 0) continue;
        result.set(id, normalizeCategories(raw.categories));
      }

      for (const productId of productIds) {
        if (!result.has(productId)) result.set(productId, null);
      }

      return result;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Product category lookup failed");
};

const chunk = (values: number[], size: number) => {
  const chunks: number[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
};

export const getProductCategoriesByIds = async (
  storeUrl: string,
  productIds: number[]
): Promise<Map<number, CachedCategories>> => {
  const origin = normalizeStoreOrigin(storeUrl);
  const ids = Array.from(
    new Set(productIds.filter((id) => Number.isInteger(id) && id > 0))
  );
  const result = new Map<number, CachedCategories>();

  const missingIds = ids.filter((id) => {
    const cacheKey = `${origin}__${id}`;
    const cached = categoryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      result.set(id, cached.value);
      return false;
    }

    categoryCache.delete(cacheKey);
    return true;
  });

  await Promise.all(
    chunk(missingIds, MAX_PRODUCTS_PER_REQUEST).map(async (batch) => {
      const batchKey = `${origin}__${batch.slice().sort((a, b) => a - b).join("_")}`;
      let request = batchRequestCache.get(batchKey);

      if (!request) {
        request = fetchProductBatch(storeUrl, batch);
        batchRequestCache.set(batchKey, request);
      }

      try {
        const batchResult = await request;
        for (const [productId, categories] of batchResult) {
          categoryCache.set(`${origin}__${productId}`, {
            value: categories,
            expiresAt: Date.now() + CATEGORY_CACHE_TTL_MS,
          });
          result.set(productId, categories);
        }
      } finally {
        batchRequestCache.delete(batchKey);
      }
    })
  );

  return result;
};
