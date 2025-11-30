import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Manejar errores de validación de Zod
  if (err && err.name === 'ZodError' && Array.isArray(err.issues)) {
    const issues = err.issues.map((i: any) => ({ path: i.path, message: i.message, code: i.code }));
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: issues
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
