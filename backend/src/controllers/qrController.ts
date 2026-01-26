import { Response } from 'express';
import QRCode from 'qrcode';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { config } from '../config/env.js';

export class QRController {
  async generateHubQR(req: AuthRequest, res: Response): Promise<void> {
    const hubId = Number(req.params.id);
    if (Number.isNaN(hubId)) {
      throw new AppError(400, 'Invalid hub ID');
    }

    // Verify hub ownership
    const hub = await prisma.hub.findFirst({
      where: { id: hubId, userId: req.user!.id },
    });

    if (!hub) {
      throw new AppError(404, 'Hub not found or access denied');
    }

    try {
      // Generate public hub URL
      const publicUrl = `${config.cors.origin}/hub/${hub.slug}`;
      
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(publicUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 256,
      });

      res.json({
        success: true,
        data: {
          qrCode: qrDataUrl,
          publicUrl,
          hubTitle: hub.title,
        },
      });
    } catch (error) {
      console.error('QR Code generation error:', error);
      throw new AppError(500, 'Failed to generate QR code');
    }
  }
}

export const qrController = new QRController();