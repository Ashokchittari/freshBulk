import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Cart = ({ cartItems, onQuantityChange, onRemoveItem, onCheckout }) => {
  const [showAddedToCart, setShowAddedToCart] = useState(false);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [localQuantities, setLocalQuantities] = useState({});

  useEffect(() => {
    const initialQuantities = {};
    cartItems.forEach(item => {
      initialQuantities[item.id] = item.quantity;
    });
    setLocalQuantities(initialQuantities);
  }, [cartItems]);

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      setLoading(true);
      setError('');
      await onQuantityChange(itemId, newQuantity);
      setLocalQuantities(prev => ({
        ...prev,
        [itemId]: newQuantity
      }));
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError(err.message || 'Failed to update quantity');
      setLocalQuantities(prev => ({
        ...prev,
        [itemId]: cartItems.find(item => item.id === itemId)?.quantity || 1
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (itemId, value) => {
    const newQuantity = parseInt(value);
    if (!isNaN(newQuantity) && newQuantity >= 1) {
      setLocalQuantities(prev => ({
        ...prev,
        [itemId]: newQuantity
      }));
    }
  };

  const handleInputBlur = async (itemId) => {
    const newQuantity = localQuantities[itemId];
    if (newQuantity && newQuantity >= 1) {
      await handleQuantityChange(itemId, newQuantity);
    }
  };

  const handleRemove = async (productId) => {
    try {
      setLoading(true);
      setError('');
      await onRemoveItem(productId);
    } catch (err) {
      console.error('Error removing item:', err);
      setError(err.message || 'Failed to remove item');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      setError('Please enter your shipping address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onCheckout(address, paymentMethod);
    } catch (err) {
      console.error('Error during checkout:', err);
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
        <div className="bg-white rounded-lg shadow-md p-8">
          <img
            src="/empty-cart.png"
            alt="Empty Cart"
            className="w-64 h-64 mx-auto mb-4"
          />
          <p className="text-xl text-gray-600">Your cart is empty</p>
          <p className="text-gray-500">Add some products to your cart to see them here</p>
          <Link to="/" className="mt-4 inline-block text-green-600 hover:text-green-500">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-16 w-16 object-cover rounded"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{item.price}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={loading || item.quantity <= 1}
                          className="text-gray-500 hover:text-gray-700 px-2 py-1 border rounded-l"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.stock}
                          value={localQuantities[item.id] || item.quantity}
                          onChange={(e) => handleInputChange(item.id, e.target.value)}
                          onBlur={() => handleInputBlur(item.id)}
                          className="w-16 px-2 py-1 border-t border-b text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={loading || item.quantity >= item.stock}
                          className="text-gray-500 hover:text-gray-700 px-2 py-1 border rounded-r"
                        >
                          +
                        </button>
                      </div>
                      {item.quantity > item.stock && (
                        <p className="text-red-500 text-xs mt-1">
                          Only {item.stock} items available
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{item.price * item.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleRemove(item.product_id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>₹{calculateTotal()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{calculateTotal()}</span>
              </div>
            </div>

            <form onSubmit={handleCheckout}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                  Shipping Address
                </label>
                <textarea
                  id="address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="payment">
                  Payment Method
                </label>
                <select
                  id="payment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash on Delivery</option>
                  <option value="card">Credit/Debit Card</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 rounded text-white ${
                  loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {showAddedToCart && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          Added to Cart!
        </div>
      )}
    </div>
  );
};

export default Cart; 