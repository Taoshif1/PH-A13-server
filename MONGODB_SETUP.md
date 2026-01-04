# MongoDB Atlas Setup Guide

## Quick Setup (5 minutes):

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Sign up/Login** with your email
3. **Create a free cluster**:
   - Click "Build a Database" → "M0 Cluster" (Free)
   - Choose any provider/region
   - Name your cluster (e.g., "Cluster0")
   - Click "Create Cluster" (takes 1-3 minutes)

4. **Create Database User**:
   - Go to "Database Access" → "Add New Database User"
   - Username: `testuser`
   - Password: `testpass123`
   - Built-in Role: `Read and write any database`
   - Click "Add User"

5. **Whitelist your IP**:
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

6. **Get Connection String**:
   - Go to "Clusters" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string

7. **Update your .env file**:
   Replace this line in `.env`:
   ```
   MONGODB_URI=mongodb+srv://<db_username>:<db_password>@cluster0.kpmcxd4.mongodb.net/?appName=Cluster0
   ```
   With your actual connection string, for example:
   ```
   MONGODB_URI=mongodb+srv://testuser:testpass123@cluster0.xxxxx.mongodb.net/microtask?retryWrites=true&w=majority
   ```

8. **Test the connection**:
   Run `npm run dev` again

## Alternative: Local MongoDB

If you prefer local MongoDB:

1. Download from: https://www.mongodb.com/try/download/community
2. Install and start MongoDB service
3. Use connection string: `mongodb://localhost:27017/microtask`

## Need Help?

- Check MongoDB Atlas documentation
- Ensure your IP is whitelisted
- Verify username/password are correct
- Make sure the cluster is in "running" state</content>
<parameter name="filePath">d:\PH-ASS\PH-A13\PH-A13-server\MONGODB_SETUP.md