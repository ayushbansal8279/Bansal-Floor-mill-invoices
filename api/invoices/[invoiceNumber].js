import { connectDB, Invoice } from '../../src/utils/mongodb.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    await connectDB()
    const { method, body, query } = req
    const invoiceNumber = query.invoiceNumber

    // GET /api/invoices/:invoiceNumber
    if (method === 'GET') {
      const invoice = await Invoice.findOne({ invoiceNumber })
      if (invoice) {
        return res.status(200).json(invoice)
      } else {
        return res.status(404).json({ error: 'Invoice not found' })
      }
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

