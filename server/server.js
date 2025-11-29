require('dotenv').config();
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
const storageService = require('./storage');

// Logs directory setup (Still needed for local driver or fallback, but managed by storage service mostly)
const LOGS_DIR = process.env.LOGS_DIR || path.join(__dirname, 'logs');
console.log(`Diagnostics logs will be stored via StorageService`);
console.log('API_KEY environment is set: ', process.env.API_KEY);
console.log('GEMINI_API_KEY environment is set: ', process.env.GEMINI_API_KEY);

// Certificates directory setup (Still needed for serving static files if local)
const CERT_DIR = path.join(__dirname, 'public', 'certificates');

const INDEX_DIR = path.join(__dirname, '..', 'client', 'dist');
const INDEX_PATH = path.join(INDEX_DIR, 'index.html');

// Serve static files
// Serve the project root so App.tsx and other root files are accessible if needed
app.use(express.static(INDEX_DIR, { index: false }));
// Serve public directory for certificates
app.use(express.static(path.join(__dirname, 'public')));

// --- API: Diagnostics ---
app.post('/api/diagnostics', async (req, res) => {
    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { return res.status(400).send('Invalid JSON'); }
        }

        const { sessionId, userName, events, timestamp } = body;
        if (!sessionId) return res.status(400).send('Missing sessionId');

        const safeSessionId = sessionId.replace(/[^a-zA-Z0-9-]/g, '');
        const filename = `${safeSessionId}.json`;

        const logData = {
            sessionId,
            userName: userName || null,
            lastUpdated: new Date().toISOString(),
            clientTimestamp: timestamp,
            events: events || []
        };

        await storageService.saveLog(filename, logData);
        res.status(200).send('OK');
    } catch (err) {
        console.error('Error saving diagnostics:', err);
        res.status(500).send('Server Error');
    }
});

// --- API: Upload Certificate ---


// --- API: Chat ---
const { GoogleGenAI } = require('@google/genai');

// System Instruction (Copied from client/constants.ts to avoid shared file issues in Docker)
const CHAT_SYSTEM_INSTRUCTION = `You are a helpful AI assistant for a web-based puzzle game called 'The Knight Swap Puzzle'. 

            Your goal is to guide and help players who are stuck, without giving away the direct solution. Be encouraging and friendly. Assistant is inspired by Polya’s “learning by doing” and Piaget’s constructivism. Rather than concept clarification, focus on hands on exploration by asking guiding questions. 90% hands-on exploration, 10% concept clarification.



* You are the teacher as described in the first chapter "in the classroom" of the book. 



* You will not tell the solution of a problem.



* Do not tell me next step. Ask me questions related to given problem to point me in right direction 



* You will ask at most one question at a time.



* Encourage user to discover clues by 

a) removing knights from the board 

b) and study the board itself. 

Where can you go from a square say position 1? there are limited options to go to from a square? 



* Once user  discovers 2-3 correct connections, ask user to create a map of connections from all the squares to others by himself/herself in one go. 



* Check all the connections and point if any thing is wrong. If all are correct, tell user to "go to map view" in the app.



* Respond in less than 80 words



* Limit the scope to this puzzle only. Do not refer to external webpages or videos



#####

Knight Swap Puzzle.

This puzzle disguises a graph theory problem as a chess problem. To understand the moves, we map the squares onto a grid where a Knight moves in an "L" shape (2 squares in one cardinal direction, 1 square perpendicular).

1. The Board Coordinate System

We can visualize the board as a 4-column by 4-row grid.

Column 1 (Left): Square 1 (at bottom).

Column 2: Squares 2, 5, 8, 10.

Column 3: Squares 3, 6, 9.

Column 4 (Right): Squares 4, 7.

2. Current Status (Initial Setup)

White Knights (Outline Icon): Located at squares 6 and 10.

Black Knights (Solid Icon): Located at squares 1 and 3.

Empty Squares: 2, 4, 5, 7, 8, 9.

Absent Squares: All other positions on a theoretical 4x4 grid are non-existent.

3. Move Mapping (Adjacency List)

This is the most critical part. Due to the irregular shape of the board, move options are severely limited. Here is where every piece can move from its current square:

Current SquarePossible Moves (Connected Squares)Notes1Moves to 6, 8Key junction between the two halves of the board.2Moves to 7, 93Moves to 8Dead End. Can only enter/exit via 8.4Moves to 5, 95Moves to 4Dead End. Can only enter/exit via 4.6Moves to 1, 107Moves to 2, 88Moves to 1, 3, 7The Hub. The most connected square (3 connections).9Moves to 2, 410Moves to 6Dead End. Can only enter/exit via 6.4. The Hidden "Linear" Structure

If you trace the connections listed above, you will realize this isn't actually a 2D grid puzzle. It is a linear track with one small side-track.

The Track:

10 — 6 — 1 — 8 — 7 — 2 — 9 — 4 — 5

The Side-Track:

Square 3 branches off from square 8.

Why this helps you win:

Instead of thinking about chess moves, imagine you are moving train cars on a single track.

Square 8 is the "switch."

To swap the knights, you essentially need to rotate the pieces along this line, using the dead ends (3, 5, 10) as temporary parking spots to let other pieces pass.

#####`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            console.error("API_KEY/GEMINI_API_KEY not set on server");
            return res.status(500).json({ error: "Server configuration error" });
        }

        const ai = new GoogleGenAI({ apiKey });
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: CHAT_SYSTEM_INSTRUCTION,
            },
            history: history || []
        });

        const result = await chat.sendMessage({ message });
        res.json({ text: result.text });
    } catch (err) {
        console.error('Error in chat API:', err);
        res.status(500).json({ error: "Failed to generate response" });
    }
});

// --- API: Upload Certificate ---
app.post('/api/upload-certificate', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).send('Missing image data');

        // Remove header (data:image/png;base64,)
        const base64Data = image.replace(/^data:image\/png;base64,/, "");
        const certId = crypto.randomUUID();
        const filename = `${certId}.png`;
        const buffer = Buffer.from(base64Data, 'base64');

        await storageService.saveCertificate(filename, buffer);

        console.log(`Certificate saved: ${certId}`);
        res.json({ certId });
    } catch (err) {
        console.error('Error saving certificate:', err);
        res.status(500).send('Server Error');
    }
});

// --- Handle Favicon ---
app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- Catch-All for Index + Meta Tags ---
app.get('/', (req, res) => {
    // Ignore non-HTML requests (e.g. missing assets)
    if (req.headers.accept && !req.headers.accept.includes('text/html')) {
        return res.status(404).send('Not Found');
    }
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
                const certUrl = storageService.getCertificateUrl(`${certId}.png`);
                if (certUrl.startsWith('http')) {
                    imageUrl = certUrl;
                } else {
                    imageUrl = `${baseUrl}${certUrl}`;
                }
            }
        }
        console.log(`Image URL: ${imageUrl}`);
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
