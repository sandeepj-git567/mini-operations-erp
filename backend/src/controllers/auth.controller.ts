import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { loginSchema } from '../validators/auth.validator';
import { AuthRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';

export class AuthController {
  static login = asyncHandler(async (req: Request, res: Response) => {
    const validated = loginSchema.parse(req.body);
    const result = await AuthService.login(validated.email, validated.password);
    res.status(200).json(result);
  });

  static logout = asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({ message: 'Logged out successfully' });
  });

  static me = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const user = await AuthService.me(userId);
    res.status(200).json(user);
  });
}
