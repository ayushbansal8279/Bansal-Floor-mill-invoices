import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { saveInvoiceToSheets, deleteInvoiceFromSheets } from './src/utils/googleSheets.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Data file paths
const INVOICES_FILE = path.join(__dirname, 'src', 'data', 'invoices.json')
const LAST_INVOICE_NUMBER_FILE = path.join(__dirname, 'src', 'data', 'lastInvoiceNumber.json')
const ITEMS_FILE = path.join(__dirname, 'src', 'data', 'predefinedItems.json')
const COMPANIES_FILE = path.join(__dirname, 'src', 'data', 'companies.json')

// Ensure data directory exists
const dataDir = path.join(__dirname, 'src', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Initialize files if they don't exist
if (!fs.existsSync(INVOICES_FILE)) {
  fs.writeFileSync(INVOICES_FILE, JSON.stringify([], null, 2))
}

if (!fs.existsSync(LAST_INVOICE_NUMBER_FILE)) {
  fs.writeFileSync(LAST_INVOICE_NUMBER_FILE, JSON.stringify({ lastNumber: 0 }, null, 2))
}

if (!fs.existsSync(COMPANIES_FILE)) {
  fs.writeFileSync(COMPANIES_FILE, JSON.stringify([], null, 2))
}

// Initialize items from predefinedItems.json
// Always check and load from predefinedItems.json if it exists and ITEMS_FILE is empty or doesn't exist
const predefinedItemsPath = path.join(__dirname, 'src', 'data', 'predefinedItems.json')
if (fs.existsSync(predefinedItemsPath)) {
  try {
    const predefinedData = fs.readFileSync(predefinedItemsPath, 'utf8')
    const items = JSON.parse(predefinedData)
    
    // Only initialize if ITEMS_FILE doesn't exist or is empty
    if (!fs.existsSync(ITEMS_FILE)) {
      // Add IDs to items if they don't have them, and remove duplicates
      const seenIds = new Set()
      const itemsWithIds = items.map((item, index) => {
        const id = item.id || index + 1
        // Skip duplicates
        if (seenIds.has(id)) {
          return null
        }
        seenIds.add(id)
        return {
          ...item,
          id: id
        }
      }).filter(item => item !== null)
      
      fs.writeFileSync(ITEMS_FILE, JSON.stringify(itemsWithIds, null, 2))
      console.log(`Loaded ${itemsWithIds.length} items from predefinedItems.json`)
    } else {
      // If file exists, check if it's empty
      const existingData = fs.readFileSync(ITEMS_FILE, 'utf8')
      const existingItems = JSON.parse(existingData)
      if (existingItems.length === 0 && items.length > 0) {
        // File exists but is empty, load from predefinedItems.json
        const seenIds = new Set()
        const itemsWithIds = items.map((item, index) => {
          const id = item.id || index + 1
          if (seenIds.has(id)) {
            return null
          }
          seenIds.add(id)
          return {
            ...item,
            id: id
          }
        }).filter(item => item !== null)
        
        fs.writeFileSync(ITEMS_FILE, JSON.stringify(itemsWithIds, null, 2))
        console.log(`Loaded ${itemsWithIds.length} items from predefinedItems.json (file was empty)`)
      }
    }
  } catch (error) {
    console.error('Error loading predefined items:', error)
    if (!fs.existsSync(ITEMS_FILE)) {
      fs.writeFileSync(ITEMS_FILE, JSON.stringify([], null, 2))
    }
  }
} else {
  // predefinedItems.json doesn't exist, create empty ITEMS_FILE if it doesn't exist
  if (!fs.existsSync(ITEMS_FILE)) {
    fs.writeFileSync(ITEMS_FILE, JSON.stringify([], null, 2))
  }
}

// Helper functions
const readInvoices = () => {
  try {
    const data = fs.readFileSync(INVOICES_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading invoices:', error)
    return []
  }
}

const writeInvoices = (invoices) => {
  try {
    fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('Error writing invoices:', error)
    return false
  }
}

const getLastInvoiceNumber = () => {
  try {
    const data = fs.readFileSync(LAST_INVOICE_NUMBER_FILE, 'utf8')
    const parsed = JSON.parse(data)
    return parsed.lastNumber || 0
  } catch (error) {
    return 0
  }
}

const setLastInvoiceNumber = (number) => {
  try {
    fs.writeFileSync(LAST_INVOICE_NUMBER_FILE, JSON.stringify({ lastNumber: number }, null, 2), 'utf8')
    return true
  } catch (error) {
    return false
  }
}

const extractInvoiceNumber = (invoiceNumber) => {
  const match = invoiceNumber.toString().match(/\d+/)
  return match ? parseInt(match[0], 10) : null
}

const readItems = () => {
  try {
    const data = fs.readFileSync(ITEMS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

const writeItems = (items) => {
  try {
    fs.writeFileSync(ITEMS_FILE, JSON.stringify(items, null, 2), 'utf8')
    return true
  } catch (error) {
    return false
  }
}

const readCompanies = () => {
  try {
    const data = fs.readFileSync(COMPANIES_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

const writeCompanies = (companies) => {
  try {
    fs.writeFileSync(COMPANIES_FILE, JSON.stringify(companies, null, 2), 'utf8')
    return true
  } catch (error) {
    return false
  }
}

export default function vitePluginApi() {
  return {
    name: 'vite-plugin-api',
    configureServer(server) {
      // Invoices API - match all /api/invoices requests
      server.middlewares.use((req, res, next) => {
        // Only handle /api/invoices requests
        if (!req.url || !req.url.startsWith('/api/invoices')) {
          next()
          return
        }

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') {
          res.end()
          return
        }

        // Parse the URL - req.url will be the full path like /api/invoices or /api/invoices/INV-1
        const url = req.url || ''
        const pathParts = url.split('/').filter(p => p)
        const isBasePath = pathParts.length === 2 && pathParts[0] === 'api' && pathParts[1] === 'invoices'
        const isLastNumber = url.includes('/last-number')
        const isNextNumber = url.includes('/next-number')
        const isExport = url.includes('/export/json')
        
        if (req.method === 'GET' && isBasePath) {
          // GET /api/invoices
          const invoices = readInvoices()
          res.end(JSON.stringify(invoices))
        } else if (req.method === 'GET' && isLastNumber) {
          // GET /api/invoices/last-number
          const lastNumber = getLastInvoiceNumber()
          res.end(JSON.stringify({ lastNumber }))
        } else if (req.method === 'GET' && isNextNumber) {
          // GET /api/invoices/next-number
          const lastNumber = getLastInvoiceNumber()
          res.end(JSON.stringify({ nextNumber: lastNumber + 1 }))
        } else if (req.method === 'GET' && isExport) {
          // GET /api/invoices/export/json
          const invoices = readInvoices()
          res.setHeader('Content-Disposition', `attachment; filename=invoices_${new Date().toISOString().split('T')[0]}.json`)
          res.end(JSON.stringify(invoices))
        } else if (req.method === 'GET') {
          // GET /api/invoices/:invoiceNumber
          const invoiceNumber = url.split('/').pop() || url.replace(/^\/api\/invoices\//, '').replace(/^\//, '')
          const invoices = readInvoices()
          const invoice = invoices.find(inv => inv.invoiceNumber === invoiceNumber)
          if (invoice) {
            res.end(JSON.stringify(invoice))
          } else {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'Invoice not found' }))
          }
        } else if (req.method === 'POST') {
          // POST /api/invoices
          let body = ''
          req.on('data', chunk => { body += chunk.toString() })
          req.on('end', () => {
            try {
              const invoiceData = JSON.parse(body)
              const invoices = readInvoices()
              
              const exists = invoices.find(inv => inv.invoiceNumber === invoiceData.invoiceNumber)
              if (exists) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Invoice number already exists' }))
                return
              }
              
              invoiceData.savedAt = new Date().toISOString()
              invoices.push(invoiceData)
              
              if (writeInvoices(invoices)) {
                const invoiceNum = extractInvoiceNumber(invoiceData.invoiceNumber)
                if (invoiceNum) {
                  setLastInvoiceNumber(invoiceNum)
                }
                
                // Save to Google Sheets in parallel (non-blocking)
                saveInvoiceToSheets(invoiceData, false).catch(err => {
                  console.error('Failed to save to Google Sheets:', err)
                })
                
                res.end(JSON.stringify({ success: true, invoice: invoiceData }))
              } else {
                res.statusCode = 500
                res.end(JSON.stringify({ error: 'Failed to save invoice' }))
              }
            } catch (error) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Failed to create invoice' }))
            }
          })
        } else if (req.method === 'PUT') {
          // PUT /api/invoices/:invoiceNumber
          const invoiceNumber = url.split('/').pop() || url.replace(/^\/api\/invoices\//, '').replace(/^\//, '')
          let body = ''
          req.on('data', chunk => { body += chunk.toString() })
          req.on('end', () => {
            try {
              const updatedData = JSON.parse(body)
              const invoices = readInvoices()
              const index = invoices.findIndex(inv => inv.invoiceNumber === invoiceNumber)
              
              if (index === -1) {
                res.statusCode = 404
                res.end(JSON.stringify({ error: 'Invoice not found' }))
                return
              }
              
              updatedData.savedAt = invoices[index].savedAt || new Date().toISOString()
              updatedData.updatedAt = new Date().toISOString()
              invoices[index] = updatedData
              
              if (writeInvoices(invoices)) {
                // Update Google Sheets in parallel (non-blocking)
                saveInvoiceToSheets(updatedData, true).catch(err => {
                  console.error('Failed to update Google Sheets:', err)
                })
                
                res.end(JSON.stringify({ success: true, invoice: updatedData }))
              } else {
                res.statusCode = 500
                res.end(JSON.stringify({ error: 'Failed to update invoice' }))
              }
            } catch (error) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Failed to update invoice' }))
            }
          })
        } else if (req.method === 'DELETE') {
          // DELETE /api/invoices/:invoiceNumber
          const invoiceNumber = url.split('/').pop() || url.replace(/^\/api\/invoices\//, '').replace(/^\//, '')
          const invoices = readInvoices()
          const filtered = invoices.filter(inv => inv.invoiceNumber !== invoiceNumber)
          
          if (filtered.length === invoices.length) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'Invoice not found' }))
            return
          }
          
          if (writeInvoices(filtered)) {
            // Delete from Google Sheets in parallel (non-blocking)
            deleteInvoiceFromSheets(invoiceNumber).catch(err => {
              console.error('Failed to delete from Google Sheets:', err)
            })
            
            res.end(JSON.stringify({ success: true }))
          } else {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to delete invoice' }))
          }
        } else {
          next()
        }
      })

      // Items API
      server.middlewares.use((req, res, next) => {
        // Only handle /api/items requests
        if (!req.url || !req.url.startsWith('/api/items')) {
          next()
          return
        }
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') {
          res.end()
          return
        }

        if (req.method === 'GET') {
          const items = readItems()
          res.end(JSON.stringify(items))
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk.toString() })
          req.on('end', () => {
            try {
              const itemData = JSON.parse(body)
              const items = readItems()
              const newItem = {
                ...itemData,
                id: itemData.id || Date.now()
              }
              items.push(newItem)
              
              if (writeItems(items)) {
                res.end(JSON.stringify({ success: true, item: newItem }))
              } else {
                res.statusCode = 500
                res.end(JSON.stringify({ error: 'Failed to save item' }))
              }
            } catch (error) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Failed to create item' }))
            }
          })
        } else if (req.method === 'PUT') {
          // Extract item ID from URL like /api/items/123
          const urlParts = req.url.split('/').filter(p => p)
          const itemId = urlParts.length >= 3 ? parseInt(urlParts[2]) : null
          
          if (!itemId || isNaN(itemId)) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Invalid item ID' }))
            return
          }
          
          let body = ''
          req.on('data', chunk => { body += chunk.toString() })
          req.on('end', () => {
            try {
              const updatedData = JSON.parse(body)
              const items = readItems()
              // Compare IDs - handle both number and string IDs
              const index = items.findIndex(item => {
                const itemIdNum = typeof item.id === 'number' ? item.id : parseInt(item.id)
                return itemIdNum === itemId
              })
              
              if (index === -1) {
                res.statusCode = 404
                res.end(JSON.stringify({ error: 'Item not found' }))
                return
              }
              
              items[index] = { ...items[index], ...updatedData }
              
              if (writeItems(items)) {
                res.end(JSON.stringify({ success: true, item: items[index] }))
              } else {
                res.statusCode = 500
                res.end(JSON.stringify({ error: 'Failed to update item' }))
              }
            } catch (error) {
              console.error('Error updating item:', error)
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Failed to update item' }))
            }
          })
        } else if (req.method === 'DELETE') {
          // Extract item ID from URL like /api/items/123
          const urlParts = req.url.split('/').filter(p => p)
          const itemId = urlParts.length >= 3 ? parseInt(urlParts[2]) : null
          
          if (!itemId || isNaN(itemId)) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Invalid item ID' }))
            return
          }
          
          const items = readItems()
          // Compare IDs - handle both number and string IDs
          const filtered = items.filter(item => {
            const itemIdNum = typeof item.id === 'number' ? item.id : parseInt(item.id)
            return itemIdNum !== itemId
          })
          
          if (filtered.length === items.length) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'Item not found' }))
            return
          }
          
          if (writeItems(filtered)) {
            res.end(JSON.stringify({ success: true }))
          } else {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to delete item' }))
          }
        } else {
          next()
        }
      })

      // Companies API
      server.middlewares.use((req, res, next) => {
        // Only handle /api/companies requests
        if (!req.url || !req.url.startsWith('/api/companies')) {
          next()
          return
        }
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') {
          res.end()
          return
        }

        if (req.method === 'GET' && req.url.includes('/suggestions')) {
          const url = new URL(req.url, `http://${req.headers.host}`)
          const searchTerm = url.searchParams.get('q') || ''
          const companies = readCompanies()
          
          if (!searchTerm) {
            res.end(JSON.stringify(companies.slice(0, 10)))
            return
          }
          
          const term = searchTerm.toLowerCase()
          const suggestions = companies.filter(company => 
            company.toLowerCase().includes(term)
          ).slice(0, 10)
          
          res.end(JSON.stringify(suggestions))
        } else if (req.method === 'GET') {
          const companies = readCompanies()
          res.end(JSON.stringify(companies))
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk.toString() })
          req.on('end', () => {
            try {
              // Company name is sent as a JSON string (e.g., "Company Name")
              let companyName = body
              try {
                companyName = JSON.parse(body)
              } catch (e) {
                // If not JSON, use as-is
                companyName = body
              }
              
              const companies = readCompanies()
              
              if (!companies.includes(companyName) && companyName.trim()) {
                companies.push(companyName)
                if (writeCompanies(companies)) {
                  res.end(JSON.stringify({ success: true, companies }))
                } else {
                  res.statusCode = 500
                  res.end(JSON.stringify({ error: 'Failed to save company' }))
                }
              } else {
                res.end(JSON.stringify({ success: true, companies, message: 'Company already exists' }))
              }
            } catch (error) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Failed to create company' }))
            }
          })
        } else {
          next()
        }
      })
    }
  }
}

