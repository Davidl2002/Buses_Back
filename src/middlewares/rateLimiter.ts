import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, 
  max: 1000, 
  message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Demasiados intentos de inicio de sesión, intenta de nuevo en 1 minuto.',
});
