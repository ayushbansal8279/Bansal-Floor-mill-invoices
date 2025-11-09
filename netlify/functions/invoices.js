import { connectDB, Invoice, LastInvoiceNumber } from '../../src/utils/mongodb.js'

const extractInvoiceNumber = (invoiceNumber) => {
  const match = invoiceNumber.toString().match(/\d+/)
  return match ? parseInt(match[0], 10) : null
}

export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    await connectDB()
    const path = event.path.replace('/api/invoices', '').replace(/^\//, '')
    const isLastNumber = path === 'last-number'
    const isNextNumber = path === 'next-number'
    const isExport = path === 'export/json'

    // GET /api/invoices
    if (event.httpMethod === 'GET' && path === '') {
      const invoices = await Invoice.find({}).sort({ savedAt: -1 })
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(invoices)
      }
    }

    // GET /api/invoices/last-number
    if (event.httpMethod === 'GET' && isLastNumber) {
      const doc = await LastInvoiceNumber.findById('lastInvoiceNumber')
      const lastNumber = doc ? doc.lastNumber : 0
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ lastNumber })
      }
    }

    // GET /api/invoices/next-number
    if (event.httpMethod === 'GET' && isNextNumber) {
      const doc = await LastInvoiceNumber.findById('lastInvoiceNumber')
      const lastNumber = doc ? doc.lastNumber : 0
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ nextNumber: lastNumber + 1 })
      }
    }

    // GET /api/invoices/export/json
    if (event.httpMethod === 'GET' && isExport) {
      const invoices = await Invoice.find({}).sort({ savedAt: -1 })
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Disposition': `attachment; filename=invoices_${new Date().toISOString().split('T')[0]}.json`
        },
        body: JSON.stringify(invoices)
      }
    }

    // GET /api/invoices/:invoiceNumber
    if (event.httpMethod === 'GET' && path) {
      const invoice = await Invoice.findOne({ invoiceNumber: path })
      if (invoice) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(invoice)
        }
      } else {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Invoice not found' })
        }
      }
    }

    // POST /api/invoices
    if (event.httpMethod === 'POST') {
      const invoiceData = JSON.parse(event.body)
      
      const exists = await Invoice.findOne({ invoiceNumber: invoiceData.invoiceNumber })
      if (exists) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invoice number already exists' })
        }
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
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, invoice: invoice.toObject() })
      }
    }

    // PUT /api/invoices/:invoiceNumber
    if (event.httpMethod === 'PUT') {
      const invoiceNumber = path
      const updatedData = JSON.parse(event.body)
      
      const existingInvoice = await Invoice.findOne({ invoiceNumber })
      if (!existingInvoice) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Invoice not found' })
        }
      }
      
      updatedData.savedAt = existingInvoice.savedAt || new Date().toISOString()
      updatedData.updatedAt = new Date().toISOString()
      
      const updatedInvoice = await Invoice.findOneAndUpdate(
        { invoiceNumber },
        updatedData,
        { new: true }
      )
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, invoice: updatedInvoice.toObject() })
      }
    }

    // DELETE /api/invoices/:invoiceNumber
    if (event.httpMethod === 'DELETE') {
      const invoiceNumber = path
      const result = await Invoice.findOneAndDelete({ invoiceNumber })
      
      if (!result) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Invoice not found' })
        }
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    }
  }
}

