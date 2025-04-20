import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MobileMenu from './MobileMenu';

const Navbar = ({ cartCount }) => {
  const { user, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutDialog(false);
    window.location.href = '/login';
  };

  const cancelLogout = () => {
    setShowLogoutDialog(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <nav className="bg-green-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">Fresh Bulk</Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <Link to="/admin" className="hover:text-green-200">Admin Dashboard</Link>
                ) : (
                  <Link to="/" className="hover:text-green-200">Products</Link>
                )}
                <Link to="/cart" className="hover:text-green-200">
                  Cart ({cartCount})
                </Link>
                <Link to="/orders" className="hover:text-green-200">Orders</Link>
                <button
                  onClick={handleLogout}
                  className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-green-200">Login</Link>
                <Link to="/signup" className="hover:text-green-200">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={toggleMobileMenu}
        cartCount={cartCount}
      />

      {/* Logout Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Confirm Logout</h2>
            <p className="mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelLogout}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar; 