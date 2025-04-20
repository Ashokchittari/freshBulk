require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require('pg');
const path = require('path');

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Configure CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json());

// Initialize database
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        mobile TEXT NOT NULL,
        role TEXT DEFAULT 'buyer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        status TEXT DEFAULT 'pending',
        total_amount DECIMAL(10, 2) NOT NULL,
        shipping_address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
      CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
    `);

    // Insert sample products if none exist
    const productsExist = await client.query('SELECT COUNT(*) FROM products');
    if (parseInt(productsExist.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO products (name, description, price, stock, image_url) VALUES
        ('Organic Tomatoes', 'Fresh, locally grown organic tomatoes', 20.00, 100, 'https://source.unsplash.com/featured/?tomatoes'),
        ('Fresh Carrots', 'Sweet and crunchy organic carrots', 15.00, 80, 'https://source.unsplash.com/featured/?carrots'),
        ('Potatoes', 'Farm-fresh potatoes perfect for any dish', 10.00, 120, 'https://source.unsplash.com/featured/?potatoes'),
        ('Broccoli', 'Nutritious and fresh broccoli heads', 25.00, 60, 'https://source.unsplash.com/featured/?broccoli'),
        ('Spinach', 'Organic baby spinach leaves', 18.00, 75, 'https://source.unsplash.com/featured/?spinach'),
        ('Bell Peppers', 'Colorful mix of fresh bell peppers', 22.00, 90, 'https://source.unsplash.com/featured/?bellpeppers'),
        ('Onions', 'Fresh yellow onions', 12.00, 150, 'https://source.unsplash.com/featured/?onions'),
        ('Garlic', 'Fresh garlic bulbs', 8.00, 200, 'https://source.unsplash.com/featured/?garlic')
      `);
      console.log('Sample products inserted successfully');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    client.release();
  }
}

initializeDatabase();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-123', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  next();
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, email, password, mobile, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !mobile) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate role
    if (!['admin', 'buyer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await client.query(
      'INSERT INTO users (name, email, password, mobile, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
      [name, email, hashedPassword, mobile, role]
    );
    
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'your-secret-key-123');
    
    res.json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === '23505') { // PostgreSQL unique violation
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  } finally {
    client.release();
  }
});

app.post('/api/auth/login', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password, role } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user's role matches the requested role
    if (role && user.role !== role) {
      return res.status(403).json({ error: `Access denied. You are not authorized as ${role}` });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'your-secret-key-123'
    );
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  } finally {
    client.release();
  }
});

// Product Routes
app.get('/api/products', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.post('/api/products', authenticateToken, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, price, stock, image_url } = req.body;
    const result = await client.query(
      'INSERT INTO products (name, price, stock, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, price, stock, image_url]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.put('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name, price, stock, image_url } = req.body;
    const result = await client.query(
      'UPDATE products SET name = $1, price = $2, stock = $3, image_url = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, price, stock, image_url, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.delete('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Order Routes
app.post('/api/orders', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { items, address, payment_method } = req.body;
    const total_amount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, status, shipping_address, total_amount) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, 'pending', address, total_amount]
    );
    
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderResult.rows[0].id, item.id, item.quantity, item.price]
      );
      
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.id]
      );
    }
    
    await client.query('COMMIT');
    res.json(orderResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    let query = `
      SELECT o.*, 
             u.name as customer_name,
             json_agg(json_build_object(
               'id', oi.id,
               'product_id', oi.product_id,
               'quantity', oi.quantity,
               'price', oi.price,
               'name', p.name,
               'image_url', p.image_url
             )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN users u ON o.user_id = u.id
    `;

    // If user is not admin, only show their own orders
    if (req.user.role !== 'admin') {
      query += ` WHERE o.user_id = $1`;
    }

    query += ` GROUP BY o.id, u.name ORDER BY o.created_at DESC`;

    const result = await client.query(
      query,
      req.user.role !== 'admin' ? [req.user.id] : []
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  } finally {
    client.release();
  }
});

app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const orderResult = await client.query(`
      SELECT o.*, u.name as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `, [id]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const itemsResult = await client.query(`
      SELECT oi.*, p.name, p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [id]);
    
    res.json({ ...order, items: itemsResult.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.put('/api/orders/:id', authenticateToken, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await client.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Cart Routes
app.get('/api/cart', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT c.*, p.name, p.price, p.image_url 
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
    `, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart items' });
  } finally {
    client.release();
  }
});

app.post('/api/cart', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { productId, quantity } = req.body;
    
    // Check if product exists
    const productResult = await client.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if item already exists in cart
    const existingItem = await client.query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.user.id, productId]
    );

    if (existingItem.rows.length > 0) {
      // Update quantity if item exists
      await client.query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3',
        [quantity, req.user.id, productId]
      );
    } else {
      // Add new item to cart
      await client.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
        [req.user.id, productId, quantity]
      );
    }

    res.json({ message: 'Item added to cart successfully' });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  } finally {
    client.release();
  }
});

app.put('/api/cart/:itemId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    // Validate quantity
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    // Check if cart item exists and belongs to user
    const cartItemResult = await client.query(
      `SELECT ci.*, p.stock 
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = $1 AND ci.user_id = $2`,
      [itemId, req.user.id]
    );

    if (cartItemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const cartItem = cartItemResult.rows[0];

    // Check if quantity exceeds product stock
    if (quantity > cartItem.stock) {
      return res.status(400).json({ 
        error: `Quantity cannot exceed available stock (${cartItem.stock})` 
      });
    }

    // Update quantity
    await client.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3',
      [quantity, itemId, req.user.id]
    );

    res.json({ message: 'Cart item quantity updated successfully' });
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    res.status(500).json({ error: 'Failed to update cart item quantity' });
  } finally {
    client.release();
  }
});

app.delete('/api/cart/:productId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { productId } = req.params;

    // Check if item exists in cart
    const existingItem = await client.query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.user.id, productId]
    );

    if (existingItem.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    // Delete item from cart
    await client.query(
      'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.user.id, productId]
    );

    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 