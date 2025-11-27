# Railway PostgreSQL Setup Guide for Replay Music Organizer

## Setup Steps

### 1. Add PostgreSQL to your Railway Project

In your Railway project dashboard:
1. Click **"+ New"** button
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Railway will automatically create a PostgreSQL database

### 2. Get Database Connection String

1. Click on your PostgreSQL service in Railway
2. Go to the **"Connect"** tab
3. Copy the `DATABASE_URL` - it looks like:
   ```
   postgresql://postgres:password@host.railway.internal:5432/railway
   ```

### 3. Connect Your App Service to PostgreSQL

1. Click on your app service (zesty-imagination)
2. Go to **"Variables"** tab
3. Add these environment variables:
   - Click **"Add Variable Reference"**
   - Select `DATABASE_URL` from your PostgreSQL service
   - Also add:
     ```
     JWT_SECRET=your-secret-key-here-change-this
     NODE_ENV=production
     VITE_API_URL=/api
     ```

### 4. Initialize Database Schema

Option A: Using Railway's Query Interface
1. Click on your PostgreSQL service
2. Go to the **"Query"** tab
3. Copy and paste the contents of `railway-postgres-schema.sql`
4. Click **"Run Query"**

Option B: Using psql (if you have it installed locally)
```bash
psql $DATABASE_URL < railway-postgres-schema.sql
```

### 5. Deploy

The app will automatically redeploy when you add the environment variables.

## How It Works

### User Isolation
- Each user has a unique ID (UUID)
- All tracks, playlists, and data are linked to the user's ID
- Users can only see and modify their own data
- No data sharing between users

### Data Storage
- User accounts: Stored in PostgreSQL `users` table
- Music metadata: Stored in PostgreSQL `tracks` table
- Audio files: Can be stored as base64 in database (for small files) or use external storage
- Playlists: Stored in PostgreSQL with user association

### Security Features
- Passwords are hashed with bcrypt (never stored in plain text)
- JWT tokens for session management
- Each user's data is completely isolated
- SQL injection protection through parameterized queries

## Environment Variables

Required for production:
- `DATABASE_URL` - PostgreSQL connection string (provided by Railway)
- `JWT_SECRET` - Secret key for JWT tokens (generate a random string)
- `NODE_ENV` - Set to "production"
- `VITE_API_URL` - API endpoint (usually "/api")

## Testing

After setup, test the authentication:
1. Go to your app URL
2. Click "Sign Up" and create a new account
3. Import some music files
4. Sign out and sign in again
5. Verify your music library persists
6. Create another account and verify data isolation

## Troubleshooting

### "Database connection failed"
- Check that DATABASE_URL is properly set in Railway variables
- Ensure PostgreSQL service is running in Railway

### "Cannot create account"
- Check that the database schema has been initialized
- Look at Railway logs for specific error messages

### "Music doesn't save"
- Verify the tracks table exists in PostgreSQL
- Check browser console for API errors

## Benefits of Railway PostgreSQL

✅ **No external dependencies** - Everything runs on Railway
✅ **Automatic backups** - Railway handles database backups
✅ **Private networking** - Database is only accessible from your app
✅ **Easy scaling** - Upgrade database as needed
✅ **Built-in monitoring** - See database metrics in Railway dashboard
✅ **User data isolation** - Each user's music library is completely separate