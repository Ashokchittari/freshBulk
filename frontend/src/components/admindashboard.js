import React, { useState } from 'react';
import axios from 'axios';

const AdminDashboard = ({ orders, products, onStatusChange, onAddProduct, onUpdateProduct }) => {
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onAddProduct(newProduct);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        stock: '',
        image: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (productId, newStock) => {
    setLoading(true);
    setError('');
    try {
      await onUpdateProduct(productId, { stock: newStock });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setLoading(true);
    setError('');
    try {
      await onStatusChange(orderId, newStatus);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Add Product Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
          <form onSubmit={handleAddProduct}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Description</label>
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Price</label>
              <input
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Stock</label>
              <input
                type="number"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Image URL</label>
              <input
                type="text"
                value={newProduct.image}
                onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Product'}
            </button>
          </form>
        </div>

        {/* Product Management */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Manage Products</h2>
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="border p-4 rounded">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-gray-600">Stock: {product.stock}</p>
                <div className="mt-2">
                  <input
                    type="number"
                    placeholder="New stock quantity"
                    className="p-2 border rounded mr-2"
                    onChange={(e) => handleUpdateStock(product.id, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Orders</h2>
        <div className="space-y-4">
          {Array.isArray(orders) && orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="border p-4 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Order #{order.id}</p>
                    <p className="text-gray-600">Customer: {order.customer_name}</p>
                    <p className="text-gray-600">Status: {order.status}</p>
                    <p className="text-gray-600">Total: ${order.total}</p>
                  </div>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="p-2 border rounded"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="mt-2">
                  <h4 className="font-semibold">Items:</h4>
                  <ul className="list-disc list-inside">
                    {order.items && order.items.map((item) => (
                      <li key={item.id}>
                        {item.name} - {item.quantity} x ${item.price}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No orders found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 