'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function TestChatPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testAvailableUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 Testing available users...');
      console.log('👤 Current user:', user);
      console.log('🔑 Token present:', !!token);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const url = `${apiUrl}/api/chat/available-users`;
      
      console.log('📡 Making request to:', url);
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success! Users:', data);
        setUsers(data);
      } else {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        setError(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (err: any) {
      console.error('❌ Network error:', err);
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Chat Test Page</h1>
        <p className="text-red-600">Please log in first to test chat functionality.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Chat Available Users Test</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Current User Info:</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Token:</strong> {token ? 'Present' : 'Missing'}</p>
      </div>

      <button
        onClick={testAvailableUsers}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Available Users'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-semibold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {users.length > 0 && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h3 className="font-semibold mb-2">Available Users ({users.length}):</h3>
          <ul className="space-y-2">
            {users.map((user: any) => (
              <li key={user.id} className="flex items-center space-x-2">
                <span className="font-medium">{user.name}</span>
                <span className="text-sm">({user.email})</span>
                <span className="text-xs bg-blue-200 px-2 py-1 rounded">{user.role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Make sure you're logged in</li>
          <li>Click "Test Available Users" button</li>
          <li>Check browser console (F12) for detailed logs</li>
          <li>If successful, users should appear below</li>
        </ol>
      </div>
    </div>
  );
}