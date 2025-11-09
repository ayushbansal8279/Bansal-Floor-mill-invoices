# Google Sheets Integration Setup

This application can automatically save all invoice data to a Google Sheet in parallel with the local JSON file storage.

## Setup Instructions

### Option 1: Service Account (Recommended)

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Sheets API:**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

3. **Create Service Account:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the details and create
   - Click on the created service account
   - Go to "Keys" tab > "Add Key" > "Create new key"
   - Choose JSON format and download

4. **Create and Share Google Sheet:**
   - **Create a new Google Sheet:**
     - Go to [Google Sheets](https://sheets.google.com)
     - Click "Blank" to create a new spreadsheet
     - (Optional) Rename it to "Invoice Data" or any name you prefer
   
   - **Get the Sheet ID:**
     - Look at the URL in your browser
     - The URL will look like: `https://docs.google.com/spreadsheets/d/1ABC123xyz.../edit`
     - Copy the long string between `/d/` and `/edit` - this is your **Sheet ID**
     - Example: If URL is `https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789/edit`
     - Then Sheet ID is: `1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789`
   
   - **Share with Service Account:**
     - Click the "Share" button (top right)
     - In the "Add people and groups" field, paste the service account email
       - (Find this in your downloaded JSON file, look for `"client_email": "something@...iam.gserviceaccount.com"`)
     - Change permission from "Viewer" to "Editor"
     - Click "Send" (you can uncheck "Notify people" if you want)
     - **Important:** The service account email must have Editor access!

5. **Configure the Application:**
   - Rename `src/data/googleSheetsConfig.json.example` to `googleSheetsConfig.json`
   - Place the downloaded service account JSON file in `src/data/` folder
   - Update `googleSheetsConfig.json`:
     ```json
     {
       "spreadsheetId": "YOUR_SHEET_ID_HERE",
       "serviceAccountKey": "your-service-account-key.json",
       "credentials": null
     }
     ```

### Option 2: OAuth2 Credentials

1. **Create OAuth2 Credentials:**
   - Go to Google Cloud Console > "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Desktop app" as application type
   - Download the credentials JSON file

2. **Configure:**
   - Place credentials file in `src/data/` folder
   - Update `googleSheetsConfig.json`:
     ```json
     {
       "spreadsheetId": "YOUR_SHEET_ID_HERE",
       "serviceAccountKey": null,
       "credentials": "your-credentials.json"
     }
     ```

## How It Works

- **Automatic Sync:** Every time an invoice is created, updated, or deleted, it's automatically saved to Google Sheets in parallel
- **Non-Blocking:** Google Sheets operations run asynchronously and won't slow down the application
- **Optional:** If Google Sheets is not configured, the app works normally with just JSON file storage
- **Data Structure:** Invoices are saved with the following columns:
  - Invoice Number, Date, From Company, To Company, To Company (Hindi), To Address, Vehicle
  - Subtotal, Tax Rate (%), Tax Amount, Discount, Total
  - Items Count, Items (JSON), Saved At, Updated At

## Notes

- The first time you save an invoice, the sheet will be automatically created with headers
- If Google Sheets sync fails, it won't affect the local JSON file save
- All errors are logged to the console but don't break the application
- You can view all your invoices in real-time in the Google Sheet

