import { connectDB, Company } from '../src/utils/mongodb.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    await connectDB()
    const { query, method } = req

    // Parse body safely
    let body = req.body
    if (typeof body === 'string' && body.length > 0) {
      try {
        body = JSON.parse(body)
      } catch (e) {
        body = {}
      }
    } else if (!body) {
      body = {}
    }

    const companyId = query.id ? parseInt(query.id) : null

    // =======================
    // GET /api/companies
    // =======================
    if (method === 'GET' && !companyId) {
      const companies = await Company.find({}).sort({ id: 1 })
      return res.status(200).json(companies)
    }

    // =======================
    // POST /api/companies
    // =======================
    if (method === 'POST') {
      if (!body.name || !body.name.trim()) {
        return res.status(400).json({ error: 'Name is required' })
      }

      const newCompany = new Company({
        id: Date.now(),
        name: body.name.trim(),
        nameHindi: body.nameHindi || "",
        address: body.address || ""
      })

      await newCompany.save()

      return res.status(200).json(newCompany.toObject())
    }

    // =======================
    // PUT /api/companies/:id
    // =======================
    if (method === 'PUT' && companyId) {
      const updatedCompany = await Company.findOneAndUpdate(
        { id: companyId },
        body,
        { new: true }
      )

      if (!updatedCompany) {
        return res.status(404).json({ error: 'Company not found' })
      }

      return res.status(200).json(updatedCompany.toObject())
    }

    // =======================
    // DELETE /api/companies/:id
    // =======================
    if (method === 'DELETE' && companyId) {
      const result = await Company.findOneAndDelete({ id: companyId })

      if (!result) {
        return res.status(404).json({ error: 'Company not found' })
      }

      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
