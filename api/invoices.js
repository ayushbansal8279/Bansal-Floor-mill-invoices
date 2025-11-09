import { connectDB, Invoice, LastInvoiceNumber } from '../src/utils/mongodb.js'

const extractInvoiceNumber = (invoiceNumber) => {
  const match = invoiceNumber.toString().match(/\d+/)
  return match ? parseInt(match[0], 10) : null
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    await connectDB()
    const { method, body, url, query } = req
    
    // Parse URL to get path segments
    let urlPath = url
    if (!urlPath && req.url) {
      urlPath = req.url
    }
    if (urlPath) {
      try {
        const fullUrl = urlPath.startsWith('http') ? urlPath : `http://${req.headers.host || 'localhost'}${urlPath}`
        urlPath = new URL(fullUrl).pathname
      } catch (e) {
        // If URL parsing fails, use the raw path
        urlPath = urlPath.split('?')[0]
      }
    } else {
      urlPath = '/api/invoices'
    }
    
    const pathSegments = urlPath.replace('/api/invoices', '').replace(/^\//, '').split('/').filter(p => p)
    const invoiceNumber = pathSegments[0]
    const isLastNumber = invoiceNumber === 'last-number'
    const isNextNumber = invoiceNumber === 'next-number'
    const isExport = invoiceNumber === 'export' && pathSegments[1] === 'json'

    // GET /api/invoices
    if (method === 'GET' && !invoiceNumber) {
      const invoices = await Invoice.find({}).sort({ savedAt: -1 })
      return res.status(200).json(invoices)
    }

    // GET /api/invoices/last-number
    if (method === 'GET' && isLastNumber) {
      const doc = await LastInvoiceNumber.findById('lastInvoiceNumber')
      const lastNumber = doc ? doc.lastNumber : 0
      return res.status(200).json({ lastNumber })
    }

    // GET /api/invoices/next-number
    if (method === 'GET' && isNextNumber) {
      const doc = await LastInvoiceNumber.findById('lastInvoiceNumber')
      const lastNumber = doc ? doc.lastNumber : 0
      return res.status(200).json({ nextNumber: lastNumber + 1 })
    }

    // GET /api/invoices/export/json
    if (method === 'GET' && isExport) {
      const invoices = await Invoice.find({}).sort({ savedAt: -1 })
      res.setHeader('Content-Disposition', `attachment; filename=invoices_${new Date().toISOString().split('T')[0]}.json`)
      return res.status(200).json(invoices)
    }

    // GET /api/invoices/:invoiceNumber
    if (method === 'GET' && invoiceNumber) {
      const invoice = await Invoice.findOne({ invoiceNumber })
      if (invoice) {
        return res.status(200).json(invoice)
      } else {
        return res.status(404).json({ error: 'Invoice not found' })
      }
    }

    // POST /api/invoices
    if (method === 'POST') {
      const invoiceData = typeof body === 'string' ? JSON.parse(body) : body
      
      const exists = await Invoice.findOne({ invoiceNumber: invoiceData.invoiceNumber })
      if (exists) {
        return res.status(400).json({ error: 'Invoice number already exists' })
      }
      
      invoiceData.savedAt = new Date().toISOString()
      const invoice = new Invoice(invoiceData)
      await invoice.save()
      
      const invoiceNum = extractInvoiceNumber(invoiceData.invoiceNumber)
      if (invoiceNum) {
        await LastInvoiceNumber.findByIdAndUpdate(
          'lastInvoiceNumber',
          { lastNumber: invoiceNum },
          { upsert: true, new: true }
        )
      }
      
      return res.status(200).json({ success: true, invoice: invoice.toObject() })
    }

    // PUT /api/invoices/:invoiceNumber
    if (method === 'PUT') {
      const updatedData = typeof body === 'string' ? JSON.parse(body) : body
      
      const existingInvoice = await Invoice.findOne({ invoiceNumber })
      if (!existingInvoice) {
        return res.status(404).json({ error: 'Invoice not found' })
      }
      
      updatedData.savedAt = existingInvoice.savedAt || new Date().toISOString()
      updatedData.updatedAt = new Date().toISOString()
      
      const updatedInvoice = await Invoice.findOneAndUpdate(
        { invoiceNumber },
        updatedData,
        { new: true }
      )
      
      return res.status(200).json({ success: true, invoice: updatedInvoice.toObject() })
    }

    // DELETE /api/invoices/:invoiceNumber
    if (method === 'DELETE') {
      const result = await Invoice.findOneAndDelete({ invoiceNumber })
      
      if (!result) {
        return res.status(404).json({ error: 'Invoice not found' })
      }
      
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

