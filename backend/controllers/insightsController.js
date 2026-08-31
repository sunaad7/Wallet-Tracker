const { buildInsights } = require('../services/insightsService');
const { get, set } = require('../services/cacheService');

const getInsights = async (req, res) => {
    const cacheKey = `insights:${req.user.id}:current`;
    const cached = await get(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const data = await buildInsights(req.user.id);
    await set(cacheKey, data, 600);
    res.json(data);
};

module.exports = { getInsights };
