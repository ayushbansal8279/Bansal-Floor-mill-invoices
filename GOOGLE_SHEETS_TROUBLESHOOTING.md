# Google Sheets Troubleshooting Guide

## Issue: Data not saving to Google Sheets

If invoices are saving to JSON files but NOT to Google Sheets, check the following:

### 1. Check Configuration File

Open `src/data/googleSheetsConfig.json` and verify:

```json
{
  "spreadsheetId": "YOUR_SHEET_ID",
  "serviceAccountKey": "your-key-file.json",
  "credentials": null
}
```

**Common Issues:**
- ❌ `serviceAccountKey` is `null` → **This is the problem!**
- ❌ `spreadsheetId` is missing or incorrect
- ❌ Key file name doesn't match the actual file

### 2. Verify Service Account Key File Exists

1. Check if the key file is in `src/data/` folder
2. The filename must match exactly what's in `googleSheetsConfig.json`
3. Example: If config says `"serviceAccountKey": "invoice-key.json"`, then `src/data/invoice-key.json` must exist

### 3. Check Console Logs

When you create an invoice, check the terminal/console for messages:
- ✅ `"Google Sheets not configured"` → Missing serviceAccountKey
- ✅ `"Google Sheets service account key file not found"` → File path is wrong
- ✅ `"Error saving invoice to Google Sheets"` → Authentication or permission issue

### 4. Verify Google Sheet Sharing

1. Open your Google Sheet
2. Click "Share" button
3. Verify the service account email has **Editor** permission
4. The service account email is in your JSON key file: `"client_email": "xxx@xxx.iam.gserviceaccount.com"`

### 5. Quick Setup Checklist

- [ ] Google Cloud project created
- [ ] Google Sheets API enabled
- [ ] Service account created
- [ ] JSON key file downloaded
- [ ] Key file placed in `src/data/` folder
- [ ] `googleSheetsConfig.json` updated with key filename
- [ ] Google Sheet shared with service account email (Editor permission)
- [ ] Sheet ID is correct in config file
- [ ] Development server restarted after config changes

### 6. Test the Connection

After setting up, create a test invoice and check:
1. Terminal console for any error messages
2. Google Sheet for new data (may take a few seconds)
3. If still not working, check the exact error message in console

### Common Error Messages

**"Google Sheets not configured"**
→ Add `serviceAccountKey` filename to config

**"service account key file not found"**
→ Check file path and filename spelling

**"The caller does not have permission"**
→ Share the Google Sheet with service account email

**"Requested entity was not found"**
→ Check if Sheet ID is correct

### Still Not Working?

1. Check the terminal where `npm run dev` is running
2. Look for any red error messages
3. Verify all steps in the setup guide
4. Make sure you restarted the dev server after making config changes

