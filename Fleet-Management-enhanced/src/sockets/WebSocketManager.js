const WebSocket = require('ws');

class WebSocketManager {
  constructor(wss) {
    this.wss = wss;
    this.clients = new Set();

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log('New WebSocket connection. Total clients:', this.clients.size);

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('WebSocket connection closed. Total clients:', this.clients.size);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  broadcastToVehicle(vehicleId, data) {
    // TODO: Implement room-based broadcasting if needed
    this.broadcast({ ...data, vehicle_id: vehicleId });
  }
}

module.exports = WebSocketManager;