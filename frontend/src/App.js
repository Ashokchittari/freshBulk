import './tailwind.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/navbar';
import ProductCatalog from './components/productcatalog';
import Cart from './components/cart';
import TrackOrder from './components/trackorder';
import AdminDashboard from './components/admindashboard';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import { AuthProvider, useAuth } from './context/AuthContext';
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:5000';
axios.defaults.headers.common['Content-Type'] = 'application/json';

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (user) {
    return <Navigate to="/" />;
  }

  return children;
};

const AppContent = () => {
  const { user, token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get('/api/orders', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders');
    }
  };

  const fetchCartItems = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get('/api/cart', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCartItems(response.data);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to fetch cart items');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (token) {
      fetchCartItems();
      fetchOrders();
    } else {
      setCartItems([]);
      setOrders([]);
    }
  }, [token]);

  const handleQuantityChange = async (itemId, newQuantity) => {
    try {
      const response = await axios.put(
        `/api/cart/${itemId}`,
        { quantity: newQuantity },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      await fetchCartItems();
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      throw new Error(error.response?.data?.error || 'Failed to update quantity');
    }
  };

  const handleRemoveFromCart = async (productId) => {
    try {
      await axios.delete(`/api/cart/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      await fetchCartItems();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw new Error(error.response?.data?.error || 'Failed to remove item from cart');
    }
  };

  const handleCheckout = async (address, paymentMethod) => {
    try {
      const response = await axios.post(
        '/api/orders',
        {
          items: cartItems.map(item => ({
            id: item.product_id,
            quantity: item.quantity,
            price: item.price
          })),
          address: address,
          payment_method: paymentMethod
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Clear the cart items from state
      setCartItems([]);
      await fetchOrders();
      window.location.href = '/orders';
    } catch (err) {
      console.error('Error placing order:', err);
      throw new Error(err.response?.data?.error || 'Failed to place order');
    }
  };

  const handleAddToCart = async (productId) => {
    if (!token) return;
    
    try {
      await axios.post(
        '/api/cart',
        { productId, quantity: 1 },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      await fetchCartItems();
    } catch (err) {
      console.error('Error adding to cart:', err);
      throw new Error(err.response?.data?.error || 'Failed to add item to cart');
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      await axios.post(
        '/api/products',
        productData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      await fetchProducts();
    } catch (err) {
      console.error('Error adding product:', err);
      throw new Error(err.response?.data?.error || 'Failed to add product');
    }
  };

  const handleUpdateProduct = async (productId, updateData) => {
    try {
      await axios.put(
        `/api/products/${productId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      await fetchProducts();
    } catch (err) {
      console.error('Error updating product:', err);
      throw new Error(err.response?.data?.error || 'Failed to update product');
    }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(
        `/api/orders/${orderId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      await fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      throw new Error(err.response?.data?.error || 'Failed to update order status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar cartCount={cartItems.length} />
      <main className="flex-grow">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-xl">Loading...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-xl text-red-600">Error: {error}</div>
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } />
            <Route path="/" element={
              <PrivateRoute>
                <ProductCatalog 
                  products={products} 
                  onAddToCart={handleAddToCart}
                />
              </PrivateRoute>
            } />
            <Route path="/cart" element={
              <PrivateRoute>
                <Cart 
                  cartItems={cartItems}
                  onQuantityChange={handleQuantityChange}
                  onRemoveItem={handleRemoveFromCart}
                  onCheckout={handleCheckout}
                />
              </PrivateRoute>
            } />
            <Route path="/orders" element={
              <PrivateRoute>
                <TrackOrder orders={orders} />
              </PrivateRoute>
            } />
            <Route path="/admin" element={
              <PrivateRoute requiredRole="admin">
                <AdminDashboard 
                  orders={orders}
                  products={products}
                  onStatusChange={handleOrderStatusChange}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                />
              </PrivateRoute>
            } />
          </Routes>
        )}
      </main>
      <footer className="bg-green-100 text-center p-4 text-sm text-gray-600">
        © {new Date().getFullYear()} Ashok chittari. All rights reserved.
      </footer>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
