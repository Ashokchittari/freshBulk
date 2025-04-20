import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MobileMenu = ({ isOpen, onClose, cartCount }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose();
    window.location.href = '/login';
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
        <div className="p-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            aria-label="Close menu"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="mt-8 space-y-4">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <Link
                    to="/admin"
                    className="block px-4 py-2 text-gray-800 hover:bg-green-100 rounded"
                    onClick={onClose}
                  >
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/"
                    className="block px-4 py-2 text-gray-800 hover:bg-green-100 rounded"
                    onClick={onClose}
                  >
                    Products
                  </Link>
                )}
                <Link
                  to="/cart"
                  className="block px-4 py-2 text-gray-800 hover:bg-green-100 rounded"
                  onClick={onClose}
                >
                  Cart ({cartCount})
                </Link>
                <Link
                  to="/orders"
                  className="block px-4 py-2 text-gray-800 hover:bg-green-100 rounded"
                  onClick={onClose}
                >
                  Orders
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-gray-800 hover:bg-green-100 rounded text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-4 py-2 text-gray-800 hover:bg-green-100 rounded"
                  onClick={onClose}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="block px-4 py-2 text-gray-800 hover:bg-green-100 rounded"
                  onClick={onClose}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu; 