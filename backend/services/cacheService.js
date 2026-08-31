const { createClient } = require('redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let client = null;
let ready = false;
let disabled = false;
let connecting = null;
let warned = false;

const getClient = async () => {
    if (ready) return client;
    if (disabled) return null;

    if (!client) {
        client = createClient({
            url: REDIS_URL,
            socket: { reconnectStrategy: () => false }
        });
        client.on('error', () => {});
        client.on('ready', () => { ready = true; });
    }

    if (!connecting) {
        connecting = client.connect()
            .then(() => { ready = true; })
            .catch(() => {
                disabled = true;
                if (!warned) {
                    warned = true;
                    console.warn('[redis] unavailable, caching disabled:', REDIS_URL);
                }
            })
            .finally(() => { connecting = null; });
    }

    await connecting;
    return ready ? client : null;
};

const isEnabled = () => process.env.REDIS_ENABLED !== 'false';

const get = async (key) => {
    if (!isEnabled()) return null;
    const c = await getClient();
    if (!c) return null;
    try {
        const value = await c.get(key);
        return value ? JSON.parse(value) : null;
    } catch (err) {
        return null;
    }
};

const set = async (key, value, ttlSeconds = 300) => {
    if (!isEnabled()) return;
    const c = await getClient();
    if (!c) return;
    try {
        await c.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (err) {
        // caching is best-effort
    }
};

const del = async (key) => {
    if (!isEnabled()) return;
    const c = await getClient();
    if (!c) return;
    try {
        await c.del(key);
    } catch (err) {
        // ignore
    }
};

const delPattern = async (pattern) => {
    if (!isEnabled()) return;
    const c = await getClient();
    if (!c) return;
    try {
        let cursor = '0';
        do {
            const reply = await c.scan(cursor, { MATCH: pattern, COUNT: 100 });
            cursor = reply.cursor;
            if (reply.keys.length) await c.del(reply.keys);
        } while (cursor !== '0');
    } catch (err) {
        // ignore
    }
};

module.exports = { get, set, del, delPattern, isEnabled };
