import { Request, Response } from 'express';
import { authService } from '../services/authService.js';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: result,
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body);
    res.json({
      success: true,
      data: result,
    });
  }
}

export const authController = new AuthController();
