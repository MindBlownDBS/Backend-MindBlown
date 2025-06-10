const { v4: uuidv4 } = require('uuid');
const chatHistory = require('../models/chatHistory');

// Store active WebSocket connections
const activeConnections = new Map();

// Track last request time per user to prevent rapid requests
const lastRequestTimes = new Map();

const initializeChatbotWebSocket = (server) => {
    const WebSocket = require('ws');
    const wss = new WebSocket.Server({ 
        server,
        path: '/chatbot-ws'
    });
    
    wss.on('connection', (ws, request) => {
        console.log('New chatbot WebSocket connection');
        
        // Generate connection ID
        const connectionId = uuidv4();
        activeConnections.set(connectionId, ws);
        
        // Generate anonymous user ID by default
        ws.userId = `anonymous_${uuidv4()}`;
        ws.isAnonymous = true;
        
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                
                if (data.type === 'chatbot_request') {
                    await handleChatbotRequest(ws, data, connectionId);
                } else if (data.type === 'auth') {
                    // Store user authentication info with connection
                    if (data.userId) {
                        ws.userId = data.userId;
                        ws.isAnonymous = false;
                        ws.send(JSON.stringify({
                            type: 'auth_success',
                            message: 'Authentication successful'
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type: 'auth_anonymous',
                            message: 'Using anonymous session',
                            anonymousId: ws.userId
                        }));
                    }
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid request format'
                }));
            }
        });
        
        ws.on('close', () => {
            console.log('Chatbot WebSocket connection closed');
            activeConnections.delete(connectionId);
            if (ws.userId) {
                lastRequestTimes.delete(ws.userId);
            }
        });
        
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            activeConnections.delete(connectionId);
            if (ws.userId) {
                lastRequestTimes.delete(ws.userId);
            }
        });
        
        // Send welcome message
        ws.send(JSON.stringify({
            type: 'connected',
            message: 'Connected to MindBlown chatbot',
            connectionId,
            anonymousId: ws.userId,
            isAnonymous: ws.isAnonymous
        }));
    });
    
    return wss;
};

const handleChatbotRequest = async (ws, data, connectionId) => {
    const { message, requestId } = data;
    let userId = ws.userId;
    
    // Generate anonymous user ID if not authenticated
    if (!userId) {
        userId = `anonymous_${uuidv4()}`;
        ws.userId = userId; // Store for this session
        console.log('Generated anonymous user ID:', userId);
    }
    
    if (!message || !message.trim()) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Message cannot be empty',
            requestId
        }));
        return;
    }
    
    // Check for rapid requests - enforce minimum 10 second gap
    const lastRequestTime = lastRequestTimes.get(userId) || 0;
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const minInterval = 10000; // 10 seconds
    
    if (timeSinceLastRequest < minInterval) {
        const waitTime = Math.ceil((minInterval - timeSinceLastRequest) / 1000);
        ws.send(JSON.stringify({
            type: 'error',
            message: `Mohon tunggu ${waitTime} detik sebelum mengirim pesan lagi`,
            requestId
        }));
        return;
    }
    
    // Update last request time
    lastRequestTimes.set(userId, now);
    
    try {
        // Send immediate acknowledgment
        ws.send(JSON.stringify({
            type: 'chatbot_processing',
            message: 'MindBlown sedang memproses pesan Anda...',
            requestId,
            estimatedTime: '3-5 menit',
            isAnonymous: userId.startsWith('anonymous_')
        }));
        
        // Call the chatbot API using fetch
        console.log('Calling chatbot API for user:', userId);
        const startTime = Date.now();
        
        // Create AbortController for timeout (reduced to 5 minutes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('Request timeout after 5 minutes');
            controller.abort();
        }, 300000); // 5 minutes instead of 6
        
        // Add a small random delay to prevent simultaneous requests
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
        
        const response = await fetch('https://Cocolele-MindBlown-Chatbot.hf.space/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Connection': 'close', // Force new connection
                'User-Agent': `MindBlown-WebSocket/${Date.now()}`, // Unique identifier
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({
                user_id: userId,
                message: message.trim()
            }),
            signal: controller.signal,
            // Add timeout options for undici
            timeout: 300000, // 5 minutes
            headersTimeout: 60000, // 1 minute for headers
            bodyTimeout: 300000 // 5 minutes for body
        });
        
        clearTimeout(timeoutId);
        console.log('Response received, status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }
        
        const responseData = await response.json();
        
        const endTime = Date.now();
        const processingTime = Math.round((endTime - startTime) / 1000);
        
        console.log(`Chatbot API responded in ${processingTime} seconds`);
        
        // Send the response back through WebSocket
        ws.send(JSON.stringify({
            type: 'chatbot_response',
            data: {
                message: message.trim(),
                response: responseData.response,
                processingTime: `${processingTime} detik`,
                timestamp: new Date().toISOString()
            },
            requestId
        }));
        
    } catch (error) {
        console.error('Chatbot API error:', error);
        
        let errorMessage = 'Terjadi kesalahan saat memproses pesan Anda';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timeout - Chatbot membutuhkan waktu terlalu lama';
        } else if (error.code === 'UND_ERR_HEADERS_TIMEOUT') {
            errorMessage = 'Chatbot service sedang sibuk, coba lagi dalam beberapa menit';
        } else if (error.code === 'UND_ERR_BODY_TIMEOUT') {
            errorMessage = 'Response timeout - Chatbot membutuhkan waktu terlalu lama';
        } else if (error.message.includes('HTTP error')) {
            errorMessage = `Chatbot API error: ${error.message}`;
        } else if (error.message.includes('fetch') || error.code?.startsWith('UND_ERR_')) {
            errorMessage = 'Tidak dapat menghubungi chatbot service - coba lagi nanti';
        }
        
        ws.send(JSON.stringify({
            type: 'chatbot_error',
            message: errorMessage,
            requestId,
            retryAfter: 30 // Suggest retry after 30 seconds
        }));
        
        // Reset the last request time on error so user can retry sooner
        lastRequestTimes.delete(userId);
    }
};

const getChatHistoryHandler = async (request, h) => {
    try {
        const userId = request.auth.credentials.id;
        
        if (!request.auth.credentials || !request.auth.credentials.id) {
            return h.response({
                error: true,
                message: 'Unauthorized - Authentication required'
            }).code(401);
        }

        let chats = await chatHistory.find({ user_id: userId })
            .sort({ timestamp: -1 })
            .lean();
        
        if (!chats || chats.length === 0) {
            return h.response({
                error: false,
                message: 'No chat history found',
                data: {
                    chats: [],
                    total: 0
                }
            }).code(200);
        }

        const formattedChats = chats.map(chat => ({
            _id: chat._id,
            message: chat.message,
            response: chat.response,
            timestamp: chat.timestamp,
            createdAt: chat.timestamp
        }));

        const chatHistoryData = {
            chats: formattedChats,
            total: formattedChats.length
        };

        return h.response({
            error: false,
            message: 'Chat history retrieved successfully',
            data: chatHistoryData
        }).code(200);
        
    } catch (error) {
        console.error('Error getChatHistoryHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const testChatBotHandler = async (request, h) => {
    try {        
        const payload = request.payload;
        const message = payload?.message;
        const payloadUserId = payload?.user_id;
        const userId = request.auth.credentials.id;
                
        let parsedData = payload;
        if (typeof payload === 'string') {
            try {
                parsedData = JSON.parse(payload);
                console.log('Parsed payload:', parsedData);
            } catch (e) {
                console.log('Failed to parse payload as JSON:', e);
            }
        }
        
        const finalMessage = parsedData?.message || message;
        const finalUserId = parsedData?.user_id || payloadUserId || userId;
        
        console.log('Final message:', finalMessage);
        console.log('Final user ID:', finalUserId);
        
        if (!finalMessage) {
            return h.response({
                error: true,
                message: 'Message is required',
                debug: {
                    payloadType: typeof request.payload,
                    payload: request.payload,
                    parsedData: parsedData
                }
            }).code(400);
        }
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 360000); // 6 minutes
        
        const response = await fetch('https://Cocolele-MindBlown-Chatbot.hf.space/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: finalUserId,
                message: finalMessage
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        return h.response({
            error: false,
            message: 'Chatbot response received',
            data: responseData
        }).code(200);
        
    } catch (error) {
        console.error('Error testChatBotHandler:', error);
        
        let errorMessage = 'Failed to get chatbot response';
        if (error.name === 'AbortError') {
            errorMessage = 'Request timeout';
        }
        
        return h.response({
            error: true,
            message: errorMessage
        }).code(500);
    }
};

module.exports = {
    initializeChatbotWebSocket,
    getChatHistoryHandler,
    testChatBotHandler
};