import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';

interface GiftCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Optimized animations for better performance
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

const GiftCodeModal: React.FC<GiftCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [giftCode, setGiftCode] = useState("Loading...");
  const { toast } = useToast();
  
  // Fetch the gift code when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetch('/api/gift-code')
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setGiftCode(data.data.giftCode);
          } else {
            setGiftCode("Error loading gift code");
            toast({
              title: "Error",
              description: "Failed to load gift code",
              variant: "destructive",
              duration: 3000,
            });
          }
        })
        .catch(error => {
          console.error("Error fetching gift code:", error);
          setGiftCode("Error loading gift code");
          toast({
            title: "Error",
            description: "Failed to load gift code",
            variant: "destructive",
            duration: 3000,
          });
        });
    }
  }, [isOpen, toast]);
  
  // Prevent clicks inside the modal from closing it
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(giftCode).then(() => {
      setCopied(true);
      toast({
        title: "Gift Code Copied!",
        description: "The code has been copied to your clipboard.",
        duration: 3000,
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }).catch(err => {
      toast({
        title: "Failed to copy",
        description: "Please try copying manually.",
        variant: "destructive",
        duration: 3000,
      });
    });
  };

  const handleRegisterClick = () => {
    window.open('https://www.jalwa.vip/#/register?invitationCode=327361287589', '_blank');
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
            className="bg-gradient-to-b from-[#001c54] to-[#000c33] rounded-2xl max-w-md w-full border border-[#00ECBE]/30 shadow-[0_0_25px_rgba(0,236,190,0.3)] my-auto"
            {...modalAnimation}
            onClick={handleModalClick}
          >
            <div className="flex justify-between items-center p-5 border-b border-[#00ECBE]/20">
              <h3 className="text-[#00ECBE] text-xl font-bold tracking-wide">JALWA GIFT CODE</h3>
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-[#00ECBE]/10"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5">
              <div className="flex items-center justify-between bg-[#05012B]/70 border border-[#00ECBE]/30 rounded-lg p-3 mb-5">
                <code className="text-white font-mono text-sm md:text-base overflow-auto whitespace-nowrap max-w-[calc(100%-40px)]">
                  {giftCode}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="text-[#00ECBE] hover:text-white transition-colors p-1.5 rounded-full hover:bg-[#00ECBE]/10 ml-2 flex-shrink-0"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
              
              <div className="space-y-4 text-center">
                <p className="text-white text-sm md:text-base">
                  Register Jalwa game and claim gift code for free daily from here.
                </p>
                <p className="text-[#00ECBE] text-sm font-medium">
                  Note: Only Our members can claim this code.
                </p>
                
                <div className="pt-2 flex flex-col space-y-3">
                  <Button
                    onClick={handleRegisterClick}
                    className="bg-[#00ECBE] text-[#05012B] hover:bg-[#00ECBE]/90 font-semibold"
                  >
                    Register Now
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="border-[#00ECBE]/50 text-[#00ECBE] hover:bg-[#00ECBE]/10"
                  >
                    Got It
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GiftCodeModal;