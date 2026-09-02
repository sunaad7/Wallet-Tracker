import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiClient } from "../lib/api.js";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load script")));
      if (existing.dataset.loaded) return resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.loaded = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

const waitFor = (fn, timeout = 8000) =>
  new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (fn()) return resolve();
      if (Date.now() - start > timeout) return reject(new Error("Timed out waiting for provider SDK"));
      setTimeout(tick, 100);
    };
    tick();
  });

export default function SocialAuth({ onError }) {
  const { socialLogin } = useAuth();
  const [config, setConfig] = useState(null);
  const buttonRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    let active = true;
    apiClient.auth.oauthConfig()
      .then((cfg) => { if (active) setConfig(cfg); })
      .catch(() => { if (active) setConfig({ googleClientId: "" }); });
    return () => { active = false; };
  }, []);

  const handleCredential = useCallback(() => {
    if (!config?.googleClientId || !buttonRef.current || buttonRef.current.dataset.rendered) {
      return;
    }

    let cancelled = false;
    loadScript("https://accounts.google.com/gsi/client")
      .then(() => waitFor(() => window.google?.accounts?.id))
      .then(() => {
        if (cancelled) return;
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: (response) => {
            if (doneRef.current) return;
            if (response?.credential) {
              doneRef.current = true;
              socialLogin("google", response.credential).catch((err) => {
                doneRef.current = false;
                if (onError) onError(err.message || "Google sign-in failed");
              });
            } else {
              if (onError) onError("Google sign-in failed");
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 320,
        });
        buttonRef.current.dataset.rendered = "true";
      })
      .catch((err) => {
        if (cancelled) return;
        if (onError) onError(err.message || "Google sign-in failed");
      });

    return () => { cancelled = true; };
  }, [config, socialLogin, onError]);

  useEffect(() => {
    handleCredential();
  }, [handleCredential]);

  const googleConfigured = Boolean(config?.googleClientId);

  return (
    <div className="space-y-3">
      {googleConfigured && <div ref={buttonRef} className="w-full overflow-hidden" />}
    </div>
  );
}