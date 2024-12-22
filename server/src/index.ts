import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/users';
import { bookingRouter } from './routes/bookings';
import { messageRouter } from './routes/messages';
import { paymentRouter } from './routes/payments';
import { reviewRouter } from './routes/reviews';
import { adminRouter } from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/authenticate';
import { initializeWebSockets } from './services/websocket';
import { setupStripe } from './services/stripe';
import { logger } from './utils/logger';
import { connectDB } from './db';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize WebSocket handlers
initializeWebSockets(io);

// Setup Stripe
setupStripe();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', authenticate, userRouter);
app.use('/api/bookings', authenticate, bookingRouter);
app.use('/api/messages', authenticate, messageRouter);
app.use('/api/payments', authenticate, paymentRouter);
app.use('/api/reviews', authenticate, reviewRouter);
app.use('/api/admin', authenticate, adminRouter);

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();