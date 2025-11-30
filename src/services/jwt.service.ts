import jwt, { Secret, SignOptions } from 'jsonwebtoken';

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  cooperativaId?: string;
}

export const generateToken = (payload: JWTPayload): string => {
  const secret = process.env.JWT_SECRET as Secret;
  const options = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions;
  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET as Secret;
  return jwt.verify(token, secret) as JWTPayload;
};

export const generateVerificationToken = (): string => {
  const secret = process.env.JWT_SECRET as Secret;
  const options = { expiresIn: '24h' } as SignOptions;
  return jwt.sign({ purpose: 'email-verification' }, secret, options);
};

export const generateResetToken = (): string => {
  const secret = process.env.JWT_SECRET as Secret;
  const options = { expiresIn: '1h' } as SignOptions;
  return jwt.sign({ purpose: 'password-reset' }, secret, options);
};
