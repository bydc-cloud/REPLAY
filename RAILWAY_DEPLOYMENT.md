# Railway Deployment Instructions for Replay

## Setup Overview
This app has two separate Railway services:
1. **Frontend (React/Vite)** - The web UI
2. **API (Node.js/Express)** - Backend authentication and data

## API Service Configuration

### 1. In Railway Dashboard for API Service:

Navigate to your API service settings and configure:

**Build Settings:**
- Root Directory: `api`
- Build Command: `npm install`
- Start Command: `npm start`

**Environment Variables (Required):**
```
DATABASE_URL=<your-railway-postgresql-url>
JWT_SECRET=<generate-a-secure-random-string>
NODE_ENV=production
FRONTEND_URL=https://replay-production-9240.up.railway.app
```

### 2. Generate JWT Secret:
```bash
# Run this in terminal to generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Get Database URL:
- Go to your PostgreSQL service in Railway
- Copy the `DATABASE_URL` from the Connect tab
- It should look like: `postgresql://user:pass@host:port/database`

## Frontend Service Configuration

### 1. In Railway Dashboard for Frontend Service:

**Build Settings:**
- Root Directory: `/` (leave empty or set to root)
- Build Command: `npm run build`
- Start Command: `npm run preview -- --port $PORT --host`

**Environment Variables:**
```
VITE_API_URL=https://sublime-light-production-53e3.up.railway.app/api
```

Replace the URL with your actual API service URL from Railway.

## Deployment Steps

1. **Deploy API First:**
   - Push code to GitHub
   - Railway will auto-deploy
   - Check logs: Should see "✅ Database connected successfully"
   - Visit API URL to verify: `https://your-api-url.railway.app/`
   - Should see JSON response with API info

2. **Deploy Frontend:**
   - Ensure VITE_API_URL points to your API service
   - Push code and let Railway auto-deploy
   - Visit frontend URL to test

## Troubleshooting

### API Returns 502 Error:
- Check Railway logs for the API service
- Verify DATABASE_URL is set correctly
- Ensure `api` is set as root directory
- Check that `package.json` exists in `api` folder

### CORS Errors:
- API allows all origins in production
- Check that VITE_API_URL doesn't have trailing slash
- Verify API is running (check health endpoint)

### Authentication Not Working:
- Check browser console for errors
- Verify JWT_SECRET is set in API environment
- Check Network tab for API response codes
- Clear localStorage and try again

### Database Connection Issues:
- Verify DATABASE_URL is correct
- Check PostgreSQL service is running in Railway
- Look for connection logs in API service

## Testing Endpoints

### Health Check:
```bash
curl https://your-api-url.railway.app/api/health
```

### Create Test Account:
```bash
curl -X POST https://your-api-url.railway.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","username":"Test User"}'
```

## Mobile Access
The app is configured for mobile with:
- Responsive viewport settings
- PWA capabilities for iOS
- Touch-optimized UI
- Mobile-friendly authentication

Test on mobile by visiting your frontend URL on a phone browser.

## Local Development
For local testing with Railway services:

1. Create `.env` in root:
```
VITE_API_URL=http://localhost:3001/api
```

2. Create `api/.env`:
```
DATABASE_URL=<your-railway-postgresql-url>
JWT_SECRET=<same-as-production>
PORT=3001
```

3. Run locally:
```bash
# Terminal 1 - API
cd api && npm install && npm start

# Terminal 2 - Frontend
npm run dev
```