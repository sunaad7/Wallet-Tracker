const jwt = require("jsonwebtoken");

const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISS = [
    "accounts.google.com",
    "https://accounts.google.com"
];

let cachedKeys = null;
let keysFetchedAt = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours, matching Google's rotation

const fetchKeys = async () => {
    if (cachedKeys && Date.now() - keysFetchedAt < CACHE_TTL_MS) return cachedKeys;
    const response = await fetch(GOOGLE_JWKS_URL);
    if (!response.ok) throw new Error("Failed to fetch Google signing keys");
    const { keys } = await response.json();
    if (!Array.isArray(keys) || keys.length === 0) throw new Error("No Google signing keys");
    cachedKeys = keys;
    keysFetchedAt = Date.now();
    return keys;
};

const verifyGoogleIdToken = async (idToken) => {
    if (!idToken) throw new Error("Missing Google ID token");

    const header = jwt.decode(idToken, { complete: true })?.header;
    if (!header || !header.kid) throw new Error("Invalid Google token");

    const keys = await fetchKeys();
    const key = keys.find((k) => k.kid === header.kid);
    if (!key) throw new Error("Invalid Google token");

    let payload;
    try {
        payload = jwt.verify(idToken, key, {
            issuer: GOOGLE_ISS,
            algorithms: ["RS256"],
        });
    } catch {
        throw new Error("Invalid Google token");
    }

    const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
    if (payload.aud !== clientId) {
        throw new Error("Invalid Google token");
    }

    return {
        email: payload.email,
        name: payload.name,
        providerId: payload.sub
    };
};

module.exports = {
    verifyGoogleIdToken
};