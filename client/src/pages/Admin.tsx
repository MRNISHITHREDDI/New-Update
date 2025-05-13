import React, { useState } from 'react';
import AdminDashboard from '@/components/AdminDashboard';
import GiftCodeAdmin from '@/components/GiftCodeAdmin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import SEO from '@/components/SEO';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Simple auth for admin panel
const Admin = () => {
  const [password, setPassword] = useState('');
  const { isAuthenticated, login, logout } = useAdminAuth();
  const [error, setError] = useState('');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      setError('');
    } else {
      setError('Invalid password. Please try again.');
    }
  };

  const handleLogout = () => {
    logout();
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-12 max-w-md">
        <SEO title="Admin Login | Jalwa Admin Panel" />
        <Card>
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Enter the admin password to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <Button type="submit">Login</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <SEO title="Admin Dashboard | Jalwa Admin Panel" />
      <div className="py-4 flex justify-between items-center px-4 sm:px-0">
        <h1 className="text-2xl font-bold">Jalwa Admin Panel</h1>
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
      </div>
      
      <Tabs defaultValue="verifications" className="w-full mt-4">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="verifications">Account Verifications</TabsTrigger>
          <TabsTrigger value="giftcode">Gift Code</TabsTrigger>
        </TabsList>
        
        <TabsContent value="verifications">
          <AdminDashboard />
        </TabsContent>
        
        <TabsContent value="giftcode">
          <GiftCodeAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;