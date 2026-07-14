"use client";

/**
 * useSoundSystem — REQ-SOUND-SYSTEM-001 / REQ-NOTIFICATION-SOUND-SYSTEM-001
 *
 * Priority tiers:
 *   CRITICAL (loop until action) : new-order.mp3
 *   SUCCESS  (play once)         : payment-success.mp3
 *   WARNING  (play once)         : payment-failed.mp3
 *
 * Rules:
 *   - Single Audio instance per tier (no overlapping sounds of the same tier).
 *   - CRITICAL loops continuously; stops only when stopOrderAlert() is called.
 *   - SUCCESS / WARNING play once; if already playing, queues the next play.
 *   - On any audio error: logs + calls the optional onError callback (never crashes).
 *   - Settings are read from localStorage key `naseeb_sound_settings` on every play.
 *   - testSound(type) plays one sound for the settings preview.
 */

import { useRef, useCallback } from "react";

// ─── Settings Type ────────────────────────────────────────────────────────────

export interface SoundSettings {
  masterEnabled: boolean;
  volume: number; // 0–1
  sounds: {
    newOrder: boolean;
    paymentSuccess: boolean;
    paymentFailed: boolean;
    riderArrivedRestaurant: boolean;
    riderArrivedCustomer: boolean;
    lowInventory: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // "HH:MM"
    end: string;   // "HH:MM"
  };
  muteAll: boolean;
}

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  masterEnabled: true,
  volume: 0.8,
  sounds: {
    newOrder: true,
    paymentSuccess: true,
    paymentFailed: true,
    riderArrivedRestaurant: true,
    riderArrivedCustomer: true,
    lowInventory: true,
  },
  quietHours: {
    enabled: false,
    start: "23:00",
    end: "07:00",
  },
  muteAll: false,
};

export const SETTINGS_KEY = "naseeb_sound_settings";

export function loadSoundSettings(): SoundSettings {
  if (typeof window === "undefined") return DEFAULT_SOUND_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SOUND_SETTINGS;
    return { ...DEFAULT_SOUND_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SOUND_SETTINGS;
  }
}

export function saveSoundSettings(settings: SoundSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── Quiet Hours Check ────────────────────────────────────────────────────────

function isQuietHour(settings: SoundSettings): boolean {
  if (!settings.quietHours.enabled) return false;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = settings.quietHours.start.split(":").map(Number);
  const [eh, em] = settings.quietHours.end.split(":").map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  // Handles overnight spans (e.g. 23:00 → 07:00)
  if (startMins <= endMins) {
    return nowMins >= startMins && nowMins < endMins;
  } else {
    return nowMins >= startMins || nowMins < endMins;
  }
}

// ─── Sound File Paths ─────────────────────────────────────────────────────────

const SOUNDS = {
  newOrder: "/sounds/new-order.mp3",
  paymentSuccess: "/sounds/payment-success.mp3",
  paymentFailed: "/sounds/payment-failed.mp3",
} as const;

type SoundKey = keyof typeof SOUNDS;

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseSoundSystemOptions {
  onError?: (type: SoundKey, err: unknown) => void;
}

export function useSoundSystem(options: UseSoundSystemOptions = {}) {
  // One Audio instance per sound type — ensures no overlapping
  const audioRef = useRef<Record<SoundKey, HTMLAudioElement | null>>({
    newOrder: null,
    paymentSuccess: null,
    paymentFailed: null,
  });

  // Queue for once-sounds (prevents overlap, plays next after current finishes)
  const queueRef = useRef<Record<"paymentSuccess" | "paymentFailed", number>>({
    paymentSuccess: 0,
    paymentFailed: 0,
  });

  // Whether the order alert loop is currently running
  const loopActiveRef = useRef(false);

  // ── Internal helpers ──────────────────────────────────────────────────────

  const getOrCreateAudio = useCallback((key: SoundKey): HTMLAudioElement | null => {
    if (typeof window === "undefined") return null;
    if (!audioRef.current[key]) {
      try {
        const audio = new Audio(SOUNDS[key]);
        audio.preload = "auto";
        audioRef.current[key] = audio;
      } catch (err) {
        options.onError?.(key, err);
        return null;
      }
    }
    return audioRef.current[key];
  }, [options]);

  const applyVolume = useCallback((audio: HTMLAudioElement, settings: SoundSettings) => {
    audio.volume = Math.min(1, Math.max(0, settings.volume));
  }, []);

  const canPlay = useCallback((soundKey: keyof SoundSettings["sounds"], settings: SoundSettings): boolean => {
    if (settings.muteAll) return false;
    if (!settings.masterEnabled) return false;
    if (isQuietHour(settings)) return false;
    return settings.sounds[soundKey] ?? true;
  }, []);

  // ── CRITICAL: Order Alert (loop) ──────────────────────────────────────────

  /**
   * Start the new-order alert loop.
   * Safe to call multiple times — only one loop runs at a time.
   */
  const playOrderAlert = useCallback(() => {
    if (loopActiveRef.current) return; // Already looping — do NOT restart

    const settings = loadSoundSettings();
    if (!canPlay("newOrder", settings)) return;

    const audio = getOrCreateAudio("newOrder");
    if (!audio) return;

    loopActiveRef.current = true;
    applyVolume(audio, settings);
    audio.loop = true;
    audio.currentTime = 0;

    audio.play().catch((err) => {
      console.error("[SOUND] Failed to start order alert:", err);
      loopActiveRef.current = false;
      options.onError?.("newOrder", err);
    });
  }, [applyVolume, canPlay, getOrCreateAudio, options]);

  /**
   * Stop the order alert loop immediately.
   * Called when ALL pending orders are acknowledged.
   */
  const stopOrderAlert = useCallback(() => {
    loopActiveRef.current = false;
    const audio = audioRef.current.newOrder;
    if (audio) {
      audio.loop = false;
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  // ── SUCCESS / WARNING: Play once, queue if busy ───────────────────────────

  const playOnce = useCallback(
    (key: "paymentSuccess" | "paymentFailed", settingsKey: "paymentSuccess" | "paymentFailed") => {
      const settings = loadSoundSettings();
      if (!canPlay(settingsKey, settings)) return;

      const audio = getOrCreateAudio(key);
      if (!audio) return;

      applyVolume(audio, settings);

      // If currently playing — queue one more play after it finishes
      if (!audio.paused && audio.currentTime > 0) {
        queueRef.current[key] = Math.min(queueRef.current[key] + 1, 3); // cap queue at 3
        return;
      }

      audio.currentTime = 0;
      audio.loop = false;

      const handleEnd = () => {
        audio.removeEventListener("ended", handleEnd);
        if (queueRef.current[key] > 0) {
          queueRef.current[key]--;
          // Small delay between queued sounds
          setTimeout(() => playOnce(key, settingsKey), 300);
        }
      };
      audio.addEventListener("ended", handleEnd);

      audio.play().catch((err) => {
        console.error(`[SOUND] Failed to play ${key}:`, err);
        audio.removeEventListener("ended", handleEnd);
        options.onError?.(key, err);
      });
    },
    [applyVolume, canPlay, getOrCreateAudio, options]
  );

  const playPaymentSuccess = useCallback(() => {
    playOnce("paymentSuccess", "paymentSuccess");
  }, [playOnce]);

  const playPaymentFailed = useCallback(() => {
    playOnce("paymentFailed", "paymentFailed");
  }, [playOnce]);

  // ── Test sound (settings page preview) ───────────────────────────────────

  const testSound = useCallback(
    (type: "newOrder" | "paymentSuccess" | "paymentFailed") => {
      if (typeof window === "undefined") return;
      const settings = loadSoundSettings();

      const audio = getOrCreateAudio(type);
      if (!audio) return;

      applyVolume(audio, settings);
      audio.loop = false;
      audio.currentTime = 0;
      audio.play().catch((err) => {
        console.error(`[SOUND] Test sound failed for ${type}:`, err);
        options.onError?.(type, err);
      });
    },
    [applyVolume, getOrCreateAudio, options]
  );

  return {
    playOrderAlert,
    stopOrderAlert,
    playPaymentSuccess,
    playPaymentFailed,
    testSound,
    isLooping: () => loopActiveRef.current,
  };
}
