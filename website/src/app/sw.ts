import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheFirst,
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[];
  }
}

declare const self: WorkerGlobalScope;

const CACHE_VERSION = "v1";

const PUBLIC_PAGES = new Set([
  "/",
  "/menu",
  "/about",
  "/contact",
  "/faq",
  "/delivery-policy",
  "/privacy-policy",
  "/terms",
]);

// Explicit denylist for personalized, transactional, privileged, and realtime routes.
const SENSITIVE_PATH_PREFIXES = [
  "/auth",
  "/api/auth",
  "/api/checkout",
  "/api/notifications",
  "/api/order",
  "/api/orders",
  "/api/owner",
  "/api/payment",
  "/api/payments",
  "/api/profile",
  "/api/rider",
  "/api/addresses",
  "/admin",
  "/addresses",
  "/cart",
  "/checkout",
  "/dashboard",
  "/notifications",
  "/orders",
  "/payments",
  "/profile",
  "/rider",
  "/socket.io",
];

const SENSITIVE_PATH_PARTS = [
  "login",
  "logout",
  "register",
  "refresh-token",
  "refresh_token",
  "token-refresh",
  "oauth",
  "callback",
  "session",
  "socket.io",
];

function isGet(request: Request): boolean {
  return request.method === "GET";
}

function hasAuthorization(request: Request): boolean {
  return request.headers.has("Authorization");
}

function isSensitivePath(pathname: string): boolean {
  const lowerPath = pathname.toLowerCase();
  return (
    SENSITIVE_PATH_PREFIXES.some((path) => lowerPath.startsWith(path)) ||
    SENSITIVE_PATH_PARTS.some((part) => lowerPath.includes(part))
  );
}

function isSafeCacheableRequest(request: Request, url: URL): boolean {
  return isGet(request) && !hasAuthorization(request) && !isSensitivePath(url.pathname);
}

function isPublicPageNavigation(request: Request, url: URL, sameOrigin: boolean): boolean {
  return (
    sameOrigin &&
    request.mode === "navigate" &&
    url.search === "" &&
    isSafeCacheableRequest(request, url) &&
    PUBLIC_PAGES.has(url.pathname)
  );
}

function isPwaAsset(url: URL, sameOrigin: boolean): boolean {
  return (
    sameOrigin &&
    (url.pathname.startsWith("/icons/") ||
      url.pathname === "/apple-touch-icon.png" ||
      url.pathname === "/logo.jpg" ||
      url.pathname === "/manifest.webmanifest")
  );
}

function isSameOriginPublicImage(request: Request, url: URL, sameOrigin: boolean): boolean {
  return (
    sameOrigin &&
    request.destination === "image" &&
    isSafeCacheableRequest(request, url) &&
    !isPwaAsset(url, sameOrigin)
  );
}

function isPublicSupabaseStorageImage(request: Request, url: URL): boolean {
  return (
    request.destination === "image" &&
    isSafeCacheableRequest(request, url) &&
    url.protocol === "https:" &&
    url.hostname.endsWith(".supabase.co") &&
    url.pathname.startsWith("/storage/")
  );
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ request, url }) => {
        if (!isGet(request)) return true;
        if (hasAuthorization(request)) return true;
        if (isSensitivePath(url.pathname)) return true;
        return false;
      },
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({
        cacheName: `next-static-${CACHE_VERSION}`,
        plugins: [
          new CacheableResponsePlugin({ statuses: [200] }),
          new ExpirationPlugin({
            maxEntries: 96,
            maxAgeSeconds: 30 * 24 * 60 * 60,
            maxAgeFrom: "last-used",
          }),
        ],
      }),
    },
    {
      matcher: ({ url, sameOrigin }) => isPwaAsset(url, sameOrigin),
      handler: new CacheFirst({
        cacheName: `pwa-assets-${CACHE_VERSION}`,
        plugins: [
          new CacheableResponsePlugin({ statuses: [200] }),
          new ExpirationPlugin({
            maxEntries: 24,
            maxAgeSeconds: 30 * 24 * 60 * 60,
            maxAgeFrom: "last-used",
          }),
        ],
      }),
    },
    {
      matcher: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: new CacheFirst({
        cacheName: `google-fonts-webfonts-${CACHE_VERSION}`,
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 8,
            maxAgeSeconds: 365 * 24 * 60 * 60,
            maxAgeFrom: "last-used",
          }),
        ],
      }),
    },
    {
      matcher: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: new StaleWhileRevalidate({
        cacheName: `google-fonts-stylesheets-${CACHE_VERSION}`,
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 8,
            maxAgeSeconds: 7 * 24 * 60 * 60,
            maxAgeFrom: "last-used",
          }),
        ],
      }),
    },
    {
      matcher: ({ request, url, sameOrigin }) =>
        isSameOriginPublicImage(request, url, sameOrigin) ||
        isPublicSupabaseStorageImage(request, url),
      handler: new StaleWhileRevalidate({
        cacheName: `public-images-${CACHE_VERSION}`,
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 80,
            maxAgeSeconds: 14 * 24 * 60 * 60,
            maxAgeFrom: "last-used",
          }),
        ],
      }),
    },
    {
      matcher: ({ request, url, sameOrigin }) => isPublicPageNavigation(request, url, sameOrigin),
      handler: new NetworkFirst({
        cacheName: `public-pages-${CACHE_VERSION}`,
        networkTimeoutSeconds: 3,
        plugins: [
          new CacheableResponsePlugin({ statuses: [200] }),
          new ExpirationPlugin({
            maxEntries: 12,
            maxAgeSeconds: 24 * 60 * 60,
            maxAgeFrom: "last-used",
          }),
        ],
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.mode === "navigate";
        },
      },
    ],
  },
});

serwist.addEventListeners();
