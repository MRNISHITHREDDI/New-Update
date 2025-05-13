import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Lock, Rocket, HelpCircle, X, ArrowRightCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Response type for account verification
interface VerificationResponse {
  success: boolean;
  message: string;
  isVerified: boolean;
  status?: string;
  userId?: string;
}

interface AccountVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onShowLockedPopup: () => void; // New prop to directly show the locked popup
  gameType: 'wingo' | 'trx';
  timeOption: string;
}

// Optimized animations for better performance - exactly matching PredictionModal
const overlayAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

const modalAnimation = {
  initial: { scale: 0.96, y: 10, opacity: 0 },
  animate: { 
    scale: 1, 
    y: 0, 
    opacity: 1, 
    transition: { 
      type: "spring", 
      damping: 20, 
      stiffness: 300, 
      duration: 0.2 
    } 
  },
  exit: { 
    scale: 0.96, 
    y: 10, 
    opacity: 0,
    transition: { duration: 0.15 } 
  }
};

const AccountVerificationModal = ({ 
  isOpen, 
  onClose, 
  onContinue, 
  onShowLockedPopup,
  gameType, 
  timeOption 
}: AccountVerificationModalProps) => {
  // Check if user is already verified from localStorage
  const [isVerified, setIsVerified] = useState(() => {
    if (typeof window !== 'undefined') {
      const verified = localStorage.getItem('jalwaAccountVerified') === 'true';
      return verified;
    }
    return false;
  });
  
  const [registrationStarted, setRegistrationStarted] = useState(false);
  const [userId, setUserId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jalwaUserID') || "";
    }
    return "";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Prevent clicks inside the modal from closing it
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  const handleStartClick = () => {
    // Open the registration link in a new tab
    window.open('https://www.jalwa.vip/#/register?invitationCode=327361287589', '_blank');
    
    // Mark registration as started
    setRegistrationStarted(true);
    
    toast({
      title: "🚀 Registration Started",
      description: "Complete the registration on Jalwa site, then return here and enter your User ID.",
      duration: 5000,
    });
  };
  
  const handleVerifyUserID = async () => {
    if (!userId || userId.trim() === "") {
      toast({
        title: "❌ Verification Failed",
        description: "Please enter your Jalwa User ID to continue.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    // Show loading state
    setIsSubmitting(true);
    
    // Display initial processing message
    toast({
      title: "⏳ Processing Verification",
      description: "Please wait while we verify your account...",
      duration: 2000,
    });
    
    try {
      // Call our API to verify the user ID
      const response = await apiRequest<VerificationResponse>('/api/verify-account', {
        method: 'POST',
        body: JSON.stringify({ jalwaUserId: userId.trim() }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // After submission, we'll automatically approve the ID after 2 seconds
      // regardless of the actual response (this is per the requirement)
      setTimeout(() => {
        // Set as verified
        setIsVerified(true);
        
        // Store the verified status and ID in localStorage
        localStorage.setItem('jalwaAccountVerified', 'true');
        localStorage.setItem('jalwaUserID', userId);
        
        // Show success toast
        toast({
          title: "✅ Verification Complete",
          description: "Your account has been verified. You can now access premium predictions!",
          duration: 5000,
        });
        
        // End the submitting state
        setIsSubmitting(false);
      }, 2000);
      
    } catch (error) {
      console.error('Account verification error:', error);
      
      // Even if there's an error, we'll still auto-approve after 2 seconds
      setTimeout(() => {
        // Set as verified
        setIsVerified(true);
        
        // Store the verified status and ID in localStorage
        localStorage.setItem('jalwaAccountVerified', 'true');
        localStorage.setItem('jalwaUserID', userId);
        
        // Show success toast
        toast({
          title: "✅ Verification Complete",
          description: "Your account has been verified. You can now access premium predictions!",
          duration: 5000,
        });
        
        // End the submitting state
        setIsSubmitting(false);
      }, 2000);
    }
  };
  
  const handleContinueClick = () => {
    if (!isVerified) {
      // Close this modal and directly call the locked popup function
      onClose();
      // Use a short timeout to ensure UI updates properly
      setTimeout(() => {
        onShowLockedPopup();
      }, 100);
      return;
    }
    
    // Save verification status
    localStorage.setItem('jalwaAccountVerified', 'true');
    
    // Continue to predictions
    onContinue();
  };
  
  const handleHelpClick = () => {
    // Open Telegram help channel
    window.open('https://t.me/Bongjayanta2', '_blank');
  };
  
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 overflow-y-auto"
          {...overlayAnimation}
          onClick={onClose}
        >
          <motion.div
            className="bg-[#05012B] border border-[#00ECBE]/30 rounded-xl sm:max-w-[500px] w-full z-[101] shadow-[0_0_25px_rgba(0,236,190,0.3)] my-auto max-h-[90vh] md:max-h-none"
            {...modalAnimation}
            onClick={handleModalClick}
          >
            <div className="relative overflow-y-auto max-h-[90vh] md:max-h-none">
              <button 
                className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-[#00ECBE]/10 z-10"
                onClick={onClose}
              >
                <X size={20} />
              </button>
              
              <div className="p-6 pb-0 sticky top-0 bg-[#05012B] z-[5]">
                <div className="flex items-center justify-center mb-2">
                  <Rocket className="h-6 w-6 mr-2 text-[#00ECBE]" />
                  <h2 className="text-2xl font-bold text-center text-white whitespace-nowrap">JALWA <span className="text-[#00ECBE]">VIP PREDICTION</span></h2>
                </div>
                <div className="flex justify-center">
                  <Badge variant="outline" className="w-auto p-1 px-3 bg-[#081042] text-[#00ECBE] mb-3 text-center">
                    🚀 Important Instructions
                  </Badge>
                </div>
              </div>
              
              <div className="p-6 pt-2 space-y-4 overflow-y-auto">
                <div className="flex items-start space-x-3 bg-[#081042] p-3 rounded-lg border border-[#00ECBE]/20">
                  <div className="bg-[#00ECBE]/10 rounded-full p-1 flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-[#00ECBE]" />
                  </div>
                  <p className="text-gray-200 text-sm">
                    Create a new account via the "Start" button for server connection. Our app checks the server to ensure accurate predictions.
                  </p>
                </div>
                
                <div className="flex items-start space-x-3 bg-[#081042] p-3 rounded-lg border border-[#00ECBE]/20">
                  <div className="bg-[#00ECBE]/10 rounded-full p-1 flex-shrink-0 mt-0.5">
                    <AlertTriangle className="h-4 w-4 text-[#00ECBE]" />
                  </div>
                  <p className="text-gray-200 text-sm">
                    Warning: Accounts not created through our link will give incorrect predictions due to server mismatch.
                  </p>
                </div>
                
                <div className="flex items-start space-x-3 bg-[#081042] p-3 rounded-lg border border-[#00ECBE]/20">
                  <div className="bg-[#00ECBE]/10 rounded-full p-1 flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-[#00ECBE]" />
                  </div>
                  <p className="text-gray-200 text-sm">
                    For 100% accurate predictions, use the account created via our URL.
                  </p>
                </div>
                
                {isVerified ? (
                  <div className="bg-[#081042]/70 p-4 rounded-lg border border-[#00ECBE]/40 mb-3">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle className="h-5 w-5 mr-2 text-[#00ECBE]" />
                      <h3 className="text-[#00ECBE] font-semibold text-center">Account Already Verified</h3>
                    </div>
                    <p className="text-gray-200 text-sm text-center">
                      Your Jalwa account (ID: {userId}) is verified. Click "Continue" to access premium predictions.
                    </p>
                  </div>
                ) : registrationStarted && (
                  <div className="bg-[#081042]/70 p-4 rounded-lg border border-[#00ECBE]/40 mb-3">
                    <h3 className="text-[#00ECBE] font-semibold mb-2 text-center">Verify Your Jalwa Account</h3>
                    <p className="text-gray-200 text-sm mb-3">
                      Enter your Jalwa User ID to verify your account registration:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 mb-2">
                      <input
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Enter Jalwa User ID"
                        className="w-full bg-[#05012B] border border-[#00ECBE]/30 rounded px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00ECBE]/50"
                      />
                      <Button
                        onClick={handleVerifyUserID}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto bg-[#00ECBE] text-[#05012B] font-medium hover:bg-[#00ECBE]/90 mt-2 sm:mt-0"
                      >
                        {isSubmitting ? (
                          <>
                            <ArrowRightCircle className="h-4 w-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : "Verify"}
                      </Button>
                    </div>
                    <p className="text-gray-400 text-xs italic">
                      You can find your User ID on your Jalwa profile page after logging in.
                    </p>
                  </div>
                )}

                <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-5 pb-2 mt-3">
                  {!registrationStarted ? (
                    <Button
                      onClick={handleStartClick}
                      className="w-full sm:w-auto transition-all bg-gradient-to-r from-[#00ECBE] to-[#00ECBE]/70 hover:from-[#00ECBE]/90 hover:to-[#00ECBE]/60 text-[#05012B] font-medium py-3 rounded-lg"
                    >
                      <Rocket className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStartClick}
                      className="w-full sm:w-auto transition-all border border-[#00ECBE]/50 bg-transparent hover:bg-[#00ECBE]/10 text-[#00ECBE] py-3 rounded-lg"
                    >
                      <Rocket className="h-4 w-4 mr-2" />
                      Reopen Registration
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleContinueClick}
                    className={`w-full sm:w-auto transition-all py-3 rounded-lg ${
                      isVerified 
                        ? "bg-gradient-to-r from-[#00ECBE] to-[#00ECBE]/70 hover:from-[#00ECBE]/90 hover:to-[#00ECBE]/60 text-[#05012B]"
                        : "bg-gray-700 hover:bg-gray-600 opacity-80 text-white"
                    }`}
                  >
                    {isVerified ? (
                      <>
                        Continue
                        <ArrowRightCircle className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <div className="flex items-center">
                        <Lock className="h-4 w-4 mr-2" />
                        <span>Continue</span>
                      </div>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleHelpClick}
                    variant="outline"
                    className="w-full sm:w-auto border-[#00ECBE]/50 text-[#00ECBE] hover:text-[#00ECBE]/80 hover:bg-[#00ECBE]/10 py-3 rounded-lg"
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Help
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AccountVerificationModal;