# Fresh Bulk Backend

This is the backend API for the Fresh Bulk e-commerce application, built with Node.js, Express, and PostgreSQL.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

4. Set up the database:
   - Create a PostgreSQL database
   - Run the SQL commands from `schema.sql` to create the necessary tables

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 5000).

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login and get JWT token

### Products
- GET `/api/products` - Get all products
- GET `/api/products/:id` - Get a specific product
- POST `/api/products` - Create a new product (Admin only)
- PUT `/api/products/:id` - Update a product (Admin only)
- DELETE `/api/products/:id` - Delete a product (Admin only)

### Orders
- GET `/api/orders` - Get all orders (Admin only)
- GET `/api/orders/user` - Get user's orders
- POST `/api/orders` - Create a new order
- PUT `/api/orders/:id/status` - Update order status (Admin only)

## Security

- JWT-based authentication
- Password hashing using bcrypt
- Role-based access control
- CORS enabled for frontend integration



