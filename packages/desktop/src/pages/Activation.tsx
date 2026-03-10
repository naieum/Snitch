import { useState, useEffect, useRef } from "react";
import {
  startDevicePairing,
  pollDeviceToken,
  type DeviceCodeInfo,
} from "../lib/tauri";
import { openUrl } from "@tauri-apps/plugin-opener";

interface ActivationProps {
  onPaired: () => void;
}

export function Activation({ onPaired }: ActivationProps) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceCodeInfo | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const intervalRef = useRef<number | null>(null);

  async function initPairing() {
    setError(null);
    setDeviceInfo(null);
    try {
      const info = await startDevicePairing();
      setDeviceInfo(info);
      setPolling(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    initPairing();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!polling || !deviceInfo) return;

    intervalRef.current = window.setInterval(async () => {
      try {
        const paired = await pollDeviceToken();
        if (paired) {
          setPolling(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          onPaired();
        }
      } catch (e: unknown) {
        setPolling(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        setError(e instanceof Error ? e.message : String(e));
      }
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [polling, deviceInfo, onPaired]);

  return (
    <div
      className="flex h-screen items-center justify-center"
      style={{ backgroundColor: "var(--bg-base)", position: "relative" }}
    >
      <div
        data-tauri-drag-region
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "40px",
        }}
      />
      <div
        className="surface rounded-lg p-8 max-w-md w-full mx-4"
        style={{ boxShadow: "var(--shadow-lg)" }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <pre
            className="text-xs leading-tight inline-block"
            style={{ color: "var(--text-primary)" }}
          >
            {`  ___ _ __  (_) |_ ___| |__
 / __| '_ \\ | | __/ __| '_ \\
 \\__ \\ | | || | || (__| | | |
 |___/_| |_|/ |\\__\\___|_| |_|
          |__/`}
          </pre>
          <div className="mt-2 badge inline-block px-2 py-0.5 rounded text-xs">
            v1
          </div>
        </div>

        {error ? (
          <div className="text-center">
            <div
              className="p-3 rounded-lg mb-4"
              style={{
                backgroundColor: "var(--danger-surface)",
                border: "1px solid var(--danger-border)",
              }}
            >
              <p
                style={{ color: "var(--danger-text)" }}
                className="text-sm"
              >
                {error}
              </p>
            </div>
            <button
              onClick={initPairing}
              className="btn-primary px-6 py-2 rounded-lg text-sm"
            >
              Try again
            </button>
          </div>
        ) : deviceInfo ? (
          <div className="text-center">
            <p
              className="text-sm mb-4"
              style={{ color: "var(--text-secondary)" }}
            >
              Enter this code at snitch.live/pair
            </p>

            {/* Pairing code */}
            <div
              className="text-3xl font-bold tracking-widest mb-6 py-4 px-6 rounded-lg"
              style={{
                backgroundColor: "var(--bg-raised)",
                color: "var(--text-primary)",
                letterSpacing: "0.15em",
              }}
            >
              {deviceInfo.user_code}
            </div>

            <button
              onClick={() => {
                if (deviceInfo.verification_uri.startsWith("https://")) {
                  openUrl(deviceInfo.verification_uri);
                }
              }}
              className="btn-primary px-6 py-2.5 rounded-lg text-sm w-full mb-4"
            >
              Open snitch.live/pair
            </button>

            {/* Polling indicator */}
            {polling && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <span
                  className="inline-block w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: "var(--info)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Waiting for pairing...
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p style={{ color: "var(--text-secondary)" }}>
              Initializing...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
