import { Request } from 'express';
import { Role } from './enums';

export * from './enums';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
