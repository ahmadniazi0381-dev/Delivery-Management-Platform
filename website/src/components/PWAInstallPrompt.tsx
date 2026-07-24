"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { usePathname } from "next/navigation";

type InstallOutcome = "accepted" | "dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: InstallOutcome;
    platform: string;
  }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

const DISMISSED_AT_KEY = "pwa-install-dismissed-at";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 7000;

const SUPPRESSED_ROUTE_PREFIXES = [
  "/auth",
  "/checkout",
  "/dashboard",
  "/rider",
  "/payments",
];

function isSuppressedRoute(pathname: string): boolean {
  return SUPPRESSED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function dismissalIsActive(): boolean {
  try {
    const dismissedAt = window.localStorage.getItem(DISMISSED_AT_KEY);
    if (!dismissedAt) return false;

    const dismissedAtMs = Number(dismissedAt);
    if (!Number.isFinite(dismissedAtMs)) return false;

    return Date.now() - dismissedAtMs < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function rememberDismissal(): void {
  try {
    window.localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
  } catch {}
}

function clearDismissal(): void {
  try {
    window.localStorage.removeItem(DISMISSED_AT_KEY);
  } catch {}
}

function isRunningStandalone(): boolean {
  const standaloneMedia = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const navigatorStandalone = (window.navigator as NavigatorWithStandalone).standalone === true;
  return standaloneMedia || navigatorStandalone;
}

function isIOSLikeDevice(): boolean {
  const platform = window.navigator.platform || "";
  const userAgent = window.navigator.userAgent || "";
  return (
    /iPad|iPhone|iPod/.test(platform) ||
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
  );
}

function isIOSSafari(): boolean {
  const userAgent = window.navigator.userAgent || "";
  const vendor = window.navigator.vendor || "";
  const isSafariEngine = /Safari/i.test(userAgent) && /Apple/i.test(vendor);
  const isOtherIOSBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(userAgent);
  return isIOSLikeDevice() && isSafariEngine && !isOtherIOSBrowser;
}

export default function PWAInstallPrompt() {
  const pathname = usePathname() || "";
  const routeIsSuppressed = useMemo(() => isSuppressedRoute(pathname), [pathname]);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canShowIOSInstructions, setCanShowIOSInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [delayElapsed, setDelayElapsed] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setIsInstalled(isRunningStandalone());
    setCanShowIOSInstructions(isIOSSafari());
    setDismissed(dismissalIsActive());

    const delayTimer = window.setTimeout(() => setDelayElapsed(true), SHOW_DELAY_MS);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      clearDismissal();
      setDeferredPrompt(null);
      setCanShowIOSInstructions(false);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.clearTimeout(delayTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const shouldShow = delayElapsed && !dismissed && !isInstalled && !routeIsSuppressed;
  const showNativeInstall = shouldShow && deferredPrompt !== null;
  const showIOSInstructions = shouldShow && deferredPrompt === null && canShowIOSInstructions;

  useEffect(() => {
    if (!showNativeInstall && !showIOSInstructions) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        rememberDismissal();
        setDismissed(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showNativeInstall, showIOSInstructions]);

  const handleDismiss = useCallback(() => {
    rememberDismissal();
    setDismissed(true);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        clearDismissal();
        setIsInstalled(true);
      } else {
        rememberDismissal();
        setDismissed(true);
      }
    } finally {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  if (!showNativeInstall && !showIOSInstructions) return null;

  return (
    <section
      aria-labelledby="pwa-install-title"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(12px+env(safe-area-inset-bottom))] pointer-events-none"
    >
      <div className="mx-auto flex w-full max-w-[460px] items-center justify-between gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3 text-[var(--text-primary)] shadow-lg pointer-events-auto backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--cream)] text-[var(--maroon)] font-bold">
            {showNativeInstall ? <Download size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
          </div>
          <div className="min-w-0">
            <h2 id="pwa-install-title" className="text-xs font-bold truncate">
              {showNativeInstall ? "Install Naseeb Baryani App" : "Add to Home Screen"}
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] truncate">
              {showNativeInstall ? "Faster ordering & instant status updates" : "Tap Share -> Add to Home Screen"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {showNativeInstall ? (
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex h-8 items-center justify-center rounded-full bg-[var(--saffron)] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--saffron-dark)]"
            >
              Install
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex h-8 items-center justify-center rounded-full bg-[var(--saffron)] px-3 text-xs font-bold text-white shadow-sm"
            >
              Got It
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
            aria-label="Dismiss install prompt"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
