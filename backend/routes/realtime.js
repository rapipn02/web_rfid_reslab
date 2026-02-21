const express = require('express');
const router = express.Router();


const sseConnections = new Map();


router.get('/attendance', (req, res) => {
    
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    
    const connectionId = Date.now() + Math.random();
    
    
    sseConnections.set(connectionId, res);
    
    console.log(`New SSE client connected. Total clients: ${sseConnections.size}`);

    
    res.write(`data: ${JSON.stringify({
        type: 'connection',
        message: 'Connected to real-time attendance stream',
        timestamp: new Date().toISOString()
    })}\n\n`);

    
    const keepAlive = setInterval(() => {
        if (sseConnections.has(connectionId)) {
            res.write(`data: ${JSON.stringify({
                type: 'ping',
                timestamp: new Date().toISOString()
            })}\n\n`);
        } else {
            clearInterval(keepAlive);
        }
    }, 30000);

    
    req.on('close', () => {
        sseConnections.delete(connectionId);
        clearInterval(keepAlive);
        console.log(`SSE client disconnected. Total clients: ${sseConnections.size}`);
    });

    req.on('error', () => {
        sseConnections.delete(connectionId);
        clearInterval(keepAlive);
    });
});


function broadcastUpdate(type, data) {
    const message = JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString()
    });

    let disconnectedClients = [];

    sseConnections.forEach((res, connectionId) => {
        try {
            res.write(`data: ${message}\n\n`);
        } catch (error) {
            disconnectedClients.push(connectionId);
        }
    });

    
    disconnectedClients.forEach(id => {
        sseConnections.delete(id);
    });

    console.log(`Broadcasted ${type} to ${sseConnections.size} clients`);
}


global.realtimeService = {
    broadcastUpdate
};

module.exports = router;
