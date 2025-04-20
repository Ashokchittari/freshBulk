const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const setupDatabase = async () => {
  try {
    // Drop existing tables
    await pool.query(`
      DROP TABLE IF EXISTS cart_items CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('Existing tables dropped successfully');

    // Create users table
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        role VARCHAR(20) DEFAULT 'buyer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table created successfully');

    // Create products table
    await pool.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER NOT NULL,
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Products table created successfully');

    // Create orders table
    await pool.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'pending',
        total_amount DECIMAL(10, 2) NOT NULL,
        shipping_address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Orders table created successfully');

    // Create order_items table
    await pool.query(`
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Order items table created successfully');

    // Create cart_items table
    await pool.query(`
      CREATE TABLE cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Cart items table created successfully');

    // Create indexes
    await pool.query(`
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_orders_user_id ON orders(user_id);
      CREATE INDEX idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX idx_order_items_product_id ON order_items(product_id);
      CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
      CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
    `);
    console.log('Indexes created successfully');

    // Insert sample products
    await pool.query(`
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

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    pool.end();
  }
};

setupDatabase(); 