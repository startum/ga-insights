'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AnalyticsData {
  // Add specific types based on your analytics data structure
  [key: string]: any;
}

export default function DashboardClient({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propertyId) {
      fetchAnalyticsData();
    }
  }, [propertyId]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/data');
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setData(result.report);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleResetProperty = async () => {
    try {
      const response = await fetch('/api/analytics/select-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId: null }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset property');
      }

      router.push('/setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset property');
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchAnalyticsData}
          className="mt-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleResetProperty}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Change Property
        </button>
      </div>
      
      {data && (
        <div className="bg-white p-6 rounded-lg shadow">
          <pre className="overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
