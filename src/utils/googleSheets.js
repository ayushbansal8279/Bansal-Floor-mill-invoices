import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get project root directory (go up from src/utils to project root)
const PROJECT_ROOT = path.join(__dirname, '..', '..')

// Configuration file path
const CONFIG_FILE = path.join(PROJECT_ROOT, 'src', 'data', 'googleSheetsConfig.json')

// Check if Google Sheets is configured
const isConfigured = () => {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      console.log('Google Sheets config file not found:', CONFIG_FILE)
      return false
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
    const hasAuth = !!(config.credentials || config.serviceAccountKey)
    if (!hasAuth) {
      console.log('Google Sheets not fully configured - missing serviceAccountKey or credentials')
      console.log('Current config:', JSON.stringify(config, null, 2))
    }
    return !!(config.spreadsheetId && hasAuth)
  } catch (error) {
    console.error('Error reading Google Sheets config:', error)
    return false
  }
}

// Get Google Sheets client
const getSheetsClient = async () => {
  try {
    if (!isConfigured()) {
      return null
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
    const { spreadsheetId, credentials, serviceAccountKey } = config

    let auth
    if (serviceAccountKey) {
      // Service Account authentication
      const keyPath = path.join(PROJECT_ROOT, 'src', 'data', serviceAccountKey)
      if (fs.existsSync(keyPath)) {
        const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
        auth = new google.auth.GoogleAuth({
          credentials: key,
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        })
      } else {
        console.warn('Google Sheets service account key file not found')
        return null
      }
    } else if (credentials) {
      // OAuth2 credentials
      const credsPath = path.join(PROJECT_ROOT, 'src', 'data', credentials)
      if (fs.existsSync(credsPath)) {
        const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'))
        auth = new google.auth.GoogleAuth({
          credentials: creds,
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        })
      } else {
        console.warn('Google Sheets credentials file not found')
        return null
      }
    } else {
      return null
    }

    const sheets = google.sheets({ version: 'v4', auth })
    return { sheets, spreadsheetId }
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error)
    return null
  }
}

// Initialize Google Sheet with headers if needed
const initializeSheet = async (sheets, spreadsheetId) => {
  try {
    // Check if sheet exists and has headers
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Invoices!A1:Z1'
    })

    const values = response.data.values
    if (!values || values.length === 0) {
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Invoices!A1',
        valueInputOption: 'RAW',
        resource: {
          values: [[
            'Invoice Number',
            'Date',
            'From Company',
            'To Company',
            'To Company (Hindi)',
            'To Address',
            'Vehicle',
            'Subtotal',
            'Tax Rate (%)',
            'Tax Amount',
            'Discount',
            'Total',
            'Items Count',
            'Items (JSON)',
            'Saved At',
            'Updated At'
          ]]
        }
      })
    }
  } catch (error) {
    // Sheet might not exist, try to create it
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: 'Invoices',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 20
                }
              }
            }
          }]
        }
      })
      // Add headers after creating sheet
      await initializeSheet(sheets, spreadsheetId)
    } catch (createError) {
      console.error('Error creating Google Sheet:', createError)
    }
  }
}

// Convert invoice to row format
const invoiceToRow = (invoice) => {
  return [
    invoice.invoiceNumber || '',
    invoice.invoiceDate || '',
    invoice.fromName || invoice.fromNameEng || '',
    invoice.toName || '',
    invoice.toNameHindi || '',
    invoice.toAddress || '',
    invoice.toVehicle || '',
    invoice.subtotal || 0,
    invoice.taxRate || 0,
    invoice.tax || 0,
    invoice.discount || 0,
    invoice.total || 0,
    invoice.items ? invoice.items.length : 0,
    JSON.stringify(invoice.items || []),
    invoice.savedAt || new Date().toISOString(),
    invoice.updatedAt || ''
  ]
}

// Save invoice to Google Sheets
export const saveInvoiceToSheets = async (invoice, isUpdate = false) => {
  try {
    const client = await getSheetsClient()
    if (!client) {
      console.log('Google Sheets not configured - serviceAccountKey or credentials missing in config')
      return false // Not configured, silently fail
    }

    const { sheets, spreadsheetId } = client

    // Initialize sheet if needed
    await initializeSheet(sheets, spreadsheetId)

    if (isUpdate) {
      // Find and update existing row
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Invoices!A:A'
      })

      const rows = response.data.values || []
      const rowIndex = rows.findIndex(row => row[0] === invoice.invoiceNumber)

      if (rowIndex !== -1) {
        // Update existing row (rowIndex + 1 because sheets are 1-indexed, +1 for header)
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Invoices!A${rowIndex + 2}:P${rowIndex + 2}`,
          valueInputOption: 'RAW',
          resource: {
            values: [invoiceToRow(invoice)]
          }
        })
      } else {
        // Invoice not found, append as new
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Invoices!A:P',
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          resource: {
            values: [invoiceToRow(invoice)]
          }
        })
      }
    } else {
      // Append new invoice
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Invoices!A:P',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [invoiceToRow(invoice)]
        }
      })
    }

    return true
  } catch (error) {
    console.error('Error saving invoice to Google Sheets:', error)
    return false // Fail silently, don't break the app
  }
}

// Delete invoice from Google Sheets
export const deleteInvoiceFromSheets = async (invoiceNumber) => {
  try {
    const client = await getSheetsClient()
    if (!client) {
      return false // Not configured, silently fail
    }

    const { sheets, spreadsheetId } = client

    // Find the row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Invoices!A:A'
    })

    const rows = response.data.values || []
    const rowIndex = rows.findIndex(row => row[0] === invoiceNumber)

    if (rowIndex !== -1) {
      // Delete the row (rowIndex + 2 because sheets are 1-indexed, +1 for header, +1 for 0-index)
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0, // Assuming first sheet
                dimension: 'ROWS',
                startIndex: rowIndex + 1, // +1 for header row
                endIndex: rowIndex + 2
              }
            }
          }]
        }
      })
      return true
    }

    return false
  } catch (error) {
    console.error('Error deleting invoice from Google Sheets:', error)
    return false // Fail silently
  }
}

// Sync all invoices to Google Sheets (useful for initial setup)
export const syncAllInvoicesToSheets = async (invoices) => {
  try {
    const client = await getSheetsClient()
    if (!client) {
      return false
    }

    const { sheets, spreadsheetId } = client

    // Initialize sheet
    await initializeSheet(sheets, spreadsheetId)

    // Clear existing data (except header)
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Invoices!A2:Z1000'
    })

    // Add all invoices
    if (invoices.length > 0) {
      const rows = invoices.map(invoice => invoiceToRow(invoice))
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Invoices!A2',
        valueInputOption: 'RAW',
        resource: {
          values: rows
        }
      })
    }

    return true
  } catch (error) {
    console.error('Error syncing invoices to Google Sheets:', error)
    return false
  }
}

