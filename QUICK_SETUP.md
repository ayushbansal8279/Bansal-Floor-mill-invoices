# Quick Google Sheets Setup Guide

## Step-by-Step Instructions

### 1. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **"Blank"** to create a new spreadsheet
3. (Optional) Rename it to "Invoice Data" or any name you like
4. **Copy the Sheet ID from the URL:**
   - Look at the URL bar in your browser
   - The URL looks like: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit`
   - Copy the long string between `/d/` and `/edit`
   - **Example:** 
     - URL: `https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789/edit`
     - Sheet ID: `1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789`

### 2. Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 3. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in:
   - Service account name: "Invoice App" (or any name)
   - Click "Create and Continue"
   - Skip optional steps, click "Done"
4. Click on the created service account
5. Go to "Keys" tab > "Add Key" > "Create new key"
6. Choose **JSON** format
7. Download the file (it will be named something like `your-project-12345-abcde.json`)

### 4. Share Sheet with Service Account

1. Open your Google Sheet
2. Click **"Share"** button (top right)
3. In the "Add people and groups" field, paste the service account email
   - Find this in the downloaded JSON file
   - Look for: `"client_email": "something@your-project.iam.gserviceaccount.com"`
   - Copy that entire email address
4. Change permission from "Viewer" to **"Editor"**
5. Click "Send" (you can uncheck "Notify people")
6. **Important:** The service account must have Editor access!

### 5. Configure the Application

1. Place the downloaded JSON key file in `src/data/` folder
   - Example: `src/data/invoice-app-key.json`

2. Create `src/data/googleSheetsConfig.json`:
   ```json
   {
     "spreadsheetId": "YOUR_SHEET_ID_HERE",
     "serviceAccountKey": "invoice-app-key.json",
     "credentials": null
   }
   ```
   - Replace `YOUR_SHEET_ID_HERE` with the Sheet ID you copied in Step 1
   - Replace `invoice-app-key.json` with your actual JSON key filename

3. Restart the development server:
   ```bash
   npm run dev
   ```

### 6. Test It

1. Create a new invoice in the app
2. Check your Google Sheet - you should see the invoice data appear automatically!
3. The sheet will have these columns:
   - Invoice Number, Date, From Company, To Company, etc.
   - All invoice data will sync automatically

## Troubleshooting

**Sheet not updating?**
- Check that the service account email has "Editor" permission
- Verify the Sheet ID is correct in `googleSheetsConfig.json`
- Check the console for error messages

**Can't find service account email?**
- Open the downloaded JSON file
- Look for the `client_email` field
- Copy that entire email address

**Sheet ID not working?**
- Make sure you copied the ID between `/d/` and `/edit` in the URL
- Don't include any slashes or extra characters

## That's It!

Once configured, all invoices will automatically sync to your Google Sheet. You can view, edit, or share the sheet just like any other Google Sheet!

