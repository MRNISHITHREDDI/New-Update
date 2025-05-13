import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Clipboard, CheckCircle2, Gift } from 'lucide-react';

const GiftCodeAdmin = () => {
  const [giftCode, setGiftCode] = useState('');
  const [newGiftCode, setNewGiftCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Fetch current gift code
  const fetchGiftCode = async () => {
    try {
      const response = await fetch('/api/gift-code');
      const data = await response.json();
      
      if (data.success) {
        setGiftCode(data.data.giftCode);
        setNewGiftCode(data.data.giftCode);
      } else {
        toast({
          title: "Error",
          description: "Failed to load gift code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching gift code:", error);
      toast({
        title: "Error",
        description: "Failed to load gift code. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update gift code
  const updateGiftCode = async () => {
    if (!newGiftCode) {
      toast({
        title: "Error",
        description: "Gift code cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Get the admin token from localStorage
      const adminToken = 'jalwa-admin-2023'; // This should match the server's expected token

      const response = await fetch('/api/admin/gift-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken
        },
        body: JSON.stringify({ giftCode: newGiftCode }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setGiftCode(data.data.giftCode);
        toast({
          title: "Success",
          description: "Gift code updated successfully",
        });
        
        // Trigger an event to notify other components that the gift code has changed
        window.dispatchEvent(new CustomEvent('giftCodeUpdated', { 
          detail: { giftCode: data.data.giftCode } 
        }));
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update gift code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating gift code:", error);
      toast({
        title: "Error",
        description: "Failed to update gift code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(giftCode).then(() => {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Gift code copied to clipboard",
        duration: 2000,
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }).catch(err => {
      toast({
        title: "Failed to copy",
        description: "Please try copying manually",
        variant: "destructive",
      });
    });
  };

  // Fetch gift code on component mount
  useEffect(() => {
    fetchGiftCode();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gift size={20} className="text-[#00ECBE]" />
          <CardTitle>Gift Code Management</CardTitle>
        </div>
        <CardDescription>View and update the gift code displayed to users</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Current Gift Code</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-between bg-[#05012B]/70 border border-[#00ECBE]/30 rounded-lg p-3 flex-1">
                <code className="text-white font-mono text-sm overflow-auto whitespace-nowrap max-w-[calc(100%-40px)]">
                  {giftCode || 'Loading...'}
                </code>
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyCode}
                className="text-[#00ECBE] hover:text-white border-[#00ECBE]/30 hover:bg-[#00ECBE]/10"
              >
                {copied ? <CheckCircle2 size={18} /> : <Clipboard size={18} />}
              </Button>
            </div>
          </div>
          
          <div className="pt-4">
            <label className="text-sm font-medium mb-1 block">Update Gift Code</label>
            <div className="flex items-center gap-2">
              <Input 
                value={newGiftCode}
                onChange={(e) => setNewGiftCode(e.target.value)}
                placeholder="Enter new gift code"
                className="flex-1"
              />
              <Button
                onClick={updateGiftCode}
                disabled={isLoading || !newGiftCode}
                className="bg-[#00ECBE] text-[#05012B] hover:bg-[#00ECBE]/90"
              >
                {isLoading ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GiftCodeAdmin;