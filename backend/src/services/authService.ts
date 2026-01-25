import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { config } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

export interface RegisterData {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
  token: string;
}

export class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(409, 'User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        displayName: data.displayName,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    });

    // Generate JWT
    const token = this.generateToken(user.id);

    return {
      user,
      token,
    };
  }

  async login(data: LoginData): Promise<AuthResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    // Generate JWT
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      token,
    };
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }
}

export const authService = new AuthService();
