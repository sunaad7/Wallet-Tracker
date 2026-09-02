import { useEffect, useState } from "react";
import { Button } from "./ui/Form.jsx";
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
  const [loading, setLoading] = useState(null);
  const [config, setConfig] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    apiClient.auth.oauthConfig()
      .then((cfg) => { if (active) setConfig(cfg); })
      .catch(() => { if (active) setConfig({ googleClientId: "", facebookAppId: "" }); });
    return () => { active = false; };
  }, []);

  const handleGoogle = async () => {
    setLoading("google");
    setBusy(true);
    try {
      if (!window.google?.accounts) {
        await loadScript("https://accounts.google.com/gsi/client");
        await waitFor(() => window.google?.accounts?.id);
      }
      const clientId = config?.googleClientId;
      if (!clientId) throw new Error("Google sign-in is not configured");

      const credential = await new Promise((resolve, reject) => {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) resolve(response.credential);
            else reject(new Error("Google sign-in failed"));
          },
          auto_select: false,
        });
        window.google.accounts.id.renderButton(
          document.createElement("div"),
          { type: "icon", shape: "circle" }
        );
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            reject(new Error("Google sign-in was cancelled or could not be displayed"));
          }
        });
        setTimeout(() => reject(new Error("Google sign-in timed out")), 30000);
      });

      await socialLogin("google", credential);
    } catch (err) {
      if (onError) onError(err.message || "Google sign-in failed");
    } finally {
      setLoading(null);
      setBusy(false);
    }
  };

  const handleFacebook = async () => {
    setLoading("facebook");
    setBusy(true);
    try {
      const appId = config?.facebookAppId;
      if (!appId) throw new Error("Facebook login is not configured");

      if (!window.FB) {
        await loadScript("https://connect.facebook.net/en_US/sdk.js");
        await waitFor(() => window.FB?.init);
      }
      window.FB.init({ appId, cookie: false, xfbml: false, version: "v19.0" });

      const accessToken = await new Promise((resolve, reject) => {
        window.FB.getLoginStatus((response) => {
          if (response.status === "connected") return resolve(response.authResponse.accessToken);
          window.FB.login(
            (res) => {
              if (res.status === "connected" && res.authResponse) resolve(res.authResponse.accessToken);
              else reject(new Error("Facebook login was cancelled"));
            },
            { scope: "email", return_scopes: true }
          );
        });
      });

      await socialLogin("facebook", accessToken);
    } catch (err) {
      if (onError) onError(err.message || "Facebook login failed");
    } finally {
      setLoading(null);
      setBusy(false);
    }
  };

  const googleConfigured = Boolean(config?.googleClientId);
  const facebookConfigured = Boolean(config?.facebookAppId);

  return (
    <div className="space-y-3">
      {googleConfigured && (
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          disabled={busy}
          loading={loading === "google"}
          onClick={handleGoogle}
        >
          {loading !== "google" && (
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          )}
          Continue with Google
        </Button>
      )}

      {facebookConfigured && (
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          disabled={busy}
          loading={loading === "facebook"}
          onClick={handleFacebook}
        >
          {loading !== "facebook" && (
            <svg width="18" height="18" viewBox="0 0 48 48" fill="#1877F2" aria-hidden="true">
              <path d="M24 1C11.3 1 1 11.3 1 24c0 11.5 8.4 21 19.4 22.7V30.5h-5.8V24h5.8v-5c0-5.7 3.4-8.9 8.6-8.9 2.5 0 5.1.4 5.1.4v5.6h-2.9c-2.8 0-3.7 1.8-3.7 3.6V24h6.3l-1 6.5h-5.3v16.2C38.6 45 47 35.5 47 24 47 11.3 36.7 1 24 1z"/>
            </svg>
          )}
          Continue with Facebook
        </Button>
      )}
    </div>
  );
}