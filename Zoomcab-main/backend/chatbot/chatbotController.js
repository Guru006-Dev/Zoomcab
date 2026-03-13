require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `
You are the Zoomcab Travel Concierge. You are a friendly, easy-to-understand trip planner.

Tone and Language: 
- Speak in very simple, plain English. Do not use fancy or complicated words.
- Explain things as if you are talking to a friend over coffee.
- Be super clear and direct.

Formatting Rules:
- Keep your answers easy to read. Use short bullet points and spaced-out paragraphs.
- If the user asks about a place, ALWAYS try to include a beautiful photo of it using Markdown image syntax: ![Description of place](https://source.unsplash.com/800x600/?place_name)
- For example: ![Kerala Beach](https://source.unsplash.com/800x600/?kerala+beach)

Business Rules:
1. Always remind them they can easily book a Zoomcab (Auto, Mini, Sedan, or SUV) for their local travel needs.
2. If they need a hotel, just give them 1 or 2 highly-rated, safe options.
3. If they need to talk to locals, teach them one or two simple words in the local language (like Tamil or Malayalam).
`;

// Helper map to store chat sessions (for simplicity in this proof-of-concept, we'll store them in memory keyed by a sessionId)
const chatSessions = new Map();

async function handleChat(req, res) {
    try {
        const { message, sessionId, initContext } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is not set on the server.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-flash-latest',
            systemInstruction: SYSTEM_PROMPT
        });

        let session;
        if (!chatSessions.has(sessionId)) {
            session = model.startChat({
                history: [],
                generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
            });
            chatSessions.set(sessionId, session);

            // Optional quiet context injection for initialized sessions
            if (initContext) {
                await session.sendMessage(`[INTERNAL SYSTEM EVENT: Introduce yourself. Focus: ${initContext}]`);
            }
        } else {
            session = chatSessions.get(sessionId);
        }

        const result = await session.sendMessage(message);
        const responseText = result.response.text();

        res.json({ text: responseText });

    } catch (error) {
        console.error('Error in chatbot controller:', error);
        res.status(500).json({ error: 'Failed to process chat message', details: error.message });
    }
}

module.exports = {
    handleChat
};
