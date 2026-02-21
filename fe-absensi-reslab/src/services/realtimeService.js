import { API_CONFIG } from '../api/config.js';


class RealtimeService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  
  connect() {
    try {
      const sseUrl = `${API_CONFIG.baseURL}/realtime/attendance`;
      
      console.log('Connecting to real-time updates:', sseUrl);
      
      this.eventSource = new EventSource(sseUrl);
      
      this.eventSource.onopen = () => {
        console.log('Real-time connection established');
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleUpdate(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      this.eventSource.onerror = (event) => {
        console.error('SSE connection error:', event);
        this.handleConnectionError();
      };

    } catch (error) {
      console.error('Error establishing SSE connection:', error);
      this.handleConnectionError();
    }
  }

  
  handleConnectionError() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  
  handleUpdate(data) {
    const { type, data: updateData, timestamp } = data;
    
    console.log(`Received update: ${type}`, updateData);

    
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => {
        try {
          callback(updateData, timestamp);
        } catch (error) {
          console.error(`Error in listener for ${type}:`, error);
        }
      });
    }

    
    if (this.listeners.has('all')) {
      this.listeners.get('all').forEach(callback => {
        try {
          callback({ type, data: updateData, timestamp });
        } catch (error) {
          console.error('Error in global listener:', error);
        }
      });
    }
  }

  
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    this.listeners.get(eventType).push(callback);
    
    console.log(`Subscribed to ${eventType} events`);
    
    
    return () => {
      this.unsubscribe(eventType, callback);
    };
  }

  
  unsubscribe(eventType, callback) {
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      
      if (index > -1) {
        callbacks.splice(index, 1);
        console.log(`Unsubscribed from ${eventType} events`);
      }

      
      if (callbacks.length === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.listeners.clear();
    console.log('Real-time connection closed');
  }

  
  isConnected() {
    return this.eventSource && this.eventSource.readyState === EventSource.OPEN;
  }

  
  getConnectionStatus() {
    if (!this.eventSource) return 'disconnected';
    
    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING:
        return 'connecting';
      case EventSource.OPEN:
        return 'connected';
      case EventSource.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }
}


const realtimeService = new RealtimeService();




export default realtimeService;
