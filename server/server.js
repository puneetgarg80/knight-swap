const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3200;

// Enable 'trust proxy' so req.protocol works correctly behind load balancers
app.enable('trust proxy');

// Enable Basic CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Middleware for parsing logs and images
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb', type: 'text/*' }));

// Logs directory setup
const LOGS_DIR = process.env.LOGS_DIR || path.join(__dirname, 'logs');
if (!fs.existsSync(LOGS_DIR)) {
    try {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
    } catch (err) {
        console.error(`Failed to create logs directory at ${LOGS_DIR}:`, err);
    }
}
console.log(`Diagnostics logs will be stored in: ${LOGS_DIR}`);

// Certificates directory setup
const CERT_DIR = path.join(__dirname, 'public', 'certificates');
if (!fs.existsSync(CERT_DIR)) {
    try {
        fs.mkdirSync(CERT_DIR, { recursive: true });
    } catch (err) {
        console.error(`Failed to create certificates directory at ${CERT_DIR}:`, err);
    }
}

const INDEX_DIR = path.join(__dirname, '..', 'client', 'dist');
const INDEX_PATH = path.join(INDEX_DIR, 'index.html');

// Serve static files
// Serve the project root so App.tsx and other root files are accessible if needed
app.use(express.static(INDEX_DIR, { index: false }));
// Serve public directory for certificates
app.use(express.static(path.join(__dirname, 'public')));

// --- API: Diagnostics ---
app.post('/api/diagnostics', (req, res) => {
    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { return res.status(400).send('Invalid JSON'); }
        }

        const { sessionId, userName, events, timestamp } = body;
        if (!sessionId) return res.status(400).send('Missing sessionId');

        const safeSessionId = sessionId.replace(/[^a-zA-Z0-9-]/g, '');
        const filePath = path.join(LOGS_DIR, `${safeSessionId}.json`);

        const logData = {
            sessionId,
            userName: userName || null,
            lastUpdated: new Date().toISOString(),
            clientTimestamp: timestamp,
            events: events || []
        };

        fs.writeFileSync(filePath, JSON.stringify(logData, null, 2));
        res.status(200).send('OK');
    } catch (err) {
        console.error('Error saving diagnostics:', err);
        res.status(500).send('Server Error');
    }
});

// --- API: Upload Certificate ---
app.post('/api/upload-certificate', (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).send('Missing image data');

        // Remove header (data:image/png;base64,)
        const base64Data = image.replace(/^data:image\/png;base64,/, "");
        const certId = crypto.randomUUID();
        const filePath = path.join(CERT_DIR, `${certId}.png`);

        fs.writeFileSync(filePath, base64Data, 'base64');

        console.log(`Certificate saved: ${certId}`);
        res.json({ certId });
    } catch (err) {
        console.error('Error saving certificate:', err);
        res.status(500).send('Server Error');
    }
});

// --- Catch-All for Index + Meta Tags ---
app.get('*', (req, res) => {
    fs.readFile(INDEX_PATH, 'utf8', (err, htmlData) => {
        if (err) {
            console.error('Error reading index.html:', err);
            return res.status(500).send('Server Error');
        }

        const { challenger, score, moves, certId } = req.query;
        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;

        let title = 'Knight Swap Challenge';
        let description = 'Can you solve the puzzle? Swap the knights and beat my score!';
        // Default OG image (you might want to add a default one in public/)
        let imageUrl = `${baseUrl}/vite.svg`;

        if (challenger && score) {
            title = `Challenge from ${challenger}!`;
            description = `${challenger} solved the puzzle with ${score}/100 points in ${moves} moves.`;

            if (certId) {
                // Use the uploaded certificate
                imageUrl = `${baseUrl}/certificates/${certId}.png`;
            }
        }

        htmlData = htmlData
            .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${title}" />`)
            .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${description}" />`)
            .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${imageUrl}" />`);

        res.send(htmlData);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
