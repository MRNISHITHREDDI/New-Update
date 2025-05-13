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
  // Get token from localStorage
  const ADMIN_PASSWORD = 'jalwa-admin-2023'; // This should match the server's expected token
  
  const response = await fetch('/api/admin/account-verifications', {
    headers: {
      'X-Admin-Token': ADMIN_PASSWORD
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch verifications');
  }
  const data = await response.json();
  return data.data || [];
};

const fetchVerificationsByStatus = async (status: string): Promise<Verification[]> => {
  // Get token from localStorage
  const ADMIN_PASSWORD = 'jalwa-admin-2023'; // This should match the server's expected token
  
  const response = await fetch(`/api/admin/account-verifications/status/${status}`, {
    headers: {
      'X-Admin-Token': ADMIN_PASSWORD
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${status} verifications`);
  }
  const data = await response.json();
  return data.data || [];
};

const updateVerificationStatus = async (params: { id: number; status: string; notes?: string }) => {
  const { id, status, notes } = params;
  // Get token from localStorage
  const ADMIN_PASSWORD = 'jalwa-admin-2023'; // This should match the server's expected token
  
  const response = await fetch(`/api/admin/account-verifications/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': ADMIN_PASSWORD
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
    <div className="w-full">
      <Card className="border-[#00ECBE]/20 bg-[#05012B]/50 mb-8 shadow-lg">
        <CardHeader className="pb-4 pt-6 px-8">
          <CardTitle className="text-2xl font-medium text-[#00ECBE]">Account Verifications</CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-6">
          <p className="text-base text-muted-foreground">
            Review and manage user verification requests. Approve or reject user accounts based on their Jalwa User ID.
          </p>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TabsList className="overflow-x-auto w-full sm:w-auto bg-[#05012B]/70 border-[#00ECBE]/20 border p-1.5">
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-[#00ECBE]/10 data-[state=active]:text-[#00ECBE] data-[state=active]:shadow-none py-3.5 px-6 text-base"
            >
              All Verifications
            </TabsTrigger>
            <TabsTrigger 
              value="approved"
              className="data-[state=active]:bg-[#00ECBE]/10 data-[state=active]:text-[#00ECBE] data-[state=active]:shadow-none py-3.5 px-6 text-base"
            >
              Approved
            </TabsTrigger>
            <TabsTrigger 
              value="rejected"
              className="data-[state=active]:bg-[#00ECBE]/10 data-[state=active]:text-[#00ECBE] data-[state=active]:shadow-none py-3.5 px-6 text-base"
            >
              Rejected
            </TabsTrigger>
          </TabsList>
          
          <div className="hidden sm:flex items-center gap-4">
            <Label htmlFor="status-filter" className="text-muted-foreground text-base">Filter:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter" className="w-[220px] border-[#00ECBE]/30 bg-[#05012B]/70 py-3.5 px-4 text-base">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-[#05012B] border-[#00ECBE]/30">
                <SelectItem value="all" className="text-base py-2.5">All</SelectItem>
                <SelectItem value="pending" className="text-base py-2.5">Pending</SelectItem>
                <SelectItem value="approved" className="text-base py-2.5">Approved</SelectItem>
                <SelectItem value="rejected" className="text-base py-2.5">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-6 pb-6">
          {renderVerificationsTable(getVerificationsToDisplay())}
        </TabsContent>
        
        <TabsContent value="approved" className="mt-6 pb-6">
          {renderVerificationsTable(
            getVerificationsToDisplay().filter(v => v.status === 'approved')
          )}
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-6 pb-6">
          {renderVerificationsTable(
            getVerificationsToDisplay().filter(v => v.status === 'rejected')
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderVerificationsTable(verifications: Verification[]) {
    if (isLoading) {
      return (
        <div className="text-center py-10 bg-[#05012B]/70 rounded-lg border border-[#00ECBE]/20 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00ECBE] border-t-transparent"></div>
            <p className="text-[#00ECBE]">Loading verifications...</p>
          </div>
        </div>
      );
    }

    if (verifications.length === 0) {
      return (
        <div className="text-center py-10 bg-[#05012B]/70 rounded-lg border border-[#00ECBE]/20">
          <p className="text-muted-foreground">No verifications found.</p>
        </div>
      );
    }

    // Mobile card view
    const MobileCards = () => (
      <div className="space-y-6 lg:hidden admin-mobile-cards">
        {verifications.map((verification) => (
          <div 
            key={verification.id} 
            className="border border-[hsl(165,100%,46%)] border-opacity-20 rounded-lg text-white my-4 shadow-md bg-[#05012B]/70"
          >
            <div className="m-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-sm font-medium text-[hsl(165,100%,46%)]">ID: </span>
                  <span className="font-medium">{verification.id}</span>
                </div>
                <StatusBadge status={verification.status} />
              </div>
              
              <div className="mb-4 mt-2">
                <span className="text-sm font-medium text-[hsl(165,100%,46%)]">User ID: </span>
                <span className="font-medium text-base">{verification.jalwaUserId}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <span className="text-[hsl(165,100%,46%)]">Created: </span>
                  <span className="text-[hsl(240,20%,90%)]">{formatDate(verification.createdAt)}</span>
                </div>
                <div>
                  <span className="text-[hsl(165,100%,46%)]">Updated: </span>
                  <span className="text-[hsl(240,20%,90%)]">{formatDate(verification.updatedAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end border-t border-[hsl(165,100%,46%)] border-opacity-20 p-4">
              {verification.status === 'rejected' ? (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-[hsl(165,100%,46%)] hover:bg-[hsl(165,100%,40%)] text-black w-full py-2.5"
                  onClick={() => handleApprove(verification.id)}
                  disabled={isLoading}
                >
                  Approve
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full py-2.5"
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
      <div className="rounded-md border border-[#00ECBE]/20 overflow-x-auto hidden lg:block admin-table-container bg-[#05012B]/50">
        <Table className="admin-table">
          <TableCaption className="text-muted-foreground">List of account verification requests.</TableCaption>
          <TableHeader className="bg-[#05012B]/70">
            <TableRow className="border-b-[#00ECBE]/20 hover:bg-[#00ECBE]/5">
              <TableHead className="w-[100px] text-[#00ECBE]">ID</TableHead>
              <TableHead className="text-[#00ECBE]">User ID</TableHead>
              <TableHead className="text-[#00ECBE]">Status</TableHead>
              <TableHead className="text-[#00ECBE]">Created</TableHead>
              <TableHead className="text-[#00ECBE]">Updated</TableHead>
              <TableHead className="text-right text-[#00ECBE]">Actions</TableHead>
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