export const normalizeStoreKey = (storeUrl: string): string => {
  const raw = (storeUrl || "").trim().toLowerCase();
  // Keep it stable: strip protocol and trailing slashes, then replace non-alphanum with "_"
  const noProto = raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return noProto.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
};

export const normalizeLine = (v: string): string =>
  (v || "").trim().replace(/\s+/g, " ");

export const normalizeForMatch = (v: string): string =>
  normalizeLine(v).toLowerCase();
