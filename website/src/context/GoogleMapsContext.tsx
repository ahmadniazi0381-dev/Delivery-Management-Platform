"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface GoogleMapsContextType {
  isLoaded: boolean;
  error: string | null;
  apiKey: string | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

export function getGoogleMapsApiKey(): string | undefined {
  const key =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  return key?.trim() || undefined;
}

/** Static Maps URL for checkout mini-preview (keyed — avoids embed "Oops!" without Embed API). */
export function buildStaticMapUrl(lat: number, lng: number, apiKey: string): string {
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: "16",
    size: "640x240",
    scale: "2",
    maptype: "roadmap",
    markers: `color:0xC2410C|${lat},${lng}`,
    key: apiKey,
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

function installGoogleMapsBootstrap(apiKey: string): void {
  const w = window as typeof window & {
    google?: { maps?: { importLibrary?: (library: string) => Promise<unknown> } };
  };

  if (w.google?.maps?.importLibrary) return;

  const config = { key: apiKey, v: "weekly" };

  (
    (g: Record<string, string>) => {
      let loadPromise: Promise<void> | undefined;
      const googleNamespace = "google";
      const importLibraryName = "importLibrary";
      const callbackName = "__ib__";
      const doc = document;
      const win = window as typeof window & Record<string, unknown>;
      win[googleNamespace] = win[googleNamespace] || {};
      const mapsNamespace = (win[googleNamespace] as { maps?: Record<string, unknown> }).maps || {};
      (win[googleNamespace] as { maps: Record<string, unknown> }).maps = mapsNamespace;
      const requestedLibraries = new Set<string>();
      const params = new URLSearchParams();

      const loadScript = () =>
        loadPromise ||
        (loadPromise = new Promise<void>((resolve, reject) => {
          const script = doc.createElement("script");
          // CRITICAL: libraries must be comma-separated (maps,places) — not concatenated
          params.set("libraries", [...requestedLibraries].join(","));
          for (const option in g) {
            params.set(
              option.replace(/[A-Z]/g, (char) => `_${char[0].toLowerCase()}`),
              g[option]
            );
          }
          params.set("callback", `${googleNamespace}.maps.${callbackName}`);
          script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
          mapsNamespace[callbackName] = resolve;
          script.onerror = () => reject(new Error("Google Maps could not load."));
          script.id = "google-maps-api-script";
          script.async = true;
          doc.head.append(script);
        }));

      mapsNamespace[importLibraryName] =
        mapsNamespace[importLibraryName] ||
        ((library: string, ...args: unknown[]) =>
          requestedLibraries.add(library) &&
          loadScript().then(() =>
            (mapsNamespace[importLibraryName] as (library: string, ...args: unknown[]) => unknown)(
              library,
              ...args
            )
          ));
    }
  )(config);
}

function removeInvalidGoogleMapsScripts(apiKey: string): void {
  document.querySelectorAll('script[src*="maps.googleapis.com"]').forEach((node) => {
    const src = node.getAttribute("src") || "";
    if (!src.includes(`key=${apiKey}`)) {
      node.remove();
    }
  });
}

async function loadGoogleMapsLibraries(): Promise<void> {
  const google = (
    window as typeof window & {
      google: { maps: { importLibrary: (library: string) => Promise<unknown> } };
    }
  ).google;
  await Promise.all([
    google.maps.importLibrary("maps"),
    google.maps.importLibrary("places"),
  ]);
}

export function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiKey = getGoogleMapsApiKey() || null;

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!apiKey) {
      setError(
        "Google Maps API key not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_KEY (Maps JavaScript API + Places API enabled)."
      );
      return;
    }

    let cancelled = false;

    const initialize = async () => {
      try {
        removeInvalidGoogleMapsScripts(apiKey);
        installGoogleMapsBootstrap(apiKey);
        await loadGoogleMapsLibraries();

        if (!cancelled) {
          setIsLoaded(true);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load Google Maps. Check API key, billing, and HTTP referrer restrictions."
          );
          setIsLoaded(false);
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, error, apiKey }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error("useGoogleMaps must be used within GoogleMapsProvider");
  }
  return context;
}
