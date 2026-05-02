const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const WebSocket = require('ws');
const WebSocketManager = require('./sockets/WebSocketManager');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, '../public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Fleet Management API is running' });
});

// Mount routes
app.use('/api', require('./routes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Create HTTP server
const server = createServer(app);

// WebSocket server
const wss = new WebSocket.Server({ server });
const wsManager = new WebSocketManager(wss);

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  ws.on('message', (message) => {
    console.log('Received:', message);
  });
});

module.exports = { app, server, wsManager };