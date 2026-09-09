import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiClient, apiError } from "../lib/api.js";

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

const renderGoogleButton = (element, clientId, callback) => {
  const width = Math.max(200, Math.floor(element.getBoundingClientRect().width));

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback,
    auto_select: false,
  });

  window.google.accounts.id.renderButton(element, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "rectangular",
    width,
  });
};

export default function SocialAuth({ onError }) {
  const { socialLogin } = useAuth();
  const [config, setConfig] = useState(null);
  const buttonRef = useRef(null);
  const doneRef = useRef(false);
  const resizeHandlerRef = useRef(null);

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
    let resizeTimer = null;

    loadScript("https://accounts.google.com/gsi/client")
      .then(() => waitFor(() => window.google?.accounts?.id))
      .then(() => {
        if (cancelled || !buttonRef.current) return;

        const callback = (response) => {
          if (doneRef.current) return;
          if (response?.credential) {
            doneRef.current = true;
            socialLogin("google", response.credential).catch((err) => {
              doneRef.current = false;
              if (onError) onError(apiError(err, err.message || "Google sign-in failed"));
            });
          } else {
            if (onError) onError("Google sign-in failed");
          }
        };

        renderGoogleButton(buttonRef.current, config.googleClientId, callback);
        buttonRef.current.dataset.rendered = "true";

        // Re-render the button on real, settled size changes (e.g. rotation or
        // resizing the browser) with a debounce. Re-rendering while the account
        // chooser popup is open destroys the button iframe and closes the popup,
        // so a small transient resize (e.g. scrollbar toggling) is ignored.
        const onResize = () => {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            if (cancelled || !buttonRef.current) return;
            renderGoogleButton(buttonRef.current, config.googleClientId, callback);
          }, 400);
        };
        window.removeEventListener("resize", resizeHandlerRef.current);
        resizeHandlerRef.current = onResize;
        window.addEventListener("resize", onResize);
      })
      .catch((err) => {
        if (cancelled) return;
        if (onError) onError(err.message || "Google sign-in failed");
      });

    return () => {
      cancelled = true;
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", resizeHandlerRef.current);
      resizeHandlerRef.current = null;
    };
  }, [config, socialLogin, onError]);

  useEffect(() => {
    handleCredential();
  }, [handleCredential]);

  const googleConfigured = Boolean(config?.googleClientId);

  return (
    <div className="flex w-full justify-center">
      {googleConfigured && <div ref={buttonRef} className="w-full overflow-hidden" />}
    </div>
  );
}