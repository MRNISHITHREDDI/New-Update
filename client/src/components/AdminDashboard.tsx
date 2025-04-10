import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import './admin-dashboard.css';

// UI Components
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

// Types for verification data
interface Verification {
  id: number;
  jalwaUserId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// API functions
const fetchAllVerifications = async (): Promise<Verification[]> => {
  const response = await fetch('/api/admin/account-verifications');
  if (!response.ok) {
    throw new Error('Failed to fetch verifications');
  }
  const data = await response.json();
  return data.data || [];
};

const fetchVerificationsByStatus = async (status: string): Promise<Verification[]> => {
  const response = await fetch(`/api/admin/account-verifications/status/${status}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${status} verifications`);
  }
  const data = await response.json();
  return data.data || [];
};

const updateVerificationStatus = async (params: { id: number; status: string; notes?: string }) => {
  const { id, status, notes } = params;
  const response = await fetch(`/api/admin/account-verifications/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status,
      notes: notes || `${status} via admin dashboard`,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update verification status');
  }
  
  return response.json();
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Badge className={`${getStatusColor()} text-white`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const queryClient = useQueryClient();

  // Query for all verifications
  const { data: allVerifications, isLoading: isLoadingAll, isError: isErrorAll } = useQuery({
    queryKey: ['/api/admin/account-verifications'],
    queryFn: fetchAllVerifications,
  });

  // Query for filtered verifications
  const { data: filteredVerifications, isLoading: isLoadingFiltered, isError: isErrorFiltered } = useQuery({
    queryKey: ['/api/admin/account-verifications/status', statusFilter],
    queryFn: () => fetchVerificationsByStatus(statusFilter),
    enabled: statusFilter !== 'all',
  });

  // Mutation for updating verification status
  const updateMutation = useMutation({
    mutationFn: updateVerificationStatus,
    onSuccess: () => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/account-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/account-verifications/status', statusFilter] });
      
      toast({
        title: 'Success',
        description: 'User status updated successfully',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    },
  });

  // Handle direct removal (rejection)
  const handleRemove = (id: number) => {
    updateMutation.mutate({
      id,
      status: 'rejected',
      notes: 'Removed via admin dashboard',
    });
  };
  
  // Handle approving a user
  const handleApprove = (id: number) => {
    updateMutation.mutate({
      id,
      status: 'approved',
      notes: 'Approved via admin dashboard',
    });
  };

  // Get verifications based on active filter
  const getVerificationsToDisplay = () => {
    if (statusFilter !== 'all' && filteredVerifications) {
      return filteredVerifications;
    }
    return allVerifications || [];
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isLoading = isLoadingAll || isLoadingFiltered || updateMutation.isPending;
  const isError = isErrorAll || isErrorFiltered;

  if (isError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-500">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to load verification data. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <TabsList className="overflow-x-auto w-full sm:w-auto">
            <TabsTrigger value="all">All Verifications</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          
          <div className="hidden sm:flex items-center gap-2">
            <Label htmlFor="status-filter">Filter:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter" className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-4">
          {renderVerificationsTable(getVerificationsToDisplay())}
        </TabsContent>
        
        <TabsContent value="approved" className="mt-4">
          {renderVerificationsTable(
            getVerificationsToDisplay().filter(v => v.status === 'approved')
          )}
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-4">
          {renderVerificationsTable(
            getVerificationsToDisplay().filter(v => v.status === 'rejected')
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderVerificationsTable(verifications: Verification[]) {
    if (isLoading) {
      return <div className="text-center py-8">Loading...</div>;
    }

    if (verifications.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-100 rounded-lg">
          <p className="text-gray-500">No verifications found.</p>
        </div>
      );
    }

    // Mobile card view
    const MobileCards = () => (
      <div className="space-y-4 lg:hidden">
        {verifications.map((verification) => (
          <div 
            key={verification.id} 
            className="border border-[hsl(165,100%,46%)] border-opacity-20 rounded-lg text-white m-2"
          >
            <div className="m-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-sm text-[hsl(165,100%,46%)]">ID: </span>
                  <span className="font-medium">{verification.id}</span>
                </div>
                <StatusBadge status={verification.status} />
              </div>
              
              <div className="mb-2">
                <span className="text-sm text-[hsl(165,100%,46%)]">User ID: </span>
                <span className="font-medium">{verification.jalwaUserId}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div>
                  <span className="text-[hsl(165,100%,46%)]">Created: </span>
                  <span className="text-[hsl(240,20%,80%)]">{formatDate(verification.createdAt)}</span>
                </div>
                <div>
                  <span className="text-[hsl(165,100%,46%)]">Updated: </span>
                  <span className="text-[hsl(240,20%,80%)]">{formatDate(verification.updatedAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end border-t border-[hsl(165,100%,46%)] border-opacity-20 m-2">
              {verification.status === 'rejected' ? (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-[hsl(165,100%,46%)] hover:bg-[hsl(165,100%,40%)] text-black w-full m-2"
                  onClick={() => handleApprove(verification.id)}
                  disabled={isLoading}
                >
                  Approve
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full m-2"
                  onClick={() => handleRemove(verification.id)}
                  disabled={isLoading}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
    
    // Desktop table view
    const DesktopTable = () => (
      <div className="rounded-md border overflow-x-auto hidden lg:block">
        <Table>
          <TableCaption>List of account verification requests.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {verifications.map((verification) => (
              <TableRow key={verification.id}>
                <TableCell className="font-medium">{verification.id}</TableCell>
                <TableCell>{verification.jalwaUserId}</TableCell>
                <TableCell>
                  <StatusBadge status={verification.status} />
                </TableCell>
                <TableCell>{formatDate(verification.createdAt)}</TableCell>
                <TableCell>{formatDate(verification.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  {verification.status === 'rejected' ? (
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-[hsl(165,100%,46%)] hover:bg-[hsl(165,100%,40%)] text-black"
                      onClick={() => handleApprove(verification.id)}
                      disabled={isLoading}
                    >
                      Approve
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(verification.id)}
                      disabled={isLoading}
                    >
                      Remove
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
    
    return (
      <>
        <MobileCards />
        <DesktopTable />
      </>
    );
  }
};

export default AdminDashboard;