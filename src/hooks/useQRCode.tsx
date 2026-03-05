import { useState } from 'react';
import { useAuth } from './useAuth';
import { apiConfig } from '@/lib/api';

interface QRCodeData {
  qrCode: string;
  publicUrl: string;
  hubTitle: string;
}

export const useQRCode = (hubId: number | null) => {
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const generateQR = async (darkColor = '#00FF00', lightColor = '#000000'): Promise<QRCodeData> => {
    if (!hubId) {
      const message = 'Invalid hub. Please refresh and try again.';
      setError(message);
      throw new Error(message);
    }

    if (!session?.access_token) {
      const message = 'Authentication failed. Please log in again.';
      setError(message);
      throw new Error(message);
    }

    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({ darkColor, lightColor }).toString();
      const response = await fetch(`${apiConfig.endpoints.qr(hubId)}?${query}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        let message = `Failed to generate QR code (${response.status})`;

        if (response.status === 401) {
          message = 'Authentication failed. Please log in again.';
        } else if (response.status === 404) {
          message = 'Hub not found.';
        }

        throw new Error(message);
      }

      const result = await response.json();
      setQrData(result.data);
      return result.data as QRCodeData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate QR code';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrData) return;

    const link = document.createElement('a');
    link.href = qrData.qrCode;
    link.download = `${qrData.hubTitle}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    qrData,
    loading,
    error,
    generateQR,
    downloadQR,
  };
};