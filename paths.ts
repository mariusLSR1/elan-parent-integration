import { ELAN_PROXY_BASE_PATH } from "./constants";

/** Full same-origin URL path for the iframe `src` (e.g. `/elan/` or `/elan/login`). */
export function elanProxiedPath(appPath: string): string {
  const base = ELAN_PROXY_BASE_PATH.endsWith("/")
    ? ELAN_PROXY_BASE_PATH.slice(0, -1)
    : ELAN_PROXY_BASE_PATH;
  if (!appPath || appPath === "/") return base;
  const p = appPath.startsWith("/") ? appPath : `/${appPath}`;
  return `${base}${p}`;
}
