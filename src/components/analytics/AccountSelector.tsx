'use client';

import { useState } from 'react';

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

interface AccountSelectorProps {
  accounts: Account[];
  properties: Property[];
  onAccountSelect: (accountId: string) => void;
  onPropertySelect: (propertyId: string) => void;
  selectedAccountId?: string;
  selectedPropertyId?: string;
  onSubmit: () => Promise<void>;
  isSubmitting?: boolean;
}

export default function AccountSelector({
  accounts,
  properties,
  onAccountSelect,
  onPropertySelect,
  selectedAccountId,
  selectedPropertyId,
  onSubmit,
  isSubmitting = false
}: AccountSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="account" className="block text-sm font-medium text-gray-700">
          Select Google Analytics Account
        </label>
        <select
          id="account"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          value={selectedAccountId || ''}
          onChange={(e) => onAccountSelect(e.target.value)}
        >
          <option value="">Select an account...</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      {selectedAccountId && properties.length > 0 && (
        <div>
          <label htmlFor="property" className="block text-sm font-medium text-gray-700">
            Select Property
          </label>
          <select
            id="property"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={selectedPropertyId || ''}
            onChange={(e) => onPropertySelect(e.target.value)}
          >
            <option value="">Select a property...</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedPropertyId && (
        <div className="mt-6">
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Setting up...' : '➡️ Use This Property'}
          </button>
        </div>
      )}
    </div>
  );
}
