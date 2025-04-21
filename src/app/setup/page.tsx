'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AccountSelector from '@/components/analytics/AccountSelector';

interface Account {
  id: string;
  name: string;
  fullName: string;
}

interface Property {
  id: string;
  name: string;
  fullName: string;
  createTime?: string;
  updateTime?: string;
}

export default function SetupPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  // Debug log for initial accounts fetch
  useEffect(() => {
    console.log('Initial accounts fetch starting...');
    fetchAccounts();
  }, []);

  // Debug log for selectedAccountId changes
  useEffect(() => {
    console.log('🔄 selectedAccountId changed to:', selectedAccountId);
    if (selectedAccountId) {
      console.log('📊 Attempting to fetch properties for account:', selectedAccountId);
      fetchProperties(selectedAccountId);
    } else {
      console.log('❌ No account selected, clearing properties');
      setProperties([]);
    }
  }, [selectedAccountId]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      console.log('Fetching accounts...');
      const response = await fetch('/api/analytics/properties');
      const data = await response.json();
      
      if (data.error) {
        console.error('Accounts fetch error:', data.error);
        throw new Error(data.error);
      }
      
      console.log('Accounts fetched:', data.accounts);
      setAccounts(data.accounts || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load accounts';
      console.error('Accounts fetch error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async (accountId: string) => {
    try {
      setLoading(true);
      console.log('Setup page: Fetching properties for account ID:', accountId);
      
      const response = await fetch(`/api/analytics/properties?accountId=${accountId}`);
      console.log('Setup page: Properties response status:', response.status);
      
      const data = await response.json();
      console.log('Setup page: Properties response data:', data);
      
      if (data.error) {
        console.error('Setup page: Properties fetch error:', data.error);
        throw new Error(data.error);
      }
      
      console.log('Setup page: Properties fetched successfully:', data.properties);
      setProperties(data.properties);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load properties';
      console.error('Setup page: Properties fetch error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = (accountId: string) => {
    console.log('🔍 handleAccountSelect called with:', accountId);
    setSelectedAccountId(accountId);
  };

  const handlePropertySelect = (propertyId: string) => {
    console.log('Property selected:', propertyId);
    setSelectedPropertyId(propertyId);
  };

  const handleSubmit = async () => {
    if (!selectedPropertyId) {
      console.log('No property selected, cannot submit');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Submitting property selection:', selectedPropertyId);
      const response = await fetch('/api/analytics/select-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId: selectedPropertyId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save property selection');
      }

      console.log('Property selection saved successfully');
      router.push('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save property selection';
      console.error('Submit error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 text-center">
            <h3 className="text-lg font-semibold">Error</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  console.log('🔄 Current state:', {
    accountsCount: accounts.length,
    selectedAccountId,
    propertiesCount: properties.length,
    selectedPropertyId,
    isLoading: loading,
    hasError: !!error
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Setup Analytics</h1>
        
        <div className="mb-4 p-4 bg-gray-100 rounded text-sm font-mono">
          <p>Debug Info:</p>
          <ul>
            <li>Accounts loaded: {accounts.length}</li>
            <li>Selected Account: {selectedAccountId || 'none'}</li>
            <li>Properties loaded: {properties.length}</li>
            <li>Selected Property: {selectedPropertyId || 'none'}</li>
            <li>Loading: {loading ? 'yes' : 'no'}</li>
          </ul>
        </div>
        
        {loading ? (
          <div className="text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <AccountSelector
              accounts={accounts}
              properties={properties}
              onAccountSelect={handleAccountSelect}
              onPropertySelect={handlePropertySelect}
              selectedAccountId={selectedAccountId}
              selectedPropertyId={selectedPropertyId}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </div>
    </div>
  );
}
