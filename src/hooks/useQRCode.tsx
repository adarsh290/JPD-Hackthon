import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface QRCodeData {
  qrCode: string;
  publicUrl: string;
  hubTitle: string;
}

export const useQRCode = (hubId: number | null) => {
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const generateQR = async () => {
    if (!hubId || !token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hubs/${hubId}/qr`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const result = await response.json();
      setQrData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
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