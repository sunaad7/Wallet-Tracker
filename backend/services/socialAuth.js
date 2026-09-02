const https = require("https");

const getJson = (url) =>
    new Promise((resolve, reject) => {
        https
            .get(url, (res) => {
                let body = "";
                res.on("data", (chunk) => (body += chunk));
                res.on("end", () => {
                    try {
                        resolve(JSON.parse(body));
                    } catch (err) {
                        reject(new Error("Invalid JSON from provider"));
                    }
                });
            })
            .on("error", reject);
    });

const verifyGoogleIdToken = async (idToken) => {
    if (!idToken) throw new Error("Missing Google ID token");
    const payload = await getJson(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!payload || payload.aud !== process.env.GOOGLE_CLIENT_ID) {
        throw new Error("Invalid Google token");
    }
    return {
        email: payload.email,
        name: payload.name,
        providerId: payload.sub
    };
};

const verifyFacebookToken = async (accessToken) => {
    if (!accessToken) throw new Error("Missing Facebook access token");
    const payload = await getJson(
        `https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`
    );
    if (!payload || !payload.id) {
        throw new Error("Invalid Facebook token");
    }
    return {
        email: payload.email,
        name: payload.name,
        providerId: JSON.stringify(payload.id)
    };
};

module.exports = {
    verifyGoogleIdToken,
    verifyFacebookToken
};