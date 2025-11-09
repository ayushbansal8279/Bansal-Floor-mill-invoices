import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json())

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

// Initialize items from predefinedItems.json if it exists, otherwise create empty array
if (!fs.existsSync(ITEMS_FILE)) {
  // Try to load from predefinedItems.json if it exists
  const predefinedItemsPath = path.join(__dirname, 'src', 'data', 'predefinedItems.json')
  if (fs.existsSync(predefinedItemsPath)) {
    try {
      const predefinedData = fs.readFileSync(predefinedItemsPath, 'utf8')
      const items = JSON.parse(predefinedData)
      // Add IDs to items if they don't have them
      const itemsWithIds = items.map((item, index) => ({
        ...item,
        id: item.id || index + 1
      }))
      fs.writeFileSync(ITEMS_FILE, JSON.stringify(itemsWithIds, null, 2))
      console.log('Loaded predefined items from predefinedItems.json')
    } catch (error) {
      console.error('Error loading predefined items:', error)
      fs.writeFileSync(ITEMS_FILE, JSON.stringify([], null, 2))
    }
  } else {
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
    console.error('Error reading last invoice number:', error)
    return 0
  }
}

const setLastInvoiceNumber = (number) => {
  try {
    fs.writeFileSync(LAST_INVOICE_NUMBER_FILE, JSON.stringify({ lastNumber: number }, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('Error writing last invoice number:', error)
    return false
  }
}

const extractInvoiceNumber = (invoiceNumber) => {
  const match = invoiceNumber.toString().match(/\d+/)
  return match ? parseInt(match[0], 10) : null
}

// API Routes

// Get all invoices
app.get('/api/invoices', (req, res) => {
  try {
    const invoices = readInvoices()
    res.json(invoices)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' })
  }
})

// Get single invoice by number
app.get('/api/invoices/:invoiceNumber', (req, res) => {
  try {
    const invoices = readInvoices()
    const invoice = invoices.find(inv => inv.invoiceNumber === req.params.invoiceNumber)
    if (invoice) {
      res.json(invoice)
    } else {
      res.status(404).json({ error: 'Invoice not found' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice' })
  }
})

// Create new invoice
app.post('/api/invoices', (req, res) => {
  try {
    const invoiceData = req.body
    const invoices = readInvoices()
    
    // Check if invoice number already exists
    const exists = invoices.find(inv => inv.invoiceNumber === invoiceData.invoiceNumber)
    if (exists) {
      return res.status(400).json({ error: 'Invoice number already exists' })
    }
    
    // Add timestamp
    invoiceData.savedAt = new Date().toISOString()
    invoices.push(invoiceData)
    
    if (writeInvoices(invoices)) {
      // Update last invoice number
      const invoiceNum = extractInvoiceNumber(invoiceData.invoiceNumber)
      if (invoiceNum) {
        setLastInvoiceNumber(invoiceNum)
      }
      res.json({ success: true, invoice: invoiceData })
    } else {
      res.status(500).json({ error: 'Failed to save invoice' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' })
  }
})

// Update invoice
app.put('/api/invoices/:invoiceNumber', (req, res) => {
  try {
    const invoiceNumber = req.params.invoiceNumber
    const updatedData = req.body
    const invoices = readInvoices()
    
    const index = invoices.findIndex(inv => inv.invoiceNumber === invoiceNumber)
    if (index === -1) {
      return res.status(404).json({ error: 'Invoice not found' })
    }
    
    // Preserve savedAt, add updatedAt
    updatedData.savedAt = invoices[index].savedAt || new Date().toISOString()
    updatedData.updatedAt = new Date().toISOString()
    invoices[index] = updatedData
    
    if (writeInvoices(invoices)) {
      res.json({ success: true, invoice: updatedData })
    } else {
      res.status(500).json({ error: 'Failed to update invoice' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' })
  }
})

// Delete invoice
app.delete('/api/invoices/:invoiceNumber', (req, res) => {
  try {
    const invoiceNumber = req.params.invoiceNumber
    const invoices = readInvoices()
    const filtered = invoices.filter(inv => inv.invoiceNumber !== invoiceNumber)
    
    if (filtered.length === invoices.length) {
      return res.status(404).json({ error: 'Invoice not found' })
    }
    
    if (writeInvoices(filtered)) {
      res.json({ success: true })
    } else {
      res.status(500).json({ error: 'Failed to delete invoice' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete invoice' })
  }
})

// Get last invoice number
app.get('/api/invoices/last-number', (req, res) => {
  try {
    const lastNumber = getLastInvoiceNumber()
    res.json({ lastNumber })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get last invoice number' })
  }
})

// Get next invoice number
app.get('/api/invoices/next-number', (req, res) => {
  try {
    const lastNumber = getLastInvoiceNumber()
    res.json({ nextNumber: lastNumber + 1 })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get next invoice number' })
  }
})

// Export all invoices as JSON
app.get('/api/invoices/export/json', (req, res) => {
  try {
    const invoices = readInvoices()
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename=invoices_${new Date().toISOString().split('T')[0]}.json`)
    res.json(invoices)
  } catch (error) {
    res.status(500).json({ error: 'Failed to export invoices' })
  }
})

// ========== ITEMS API ==========

const readItems = () => {
  try {
    const data = fs.readFileSync(ITEMS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading items:', error)
    return []
  }
}

const writeItems = (items) => {
  try {
    fs.writeFileSync(ITEMS_FILE, JSON.stringify(items, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('Error writing items:', error)
    return false
  }
}

// Get all items
app.get('/api/items', (req, res) => {
  try {
    const items = readItems()
    res.json(items)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' })
  }
})

// Create new item
app.post('/api/items', (req, res) => {
  try {
    const itemData = req.body
    const items = readItems()
    const newItem = {
      ...itemData,
      id: itemData.id || Date.now()
    }
    items.push(newItem)
    
    if (writeItems(items)) {
      res.json({ success: true, item: newItem })
    } else {
      res.status(500).json({ error: 'Failed to save item' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item' })
  }
})

// Update item
app.put('/api/items/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id)
    const updatedData = req.body
    const items = readItems()
    
    const index = items.findIndex(item => item.id === itemId)
    if (index === -1) {
      return res.status(404).json({ error: 'Item not found' })
    }
    
    items[index] = { ...items[index], ...updatedData }
    
    if (writeItems(items)) {
      res.json({ success: true, item: items[index] })
    } else {
      res.status(500).json({ error: 'Failed to update item' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' })
  }
})

// Delete item
app.delete('/api/items/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id)
    const items = readItems()
    const filtered = items.filter(item => item.id !== itemId)
    
    if (filtered.length === items.length) {
      return res.status(404).json({ error: 'Item not found' })
    }
    
    if (writeItems(filtered)) {
      res.json({ success: true })
    } else {
      res.status(500).json({ error: 'Failed to delete item' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' })
  }
})

// ========== COMPANIES API ==========

const readCompanies = () => {
  try {
    const data = fs.readFileSync(COMPANIES_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading companies:', error)
    return []
  }
}

const writeCompanies = (companies) => {
  try {
    fs.writeFileSync(COMPANIES_FILE, JSON.stringify(companies, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('Error writing companies:', error)
    return false
  }
}

// Get all companies
app.get('/api/companies', (req, res) => {
  try {
    const companies = readCompanies()
    res.json(companies)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch companies' })
  }
})

// Create new company
app.post('/api/companies', (req, res) => {
  try {
    const companyName = req.body.name || req.body
    const companies = readCompanies()
    
    if (!companies.includes(companyName) && companyName.trim()) {
      companies.push(companyName)
      if (writeCompanies(companies)) {
        res.json({ success: true, companies })
      } else {
        res.status(500).json({ error: 'Failed to save company' })
      }
    } else {
      res.json({ success: true, companies, message: 'Company already exists' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create company' })
  }
})

// Get company suggestions
app.get('/api/companies/suggestions', (req, res) => {
  try {
    const searchTerm = req.query.q || ''
    const companies = readCompanies()
    
    if (!searchTerm) {
      return res.json(companies.slice(0, 10))
    }
    
    const term = searchTerm.toLowerCase()
    const suggestions = companies.filter(company => 
      company.toLowerCase().includes(term)
    ).slice(0, 10)
    
    res.json(suggestions)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get suggestions' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Invoices stored in: ${INVOICES_FILE}`)
})

