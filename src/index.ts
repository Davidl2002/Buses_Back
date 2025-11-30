import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Swagger
import { setupSwagger } from './config/swagger';

// Rutas
import authRoutes from './routes/auth.routes';
import cooperativaRoutes from './routes/cooperativa.routes';
import busRoutes from './routes/bus.routes';
import routeRoutes from './routes/route.routes';
import frequencyRoutes from './routes/frequency.routes';
import tripRoutes from './routes/trip.routes';
import ticketRoutes from './routes/ticket.routes';
import operationsRoutes from './routes/operations.routes';
import staffRoutes from './routes/staff.routes';
import usersRoutes from './routes/users.routes';
import dashboardRoutes from './routes/dashboard.routes';

// Middleware
import { errorHandler } from './middlewares/errorHandler';
import { rateLimiter } from './middlewares/rateLimiter';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Socket.IO para bloqueo de asientos en tiempo real
export { io };

// Middlewares globales
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression() as any);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));

// Swagger documentation
setupSwagger(app);

// Rate limiting
app.use(rateLimiter);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/cooperativas', cooperativaRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/frequencies', frequencyRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

export default app;
