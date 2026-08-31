const fs = require('fs');
const path = require('path');
const connectDB = require('../backend/config/db');
const app = require('../backend/app');

const DIST_DIR = path.join(__dirname, '..', 'frontend', 'dist');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');

let connected = false;

module.exports = async (req, res) => {
    if (!connected) {
        try {
            await connectDB();
            connected = true;
        } catch (err) {
            res.status(500).json({ message: 'Database connection failed', error: err.message });
            return;
        }
    }

    if (req.url.startsWith('/api')) {
        return app(req, res);
    }

    const pathname = req.url.split('?')[0];

    if (pathname !== '/') {
        const filePath = path.join(DIST_DIR, pathname);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type', mimeFor(filePath));
            fs.createReadStream(filePath).pipe(res);
            return;
        }
    }

    res.setHeader('Content-Type', 'text/html');
    res.end(fs.readFileSync(INDEX_HTML));
};

const mimeFor = (file) => {
    const ext = path.extname(file);
    const map = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff2': 'font/woff2',
    };
    return map[ext] || 'application/octet-stream';
};
