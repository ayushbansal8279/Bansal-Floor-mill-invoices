# Vercel Deployment Troubleshooting

## Issue: Not Getting Data from MongoDB

### 1. Check Environment Variables

**In Vercel Dashboard:**
1. Go to your project → **Settings** → **Environment Variables**
2. Verify `MONGODB_URI` is set:
   ```
   MONGODB_URI=mongodb+srv://bansalayush8279:Ayush%401234@cluster0.jfltuuy.mongodb.net/invoice-app?retryWrites=true&w=majority
   ```
3. Make sure it's enabled for **Production**, **Preview**, and **Development**
4. **Important:** After adding/updating, you MUST redeploy!

### 2. Check MongoDB Atlas IP Whitelist

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to **Network Access**
3. Click **Add IP Address**
4. Add `0.0.0.0/0` to allow all IPs (or add Vercel's IP ranges)
5. Click **Confirm**

**Note:** For production, it's better to whitelist specific IPs, but `0.0.0.0/0` works for testing.

### 3. Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → **Functions** tab
2. Click on a function (e.g., `api/invoices.js`)
3. Check the **Logs** tab for errors
4. Look for:
   - MongoDB connection errors
   - Environment variable issues
   - Network errors

### 4. Test API Endpoints Directly

Test your API endpoints in the browser or using curl:

```bash
# Test getting all invoices
curl https://your-app.vercel.app/api/invoices

# Test getting last invoice number
curl https://your-app.vercel.app/api/invoices/last-number
```

### 5. Common Issues and Solutions

#### Issue: "MONGODB_URI is not defined"
**Solution:** 
- Set the environment variable in Vercel
- Redeploy after setting it
- Check that the variable name is exactly `MONGODB_URI`

#### Issue: "MongoServerError: IP not whitelisted"
**Solution:**
- Add `0.0.0.0/0` to MongoDB Atlas Network Access
- Wait a few minutes for changes to propagate

#### Issue: "MongooseError: Operation timed out"
**Solution:**
- Check your MongoDB connection string
- Verify database name is correct (`invoice-app`)
- Check MongoDB Atlas cluster is running

#### Issue: "Authentication failed"
**Solution:**
- Verify username and password in connection string
- Make sure password is URL-encoded (`@` → `%40`)
- Check MongoDB user has proper permissions

### 6. Verify Connection String Format

Your connection string should look like:
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Important points:**
- Username and password should be URL-encoded
- `@` in password becomes `%40`
- `#` in password becomes `%23`
- Database name should be `invoice-app`

### 7. Test Locally with Vercel Environment

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Pull environment variables:
   ```bash
   vercel env pull .env.local
   ```

3. Test locally:
   ```bash
   vercel dev
   ```

### 8. Check Browser Console

1. Open your deployed app
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Look for API errors
5. Go to **Network** tab
6. Check API requests and responses

### 9. Verify API Routes Are Working

Check if API routes are accessible:
- `https://your-app.vercel.app/api/invoices` - Should return JSON (empty array if no invoices)
- `https://your-app.vercel.app/api/invoices/last-number` - Should return `{"lastNumber": 0}` or similar

If you get 404 or 500 errors, check:
- Function logs in Vercel dashboard
- API route files exist in `api/` folder
- `vercel.json` is configured correctly

### 10. Debug Steps

1. **Add logging to API routes:**
   Check the API route files (`api/invoices.js`, etc.) - they now have better error logging

2. **Check MongoDB connection:**
   The connection function now logs more details - check Vercel function logs

3. **Test with a simple endpoint:**
   Create a test endpoint to verify MongoDB connection:
   ```javascript
   // api/test.js
   import { connectDB } from '../src/utils/mongodb.js'
   
   export default async function handler(req, res) {
     try {
       await connectDB()
       return res.status(200).json({ connected: true })
     } catch (error) {
       return res.status(500).json({ connected: false, error: error.message })
     }
   }
   ```

### Still Not Working?

1. Check Vercel function logs for detailed error messages
2. Verify MongoDB Atlas cluster is running and accessible
3. Test MongoDB connection string directly using MongoDB Compass or similar tool
4. Check that all dependencies (`mongoose`) are in `package.json`
5. Ensure Node.js version is 18+ (set in `package.json`)

