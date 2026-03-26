'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'owner'>('admin');
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password, role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          EPL  AUCTION 2026
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 mb-6">
              <Button
                type="button"
                variant={role === 'admin' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => {
                  setRole('admin');
                  setEmail('');
                }}
              >
                Admin
              </Button>
              <Button
                type="button"
                variant={role === 'owner' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => {
                  setRole('owner');
                  setEmail('');
                }}
              >
                Team Owner
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {role === 'admin' ? 'Admin Username' : 'Team Email'}
              </label>
              <input
                type={role === 'admin' ? 'text' : 'email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={role === 'admin' ? 'admin' : 'owner1@esssqube.com'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm text-gray-400 mt-4 space-y-1">
              <p className="font-semibold">Demo Credentials:</p>
              <p>Admin: admin / admin123</p>
              <p>Owner: owner1@esssqube.com / owner123</p>
              <p className="text-xs mt-2">(Use any owner email from: owner1@esssqube.com to owner6@esssqube.com)</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}