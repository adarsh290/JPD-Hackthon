import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { authService } from '../services/authService.js';

export class AuthController {
  async register(req: AuthRequest, res: Response) {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: result,
    });
  }

  async login(req: AuthRequest, res: Response) {
    const result = await authService.login(req.body);
    res.json({
      success: true,
      data: result,
    });
  }
}

export const authController = new AuthController();
