
const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
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

// Middleware for parsing logs
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

const INDEX_DIR = path.join(__dirname, '..', 'client', 'dist');
const INDEX_PATH = path.join(INDEX_DIR, 'index.html');
// Serve the project root so App.tsx and other root files are accessible if needed
app.use(express.static(INDEX_DIR, { index: false }));

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

// --- API: OG Image (Puppeteer) ---
app.get('/api/og-image', async (req, res) => {
    const { name, score, moves } = req.query;
    const userName = name || 'Player';
    const userScore = score || '0';
    const userMoves = moves || '0';

    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            headless: 'new'
        });
        const page = await browser.newPage();

        // Set viewport to Facebook/Twitter recommendation (1200x630)
        await page.setViewport({ width: 1200, height: 630 });

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; }
            </style>
        </head>
        <body class="bg-gray-900 flex items-center justify-center h-screen w-screen overflow-hidden m-0 p-0">
            
            <!-- Background Glow -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="w-[800px] h-[800px] bg-cyan-500/20 rounded-full blur-[100px]"></div>
            </div>

            <!-- Card -->
            <div class="bg-white rounded-3xl shadow-2xl text-center relative overflow-hidden w-[900px] h-[520px] flex flex-col items-center">
                <!-- Top Bar -->
                <div class="absolute top-0 left-0 w-full h-4 bg-cyan-500"></div>

                <div class="mt-12">
                    <h1 class="text-6xl font-black text-gray-900 leading-none mb-4">KNIGHT SWAP</h1>
                    <div class="w-20 h-2 bg-amber-400 mx-auto rounded-full mb-6"></div>
                    <p class="text-xl font-bold text-gray-400 uppercase tracking-[0.2em]">Challenger</p>
                </div>

                <div class="mt-6 mb-8">
                    <p class="text-7xl font-bold text-gray-800 tracking-tight">${userName}</p>
                </div>

                <div class="flex items-center justify-center gap-16 mt-4">
                    <div class="text-center">
                        <span class="block text-7xl font-black text-gray-800 leading-none">
                            ${userMoves}<span class="text-3xl text-gray-400 font-bold">/40</span>
                        </span>
                        <span class="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2 block">Moves</span>
                    </div>
                    
                    <div class="w-px h-20 bg-gray-200"></div>
                    
                    <div class="text-center">
                        <span class="block text-7xl font-black text-amber-500 leading-none">
                            ${userScore}<span class="text-3xl text-gray-400 font-bold">/100</span>
                        </span>
                        <span class="text-sm font-bold text-amber-500/80 uppercase tracking-widest mt-2 block">Score</span>
                    </div>
                </div>

                <div class="absolute bottom-8 text-gray-500 text-lg font-medium italic">
                    Can you beat this score?
                </div>
            </div>
        </body>
        </html>
        `;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const screenshotBuffer = await page.screenshot({ type: 'png' });

        await browser.close();

        res.set('Content-Type', 'image/png');
        // Cache for 1 hour to reduce server load
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(screenshotBuffer);

    } catch (err) {
        console.error('Error generating image:', err);
        res.status(500).send('Error generating image');
    }
});

// --- Catch-All for Index + Meta Tags ---
app.get('*', (req, res) => {
    fs.readFile(INDEX_PATH, 'utf8', (err, htmlData) => {
        if (err) {
            console.error('Error reading index.html:', err);
            return res.status(500).send('Server Error');
        }

        const { challenger, score, moves } = req.query;
        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;

        let title = 'Knight Swap Challenge';
        let description = 'Can you solve the puzzle? Swap the knights and beat my score!';
        let imageUrl = `${baseUrl}/api/og-image`;

        if (challenger && score) {
            title = `Challenge from ${challenger}!`;
            description = `${challenger} solved the puzzle with ${score}/100 points in ${moves} moves.`;
            imageUrl = `${baseUrl}/api/og-image?name=${encodeURIComponent(challenger)}&score=${score}&moves=${moves}`;
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
