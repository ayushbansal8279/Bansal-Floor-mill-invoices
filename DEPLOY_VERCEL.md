# Deploy to Vercel

This guide will help you deploy your invoice application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your MongoDB connection string
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Code

1. Make sure all changes are committed to your Git repository
2. Push your code to GitHub/GitLab/Bitbucket

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository
4. Configure project:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click "Deploy"

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. For production:
   ```bash
   vercel --prod
   ```

## Step 3: Configure Environment Variables

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:

   ```
   MONGODB_URI=mongodb+srv://bansalayush8279:Ayush%401234@cluster0.jfltuuy.mongodb.net/invoice-app?retryWrites=true&w=majority
   ```

   **Important:** URL encode special characters in your password:
   - `@` becomes `%40`
   - `#` becomes `%23`
   - etc.

4. Select **Production**, **Preview**, and **Development** environments
5. Click "Save"

## Step 4: Redeploy

After adding environment variables, trigger a new deployment:

1. Go to **Deployments** tab
2. Click the three dots (⋯) on the latest deployment
3. Click "Redeploy"

Or push a new commit to trigger automatic deployment.

## Step 5: Verify Deployment

1. Visit your Vercel site URL (e.g., `https://your-project.vercel.app`)
2. Test creating an invoice
3. Check that data is saving to MongoDB

## API Routes

Vercel automatically detects API routes in the `api/` folder:
- `/api/invoices` - Main invoices endpoint
- `/api/invoices/[invoiceNumber]` - Individual invoice operations
- `/api/items` - Items management
- `/api/items/[id]` - Individual item operations
- `/api/companies` - Company autofill

## Troubleshooting

### API Routes Not Working

- Check that files are in the `api/` folder
- Verify function logs in Vercel dashboard
- Check that MongoDB connection string is set correctly

### MongoDB Connection Issues

- Verify `MONGODB_URI` environment variable is set
- Check that your MongoDB Atlas IP whitelist allows Vercel's IPs (or use `0.0.0.0/0` for all IPs)
- Ensure your MongoDB password is URL-encoded in the connection string

### Build Errors

- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version (should be 18+)

## Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow the DNS configuration instructions

## Continuous Deployment

Vercel automatically deploys when you push to your main branch. To change this:

1. Go to **Settings** → **Git**
2. Configure your deployment settings

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)

