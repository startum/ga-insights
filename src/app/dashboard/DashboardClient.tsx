'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { format, parseISO } from 'date-fns';
import LoadingSpinner from '@/components/LoadingSpinner';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type DateRange = '24h' | '7d' | '28d';

interface AnalyticsData {
  dimensionHeaders: Array<{ name: string }>;
  metricHeaders: Array<{ name: string; type: string }>;
  rows: Array<{
    dimensionValues: Array<{ value: string }>;
    metricValues: Array<{ value: string }>;
  }>;
  rowCount: number;
  metadata: {
    currencyCode: string;
    timeZone: string;
  };
}

export default function DashboardClient({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('7d');

  useEffect(() => {
    if (propertyId) {
      fetchAnalyticsData();
    }
  }, [propertyId, dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/data?range=${dateRange}`);
      
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

  const formatDate = (dateString: string) => {
    // Convert YYYYMMDD to YYYY-MM-DD
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const date = parseISO(`${year}-${month}-${day}`);
    return dateRange === '24h' 
      ? format(date, 'HH:mm')
      : format(date, 'MMM d');
  };

  const getChartData = () => {
    if (!data?.rows) return null;

    const sortedData = [...data.rows].sort((a, b) => 
      a.dimensionValues[0].value.localeCompare(b.dimensionValues[0].value)
    );

    return {
      labels: sortedData.map(row => formatDate(row.dimensionValues[0].value)),
      datasets: [
        {
          label: 'Sessions',
          data: sortedData.map(row => parseInt(row.metricValues[0].value)),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Sessions Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const getRangeLabel = (range: DateRange) => {
    switch (range) {
      case '24h': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '28d': return 'Last 28 Days';
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

  const chartData = getChartData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Analytics Overview</h2>
          <p className="text-sm text-gray-500">{getRangeLabel(dateRange)}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex rounded-md shadow-sm" role="group">
            {(['24h', '7d', '28d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 text-sm font-medium ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-300 first:rounded-l-md last:rounded-r-md -ml-px first:ml-0`}
              >
                {range === '24h' ? '24h' : range === '7d' ? '7d' : '28d'}
              </button>
            ))}
          </div>
          <button
            onClick={handleResetProperty}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Change Property
          </button>
        </div>
      </div>
      
      {chartData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <Line options={chartOptions} data={chartData} />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Sessions</p>
              <p className="text-2xl font-bold text-blue-900">
                {data.rows.reduce((sum, row) => sum + parseInt(row.metricValues[0].value), 0)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Average Daily Sessions</p>
              <p className="text-2xl font-bold text-green-900">
                {Math.round(data.rows.reduce((sum, row) => sum + parseInt(row.metricValues[0].value), 0) / data.rows.length)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
