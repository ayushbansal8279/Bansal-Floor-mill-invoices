import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB, Invoice, LastInvoiceNumber, Item, Company } from './src/utils/mongodb.js'

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
      // Connect to MongoDB
      connectDB().catch(err => {
        console.error('MongoDB connection failed:', err)
      })

      // Invoices API - match all /api/invoices requests
      server.middlewares.use(async (req, res, next) => {
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
          try {
            await connectDB()
            const invoices = await Invoice.find({}).sort({ savedAt: -1 })
            res.end(JSON.stringify(invoices))
          } catch (error) {
            console.error('Error fetching invoices:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to fetch invoices' }))
          }
        } else if (req.method === 'GET' && isLastNumber) {
          // GET /api/invoices/last-number
          try {
            await connectDB()
            const doc = await LastInvoiceNumber.findById('lastInvoiceNumber')
            const lastNumber = doc ? doc.lastNumber : 0
            res.end(JSON.stringify({ lastNumber }))
          } catch (error) {
            console.error('Error fetching last invoice number:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to fetch last invoice number' }))
          }
        } else if (req.method === 'GET' && isNextNumber) {
          // GET /api/invoices/next-number
          try {
            await connectDB()
            const doc = await LastInvoiceNumber.findById('lastInvoiceNumber')
            const lastNumber = doc ? doc.lastNumber : 0
            res.end(JSON.stringify({ nextNumber: lastNumber + 1 }))
          } catch (error) {
            console.error('Error fetching next invoice number:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to fetch next invoice number' }))
          }
        } else if (req.method === 'GET' && isExport) {
          // GET /api/invoices/export/json
          try {
            await connectDB()
            const invoices = await Invoice.find({}).sort({ savedAt: -1 })
            res.setHeader('Content-Disposition', `attachment; filename=invoices_${new Date().toISOString().split('T')[0]}.json`)
            res.end(JSON.stringify(invoices))
          } catch (error) {
            console.error('Error exporting invoices:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to export invoices' }))
          }
        } else if (req.method === 'GET') {
          // GET /api/invoices/:invoiceNumber
          try {
            await connectDB()
            const invoiceNumber = url.split('/').pop() || url.replace(/^\/api\/invoices\//, '').replace(/^\//, '')
            const invoice = await Invoice.findOne({ invoiceNumber })
            if (invoice) {
              res.end(JSON.stringify(invoice))
            } else {
              res.statusCode = 404
              res.end(JSON.stringify({ error: 'Invoice not found' }))
            }
          } catch (error) {
            console.error('Error fetching invoice:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to fetch invoice' }))
          }
        } else if (req.method === 'POST') {
          // POST /api/invoices
          let body = ''
          req.on('data', chunk => { body += chunk.toString() })
          req.on('end', async () => {
            try {
              await connectDB()
              const invoiceData = JSON.parse(body)
              
              // Check if invoice number already exists
              const exists = await Invoice.findOne({ invoiceNumber: invoiceData.invoiceNumber })
              if (exists) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Invoice number already exists' }))
                return
              }
              
              invoiceData.savedAt = new Date().toISOString()
              const invoice = new Invoice(invoiceData)
              await invoice.save()
              
              // Update last invoice number
              const invoiceNum = extractInvoiceNumber(invoiceData.invoiceNumber)
              if (invoiceNum) {
                await LastInvoiceNumber.findByIdAndUpdate(
                  'lastInvoiceNumber',
                  { lastNumber: invoiceNum },
                  { upsert: true, new: true }
                )
              }
              
              res.end(JSON.stringify({ success: true, invoice: invoice.toObject() }))
            } catch (error) {
              console.error('Error creating invoice:', error)
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Failed to create invoice: ' + error.message }))
            }
          })
        } else if (req.method === 'PUT') {
          // PUT /api/invoices/:invoiceNumber
          const invoiceNumber = url.split('/').pop() || url.replace(/^\/api\/invoices\//, '').replace(/^\//, '')
          let body = ''
          req.on('data', chunk => { body += chunk.toString() })
          req.on('end', async () => {
            try {
              await connectDB()
              const updatedData = JSON.parse(body)
              
              const existingInvoice = await Invoice.findOne({ invoiceNumber })
              if (!existingInvoice) {
                res.statusCode = 404
                res.end(JSON.stringify({ error: 'Invoice not found' }))
                return
              }
              
              updatedData.savedAt = existingInvoice.savedAt || new Date().toISOString()
              updatedData.updatedAt = new Date().toISOString()
              
              const updatedInvoice = await Invoice.findOneAndUpdate(
                { invoiceNumber },
                updatedData,
                { new: true }
              )
              
              res.end(JSON.stringify({ success: true, invoice: updatedInvoice.toObject() }))
            } catch (error) {
              console.error('Error updating invoice:', error)
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Failed to update invoice: ' + error.message }))
            }
          })
        } else if (req.method === 'DELETE') {
          // DELETE /api/invoices/:invoiceNumber
          const invoiceNumber = url.split('/').pop() || url.replace(/^\/api\/invoices\//, '').replace(/^\//, '')
          
          try {
            await connectDB()
            const result = await Invoice.findOneAndDelete({ invoiceNumber })
            
            if (!result) {
              res.statusCode = 404
              res.end(JSON.stringify({ error: 'Invoice not found' }))
              return
            }
            
            res.end(JSON.stringify({ success: true }))
          } catch (error) {
            console.error('Error deleting invoice:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to delete invoice: ' + error.message }))
          }
        } else {
          next()
        }
      })

      // Items API
      server.middlewares.use(async (req, res, next) => {
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
          try {
            await connectDB()
            const items = await Item.find({}).sort({ id: 1 })
            res.end(JSON.stringify(items))
          } catch (error) {
            console.error('Error fetching items:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to fetch items' }))
          }
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk.toString() })
          req.on('end', async () => {
            try {
              await connectDB()
              const itemData = JSON.parse(body)
              const newItem = new Item({
                ...itemData,
                id: itemData.id || Date.now()
              })
              await newItem.save()
              res.end(JSON.stringify({ success: true, item: newItem.toObject() }))
            } catch (error) {
              console.error('Error creating item:', error)
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Failed to create item: ' + error.message }))
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
          req.on('end', async () => {
            try {
              await connectDB()
              const updatedData = JSON.parse(body)
              const updatedItem = await Item.findOneAndUpdate(
                { id: itemId },
                updatedData,
                { new: true }
              )
              
              if (!updatedItem) {
                res.statusCode = 404
                res.end(JSON.stringify({ error: 'Item not found' }))
                return
              }
              
              res.end(JSON.stringify({ success: true, item: updatedItem.toObject() }))
            } catch (error) {
              console.error('Error updating item:', error)
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Failed to update item: ' + error.message }))
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
          
          try {
            await connectDB()
            const result = await Item.findOneAndDelete({ id: itemId })
            
            if (!result) {
              res.statusCode = 404
              res.end(JSON.stringify({ error: 'Item not found' }))
              return
            }
            
            res.end(JSON.stringify({ success: true }))
          } catch (error) {
            console.error('Error deleting item:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to delete item: ' + error.message }))
          }
        } else {
          next()
        }
      })

      // Companies API
      server.middlewares.use(async (req, res, next) => {
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
          
          try {
            await connectDB()
            let companies
            if (!searchTerm) {
              companies = await Company.find({}).limit(10)
            } else {
              const term = searchTerm.toLowerCase()
              companies = await Company.find({
                $or: [
                  { name: { $regex: term, $options: 'i' } },
                  { nameHindi: { $regex: term, $options: 'i' } }
                ]
              }).limit(10)
            }
            // Return just company names for backward compatibility
            const companyNames = companies.map(c => c.name)
            res.end(JSON.stringify(companyNames))
          } catch (error) {
            console.error('Error fetching company suggestions:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to fetch suggestions' }))
          }
        } else if (req.method === 'GET') {
          try {
            await connectDB()
            const companies = await Company.find({})
            // Return just company names for backward compatibility
            const companyNames = companies.map(c => c.name)
            res.end(JSON.stringify(companyNames))
          } catch (error) {
            console.error('Error fetching companies:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to fetch companies' }))
          }
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk.toString() })
          req.on('end', async () => {
            try {
              await connectDB()
              // Company name is sent as a JSON string (e.g., "Company Name")
              let companyName = body
              try {
                companyName = JSON.parse(body)
              } catch (e) {
                // If not JSON, use as-is
                companyName = body
              }
              
              if (!companyName || !companyName.trim()) {
                res.end(JSON.stringify({ success: true, message: 'Empty company name' }))
                return
              }
              
              // Check if company exists
              const existing = await Company.findOne({ name: companyName })
              if (existing) {
                const allCompanies = await Company.find({})
                const companyNames = allCompanies.map(c => c.name)
                res.end(JSON.stringify({ success: true, companies: companyNames, message: 'Company already exists' }))
                return
              }
              
              // Create new company
              const newCompany = new Company({ name: companyName.trim() })
              await newCompany.save()
              
              const allCompanies = await Company.find({})
              const companyNames = allCompanies.map(c => c.name)
              res.end(JSON.stringify({ success: true, companies: companyNames }))
            } catch (error) {
              console.error('Error creating company:', error)
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Failed to create company: ' + error.message }))
            }
          })
        } else {
          next()
        }
      })
    }
  }
}

