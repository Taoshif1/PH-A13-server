# Micro-Task Platform - Server

Backend API for the Micro-Task and Earning Platform built with Node.js, Express, and MongoDB.

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
CLIENT_URL=http://localhost:5173
```

### 3. Run the Server
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

## 📁 Project Structure

```
PH-A13-server/
├── config/
│   └── db.js                 # MongoDB connection
├── models/
│   ├── User.js              # User schema
│   ├── Task.js              # Task schema
│   ├── Submission.js        # Submission schema
│   ├── Payment.js           # Payment schema
│   ├── Withdrawal.js        # Withdrawal schema
│   └── Notification.js      # Notification schema
├── middleware/
│   ├── verifyToken.js       # JWT verification
│   ├── verifyAdmin.js       # Admin authorization
│   ├── verifyWorker.js      # Worker authorization
│   └── verifyBuyer.js       # Buyer authorization
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   ├── userRoutes.js        # User management routes
│   ├── taskRoutes.js        # Task CRUD routes
│   ├── submissionRoutes.js  # Submission routes
│   ├── paymentRoutes.js     # Payment routes
│   ├── withdrawalRoutes.js  # Withdrawal routes
│   └── notificationRoutes.js # Notification routes
└── index.js                 # Main server file
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register-or-login` - Register new user or login existing
- `GET /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users/me` - Get current user info
- `GET /api/users/top-workers` - Get top 6 workers (public)
- `GET /api/users/all` - Get all users (Admin)
- `PATCH /api/users/:id/role` - Update user role (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)
- `GET /api/users/stats/admin` - Get admin statistics (Admin)

### Tasks
- `POST /api/tasks/add` - Create new task (Buyer)
- `GET /api/tasks/available` - Get all available tasks (Worker)
- `GET /api/tasks/:id` - Get single task
- `GET /api/tasks/buyer/my-tasks` - Get buyer's tasks (Buyer)
- `GET /api/tasks/buyer/stats` - Get buyer statistics (Buyer)
- `PATCH /api/tasks/:id` - Update task (Buyer)
- `DELETE /api/tasks/:id` - Delete task (Buyer)
- `GET /api/tasks/admin/all-tasks` - Get all tasks (Admin)
- `DELETE /api/tasks/admin/:id` - Delete any task (Admin)

### Submissions
- `POST /api/submissions/submit` - Submit task (Worker)
- `GET /api/submissions/my-submissions` - Get worker submissions with pagination (Worker)
- `GET /api/submissions/approved` - Get approved submissions (Worker)
- `GET /api/submissions/worker/stats` - Get worker statistics (Worker)
- `GET /api/submissions/buyer/pending` - Get pending submissions (Buyer)
- `PATCH /api/submissions/:id/approve` - Approve submission (Buyer)
- `PATCH /api/submissions/:id/reject` - Reject submission (Buyer)

### Payments
- `POST /api/payments/create-payment-intent` - Create Stripe payment intent (Buyer)
- `POST /api/payments/confirm-payment` - Confirm payment and add coins (Buyer)
- `GET /api/payments/history` - Get payment history (Buyer)
- `GET /api/payments/admin/all` - Get all payments (Admin)

### Withdrawals
- `POST /api/withdrawals/request` - Create withdrawal request (Worker)
- `GET /api/withdrawals/my-withdrawals` - Get worker withdrawals (Worker)
- `GET /api/withdrawals/admin/pending` - Get pending withdrawals (Admin)
- `GET /api/withdrawals/admin/all` - Get all withdrawals (Admin)
- `PATCH /api/withdrawals/:id/approve` - Approve withdrawal (Admin)
- `PATCH /api/withdrawals/:id/reject` - Reject withdrawal (Admin)

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## 🔐 Authentication & Authorization

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Role-Based Access:
- **Worker**: Can view tasks, submit work, withdraw earnings
- **Buyer**: Can create tasks, review submissions, purchase coins
- **Admin**: Full access to manage users, tasks, and withdrawals

## 💾 Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  photoURL: String,
  role: Enum ['Worker', 'Buyer', 'Admin'],
  coin: Number,
  firebaseUID: String (unique)
}
```

### Task Model
```javascript
{
  task_title: String,
  task_detail: String,
  task_image_url: String,
  required_workers: Number,
  payable_amount: Number,
  completion_date: Date,
  submission_info: String,
  buyer_email: String,
  buyer_name: String
}
```

### Submission Model
```javascript
{
  task_id: ObjectId,
  task_title: String,
  payable_amount: Number,
  worker_email: String,
  worker_name: String,
  buyer_email: String,
  buyer_name: String,
  submission_details: String,
  status: Enum ['pending', 'approved', 'rejected'],
  submission_date: Date
}
```

## 🛠️ Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Stripe** - Payment processing
- **Cors** - Cross-origin resource sharing

## 📝 Important Notes

1. **Coin System**:
   - Workers: Start with 10 coins
   - Buyers: Start with 50 coins
   - Buyers purchase: 10 coins = $1
   - Workers withdraw: 20 coins = $1
   - Minimum withdrawal: 200 coins ($10)

2. **Task Workflow**:
   - Buyer creates task → Coins deducted
   - Worker submits → Pending status
   - Buyer approves → Worker gets coins, required_workers decreases
   - Buyer rejects → required_workers increases

3. **Notifications**: Automatically created for:
   - New submissions (to Buyer)
   - Approved/Rejected submissions (to Worker)
   - Withdrawal approvals (to Worker)

## 🚀 Deployment

For deployment, update these in `.env`:
- Set `NODE_ENV=production`
- Use production MongoDB URI
- Set proper `CLIENT_URL`
- Use production Stripe keys

## 📧 Contact

For issues or questions, contact the development team.