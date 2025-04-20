# Fresh Bulk - E-commerce Platform

A full-stack e-commerce platform built with React, Express, and PostgreSQL, featuring user authentication, product management, shopping cart, and order tracking.

## Features

### User Features
- User registration and authentication
- Product browsing and search
- Shopping cart management
  - Add/remove items
  - Update quantities
  - Real-time stock validation
- Order placement and tracking
- Order history view

### Admin Features
- Product management
  - Add new products
  - Update product details
  - Manage stock levels
- Order management
  - View all orders
  - Update order status
  - Track customer orders
- User management

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Axios for API calls
- React Router for navigation
- Context API for state management

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT for authentication
- Bcrypt for password hashing

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory with the following content:
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/fresh_bulk

# Server Configuration
PORT=5000

# JWT Configuration
JWT_SECRET=your-secret-key-123
```

4. Initialize the database:
```bash
npm run init-db
```

5. Start the server:
```bash
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Test Credentials

### Admin Account
- Email: aschittari@gmail.com
- Password: ashok@123
- Role: admin

### Buyer Account
- Email: ashok123@gmail.com
- Password: ashok@123
- Role: buyer

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login

### Products
- GET /api/products - Get all products
- POST /api/products - Add new product (admin only)
- PUT /api/products/:id - Update product (admin only)
- DELETE /api/products/:id - Delete product (admin only)

### Cart
- GET /api/cart - Get user's cart
- POST /api/cart - Add item to cart
- PUT /api/cart/:itemId - Update cart item quantity
- DELETE /api/cart/:itemId - Remove item from cart

### Orders
- GET /api/orders - Get user's orders (all orders for admin)
- POST /api/orders - Place new order
- PUT /api/orders/:id - Update order status (admin only)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.



