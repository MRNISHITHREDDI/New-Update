import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jalwaLogo from '../assets/jalwa-logo.png';
import JoinProModal from './JoinProModal';
import GiftCodeModal from './GiftCodeModal';
import { useAdminAuth } from '@/hooks/use-admin-auth';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [joinProModalOpen, setJoinProModalOpen] = useState(false);
  const [giftCodeModalOpen, setGiftCodeModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAdminAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const openJoinProModal = () => {
    setJoinProModalOpen(true);
  };
  
  const openGiftCodeModal = () => {
    setGiftCodeModalOpen(true);
  };

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-gradient-to-b from-[#001c54]/95 to-[#000c33]/95 backdrop-blur-sm shadow-lg py-2" 
          : "bg-gradient-to-b from-[#001c54] to-[#000c33] py-2"
      }`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between items-center ${scrolled ? 'h-12' : 'h-14'} transition-all duration-300`}>
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <motion.img 
                  src={jalwaLogo} 
                  alt="Jalwa Games" 
                  className={`transition-all duration-300 ${scrolled ? 'h-7' : 'h-8'}`}
                  whileHover={{ scale: 1.05 }} 
                  transition={{ duration: 0.2 }}
                />
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button 
                type="button" 
                onClick={toggleMenu}
                className="text-[#00ECBE] hover:text-white focus:outline-none"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a 
                href="/" 
                className="text-[#00ECBE] hover:text-white transition duration-300"
                onClick={(e) => {
                  e.preventDefault();
                  if (window.location.pathname === '/') {
                    // If already on home page, just scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    // Navigate to home page
                    setLocation('/');
                    // Scroll to top after navigation
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 100);
                  }
                }}
              >
                Home
              </a>
              <a 
                href="#prediction" 
                className="text-[#00ECBE] hover:text-white transition duration-300"
                onClick={(e) => {
                  e.preventDefault();
                  // If we're on the home page, scroll to the prediction section
                  if (window.location.pathname === '/') {
                    document.getElementById('prediction')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    // If we're on another page, go to home page and then scroll
                    setLocation('/');
                    // Timeout needed to let the page load before scrolling
                    setTimeout(() => {
                      document.getElementById('prediction')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                }}
              >
                Prediction
              </a>
              <a 
                href="#" 
                className="text-[#00ECBE] hover:text-white transition duration-300 flex items-center"
                onClick={(e) => {
                  e.preventDefault();
                  openGiftCodeModal();
                }}
              >
                <Gift size={16} className="mr-1" />
                Gift Code
              </a>
              {isAuthenticated && (
                <Link 
                  href="/admin" 
                  className="text-[#00ECBE] hover:text-white transition duration-300"
                >
                  Admin
                </Link>
              )}
              <motion.button 
                onClick={openJoinProModal}
                className="hidden md:flex items-center bg-gradient-to-r from-[#001c54] to-[#000c33] border border-[#00ECBE] text-[#00ECBE] px-4 py-1.5 rounded-full transition duration-300 relative overflow-hidden group text-sm"
                whileHover={{ 
                  boxShadow: '0 0 20px 0 rgba(0, 236, 190, 0.6)',
                  y: -2,
                }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#00ECBE]/10 to-transparent w-0 group-hover:w-full transition-all duration-700"></span>
                <span className="relative font-medium">Join Pro</span>
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00ECBE] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></span>
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`md:hidden py-2 px-4 ${
                scrolled 
                  ? "bg-gradient-to-b from-[#001c54]/95 to-[#000c33]/95 backdrop-blur-sm" 
                  : "bg-gradient-to-b from-[#001c54] to-[#000c33]"
              }`}
            >
              <a 
                href="/"
                className="block text-[#00ECBE] py-2"
                onClick={() => {
                  setMobileMenuOpen(false);
                }}
              >
                Home
              </a>
              <a 
                href="/#prediction"
                className="block text-[#00ECBE] py-2"
                onClick={() => {
                  setMobileMenuOpen(false);
                }}
              >
                Prediction
              </a>
              <a 
                href="#"
                className="block text-[#00ECBE] py-2 flex items-center"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  openGiftCodeModal();
                }}
              >
                <Gift size={16} className="mr-1" />
                Gift Code
              </a>
              {isAuthenticated && (
                <Link
                  href="/admin"
                  className="block text-[#00ECBE] py-2"
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                >
                  Admin
                </Link>
              )}
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  openJoinProModal();
                }}
                className="mt-2 w-full bg-gradient-to-b from-[#001c54] to-[#000c33] border border-[#00ECBE] text-[#00ECBE] px-4 py-2 rounded-full transition duration-300"
              >
                Join Pro
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      
      {/* Join Pro Modal */}
      <JoinProModal 
        isOpen={joinProModalOpen}
        onClose={() => setJoinProModalOpen(false)}
      />

      {/* Gift Code Modal */}
      <GiftCodeModal
        isOpen={giftCodeModalOpen}
        onClose={() => setGiftCodeModalOpen(false)}
      />
    </>
  );
};

export default Navbar;