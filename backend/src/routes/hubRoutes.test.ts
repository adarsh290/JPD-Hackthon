import request from 'supertest';
import app from '@server'; // The Express app
import prisma from '@config/database'; // Prisma client
import { AppError } from '@middleware/errorHandler'; // AppError

import { Request, Response, NextFunction } from 'express';

// Mock external dependencies
jest.mock('@config/database', () => ({
  __esModule: true,
  default: {
    hub: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(), // Used for slug uniqueness in createHub
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@middleware/auth', () => ({
  authenticate: jest.fn((req: Request, res: Response, next: NextFunction) => {
    // Mock authenticated user
    (req as any).user = { id: 'test-user-id' };
    next();
  }),
}));

jest.mock('@middleware/rateLimiter', () => ({
  apiLimiter: jest.fn((req: Request, res: Response, next: NextFunction) => {
    next(); // Bypass rate limiting
  }),
}));

// Mock validation middleware to simply call next for now
jest.mock('@utils/validation', () => ({
  validate: jest.fn((schema: any) => (req: Request, res: Response, next: NextFunction) => {
    next();
  }),
  createHubSchema: {}, // Mock schema if needed by other parts, but validate is mocked
  updateHubSchema: {}, // Mock schema if needed by other parts, but validate is mocked
}));

describe('Hub Routes', () => {
  const userId = 'test-user-id';
  const hubId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/hubs', () => {
    it('should create a new hub', async () => {
      const newHubData = { title: 'My Awesome Hub' };
      const createdHub = { id: hubId, userId, slug: 'my-awesome-hub', ...newHubData };

      (prisma.hub.findUnique as jest.Mock).mockResolvedValue(null); // Slug is unique
      (prisma.hub.create as jest.Mock).mockResolvedValue(createdHub);

      const res = await request(app)
        .post('/api/hubs')
        .send(newHubData)
        .expect(201);

      expect(prisma.hub.create).toHaveBeenCalledWith({
        data: {
          userId,
          title: newHubData.title,
          slug: 'my-awesome-hub',
        },
      });
      expect(res.body).toEqual({
        success: true,
        data: createdHub,
      });
    });

    it('should generate a unique slug if title is not unique', async () => {
      const newHubData = { title: 'Existing Hub' };
      const existingHub = { id: 2, userId, slug: 'existing-hub', title: 'Existing Hub' };
      const createdHub = { id: hubId, userId, slug: 'existing-hub-abc', ...newHubData };

      (prisma.hub.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingHub) // First call: slug exists
        .mockResolvedValueOnce(null); // Second call: slug is unique

      (prisma.hub.create as jest.Mock).mockResolvedValue(createdHub);

      const res = await request(app)
        .post('/api/hubs')
        .send(newHubData)
        .expect(201);

      expect(prisma.hub.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.hub.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            title: newHubData.title,
            slug: expect.stringMatching(/^existing-hub-[a-z0-9]+$/), // Check for generated slug
          }),
        }),
      );
      expect(res.body).toEqual({
        success: true,
        data: createdHub,
      });
    });

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/hubs')
        .send({})
        .expect(400); // Assuming validation middleware would catch this

      expect(res.body).toEqual({
        success: false,
        error: {
          message: 'Invalid input: title is required', // This message depends on how validation is mocked
        },
      });
    });
  });

  describe('GET /api/hubs', () => {
    it('should return all hubs for the authenticated user', async () => {
      const userHubs = [
        { id: 1, userId, title: 'Hub 1', slug: 'hub-1' },
        { id: 2, userId, title: 'Hub 2', slug: 'hub-2' },
      ];
      (prisma.hub.findMany as jest.Mock).mockResolvedValue(userHubs);

      const res = await request(app)
        .get('/api/hubs')
        .expect(200);

      expect(prisma.hub.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(res.body).toEqual({
        success: true,
        data: userHubs,
      });
    });
  });

  describe('GET /api/hubs/:id', () => {
    it('should return a specific hub if owned by the user', async () => {
      const ownedHub = { id: hubId, userId, title: 'My Hub', slug: 'my-hub' };
      (prisma.hub.findFirst as jest.Mock).mockResolvedValue(ownedHub);

      const res = await request(app)
        .get(`/api/hubs/${hubId}`)
        .expect(200);

      expect(prisma.hub.findFirst).toHaveBeenCalledWith({
        where: { id: hubId, userId },
      });
      expect(res.body).toEqual({
        success: true,
        data: ownedHub,
      });
    });

    it('should return 404 if hub not found or not owned by user', async () => {
      (prisma.hub.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/hubs/${hubId}`)
        .expect(404);

      expect(res.body).toEqual({
        success: false,
        error: {
          message: 'Hub not found',
        },
      });
    });

    it('should return 400 for invalid hub ID', async () => {
      const res = await request(app)
        .get('/api/hubs/abc')
        .expect(400);

      expect(res.body).toEqual({
        success: false,
        error: {
          message: 'Invalid hub ID',
        },
      });
    });
  });

  describe('PATCH /api/hubs/:id', () => {
    it('should update a specific hub if owned by the user', async () => {
      const updateData = { title: 'Updated Hub Title' };
      const existingHub = { id: hubId, userId, title: 'Old Title', slug: 'old-title' };
      const updatedHub = { ...existingHub, ...updateData };

      (prisma.hub.findFirst as jest.Mock).mockResolvedValue(existingHub); // For ownership check
      (prisma.hub.update as jest.Mock).mockResolvedValue(updatedHub);

      const res = await request(app)
        .patch(`/api/hubs/${hubId}`)
        .send(updateData)
        .expect(200);

      expect(prisma.hub.findFirst).toHaveBeenCalledWith({
        where: { id: hubId, userId },
      });
      expect(prisma.hub.update).toHaveBeenCalledWith({
        where: { id: hubId },
        data: updateData,
      });
      expect(res.body).toEqual({
        success: true,
        data: updatedHub,
      });
    });

    it('should return 404 if hub not found or not owned by user during update', async () => {
      (prisma.hub.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/hubs/${hubId}`)
        .send({ title: 'New Title' })
        .expect(404);

      expect(prisma.hub.update).not.toHaveBeenCalled();
      expect(res.body).toEqual({
        success: false,
        error: {
          message: 'Hub not found',
        },
      });
    });

    it('should return 400 for invalid hub ID during update', async () => {
      const res = await request(app)
        .patch('/api/hubs/abc')
        .send({ title: 'New Title' })
        .expect(400);

      expect(prisma.hub.update).not.toHaveBeenCalled();
      expect(res.body).toEqual({
        success: false,
        error: {
          message: 'Invalid hub ID',
        },
      });
    });
  });

  describe('DELETE /api/hubs/:id', () => {
    it('should delete a specific hub if owned by the user', async () => {
      const existingHub = { id: hubId, userId, title: 'Hub to Delete', slug: 'hub-to-delete' };

      (prisma.hub.findFirst as jest.Mock).mockResolvedValue(existingHub); // For ownership check
      (prisma.hub.delete as jest.Mock).mockResolvedValue(existingHub); // Return deleted hub

      const res = await request(app)
        .delete(`/api/hubs/${hubId}`)
        .expect(200);

      expect(prisma.hub.findFirst).toHaveBeenCalledWith({
        where: { id: hubId, userId },
      });
      expect(prisma.hub.delete).toHaveBeenCalledWith({
        where: { id: hubId },
      });
      expect(res.body).toEqual({
        success: true,
        message: 'Hub deleted successfully',
      });
    });

    it('should return 404 if hub not found or not owned by user during delete', async () => {
      (prisma.hub.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/hubs/${hubId}`)
        .expect(404);

      expect(prisma.hub.delete).not.toHaveBeenCalled();
      expect(res.body).toEqual({
        success: false,
        error: {
          message: 'Hub not found',
        },
      });
    });

    it('should return 400 for invalid hub ID during delete', async () => {
      const res = await request(app)
        .delete('/api/hubs/abc')
        .expect(400);

      expect(prisma.hub.delete).not.toHaveBeenCalled();
      expect(res.body).toEqual({
        success: false,
        error: {
          message: 'Invalid hub ID',
        },
      });
    });
  });
});
