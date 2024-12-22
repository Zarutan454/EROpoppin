import { createServer } from 'http';
import { AddressInfo } from 'net';
import { io as Client } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import SocketService from '../socket.service';

describe('SocketService', () => {
  let httpServer: any;
  let socketService: SocketService;
  let clientSocket: any;
  let port: number;

  beforeAll((done) => {
    httpServer = createServer();
    socketService = new SocketService(httpServer);
    httpServer.listen(() => {
      port = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterAll(() => {
    httpServer.close();
  });

  beforeEach((done) => {
    const token = jwt.sign({ id: 'testUser' }, process.env.JWT_SECRET || 'test-secret');
    
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  test('should connect with valid token', (done) => {
    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
  });

  test('should reject connection with invalid token', (done) => {
    const invalidSocket = Client(`http://localhost:${port}`, {
      auth: { token: 'invalid-token' },
      transports: ['websocket'],
    });

    invalidSocket.on('connect_error', (err) => {
      expect(err.message).toBe('Authentication error');
      invalidSocket.disconnect();
      done();
    });
  });

  test('should handle messages between users', (done) => {
    const message = {
      content: 'Test message',
      to: 'recipient',
      from: 'testUser',
      timestamp: Date.now(),
      type: 'text' as const,
    };

    clientSocket.on('message', (receivedMessage: any) => {
      expect(receivedMessage.content).toBe(message.content);
      expect(receivedMessage.from).toBe(message.from);
      done();
    });

    clientSocket.emit('message', message);
  });

  test('should handle typing events', (done) => {
    const typingData = { to: 'recipient' };

    clientSocket.on('typing', (data: any) => {
      expect(data.from).toBe('testUser');
      done();
    });

    clientSocket.emit('typing', typingData);
  });

  test('should broadcast user online status on connection', (done) => {
    const secondToken = jwt.sign({ id: 'testUser2' }, process.env.JWT_SECRET || 'test-secret');
    const secondClient = Client(`http://localhost:${port}`, {
      auth: { token: secondToken },
      transports: ['websocket'],
    });

    clientSocket.on('user_online', (data: any) => {
      expect(data.userId).toBe('testUser2');
      secondClient.disconnect();
      done();
    });
  });

  test('should broadcast user offline status on disconnection', (done) => {
    const secondToken = jwt.sign({ id: 'testUser2' }, process.env.JWT_SECRET || 'test-secret');
    const secondClient = Client(`http://localhost:${port}`, {
      auth: { token: secondToken },
      transports: ['websocket'],
    });

    secondClient.on('connect', () => {
      clientSocket.on('user_offline', (data: any) => {
        expect(data.userId).toBe('testUser2');
        done();
      });
      
      secondClient.disconnect();
    });
  });
});