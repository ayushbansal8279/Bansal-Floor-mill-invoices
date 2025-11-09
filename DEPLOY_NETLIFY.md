# Deploy to Netlify

This guide will help you deploy your invoice application to Netlify.

## Prerequisites

1. A Netlify account (sign up at [netlify.com](https://www.netlify.com))
2. Your MongoDB connection string
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Code

1. Make sure all changes are committed to your Git repository
2. Push your code to GitHub/GitLab/Bitbucket

## Step 2: Set Up Netlify

### Option A: Deploy via Netlify Dashboard

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git provider (GitHub/GitLab/Bitbucket)
4. Select your repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
6. Click "Deploy site"

### Option B: Deploy via Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize and deploy:
   ```bash
   netlify init
   netlify deploy --prod
   ```

## Step 3: Configure Environment Variables

1. Go to your site in Netlify Dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables:

   ```
   MONGODB_URI=mongodb+srv://bansalayush8279:Ayush%401234@cluster0.jfltuuy.mongodb.net/invoice-app?retryWrites=true&w=majority
   ```

   **Important:** URL encode special characters in your password:
   - `@` becomes `%40`
   - `#` becomes `%23`
   - etc.

4. Click "Save"

## Step 4: Redeploy

After adding environment variables, trigger a new deployment:

1. Go to **Deploys** tab
2. Click "Trigger deploy" → "Clear cache and deploy site"

Or push a new commit to trigger automatic deployment.

## Step 5: Verify Deployment

1. Visit your Netlify site URL (e.g., `https://your-site-name.netlify.app`)
2. Test creating an invoice
3. Check that data is saving to MongoDB

## Troubleshooting

### Functions Not Working

- Check that `netlify/functions` directory exists
- Verify function files are named correctly (`invoices.js`, `items.js`, `companies.js`)
- Check Netlify function logs in the dashboard

### MongoDB Connection Issues

- Verify `MONGODB_URI` environment variable is set correctly
- Check that your MongoDB Atlas IP whitelist allows Netlify's IPs (or use `0.0.0.0/0` for all IPs)
- Ensure your MongoDB password is URL-encoded in the connection string

### Build Errors

- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version (should be 18+)

## Custom Domain (Optional)

1. Go to **Domain settings** in Netlify
2. Click "Add custom domain"
3. Follow the instructions to configure your domain

## Continuous Deployment

Netlify automatically deploys when you push to your main branch. To change this:

1. Go to **Site settings** → **Build & deploy**
2. Configure your build settings and branch

## Support

- [Netlify Documentation](https://docs.netlify.com)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)

