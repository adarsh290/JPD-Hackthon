process.env.DATABASE_URL = 'postgres://test';
process.env.JWT_SECRET = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
process.env.JWT_EXPIRES_IN = '7d';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.PORT = '3000';
process.env.NODE_ENV = 'test';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  __esModule: true,
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  sign: jest.fn().mockReturnValue('signed-token'),
}));

const { authService } = require('../../services/authService');
const prisma = require('../../config/database');

describe('AuthService.register', () => {
  const registerData = { email: 'test@example.com', password: 'Password123' };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new user when email is unique', async () => {
    // @ts-ignore
    prisma.user.findUnique.mockResolvedValue(null);
    // @ts-ignore
    prisma.user.create.mockResolvedValue({ id: '1', email: registerData.email, displayName: null });

    const result = await authService.register(registerData);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: registerData.email } });
    expect(prisma.user.create).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalled();
    expect(result).toHaveProperty('token', 'signed-token');
  });

  it('throws an error when email already exists', async () => {
    // @ts-ignore
    prisma.user.findUnique.mockResolvedValue({ id: '1', email: registerData.email });
    await expect(authService.register(registerData)).rejects.toThrow();
  });
});
