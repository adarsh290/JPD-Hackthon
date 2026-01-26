import { useState } from 'react';
import { useAuth } from './useAuth';
import { apiConfig } from '@/lib/api';

export const useAnalyticsExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const exportCSV = async (hubId: number) => {
    if (!session?.access_token) {
      setError('Authentication required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiConfig.endpoints.analyticsExport(hubId.toString()), {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export analytics');
      }

      // Get the CSV data as blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hub-${hubId}-analytics.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export analytics');
    } finally {
      setLoading(false);
    }
  };

  return {
    exportCSV,
    loading,
    error,
  };
};