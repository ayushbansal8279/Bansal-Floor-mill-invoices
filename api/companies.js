import { connectDB, Company } from '../src/utils/mongodb.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    await connectDB()
    const { query, method, body } = req
    const isSuggestions = query.path === 'suggestions'
    const searchTerm = query.q || ''

    // GET /api/companies/suggestions
    if (method === 'GET' && isSuggestions) {
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
      const companyNames = companies.map(c => c.name)
      return res.status(200).json(companyNames)
    }

    // GET /api/companies
    if (method === 'GET') {
      const companies = await Company.find({})
      const companyNames = companies.map(c => c.name)
      return res.status(200).json(companyNames)
    }

    // POST /api/companies
    if (method === 'POST') {
      let companyName = body
      try {
        companyName = typeof body === 'string' ? JSON.parse(body) : body
      } catch (e) {
        // If not JSON, use as-is
      }
      
      if (!companyName || !companyName.trim()) {
        return res.status(200).json({ success: true, message: 'Empty company name' })
      }
      
      const existing = await Company.findOne({ name: companyName })
      if (existing) {
        const allCompanies = await Company.find({})
        const companyNames = allCompanies.map(c => c.name)
        return res.status(200).json({ success: true, companies: companyNames, message: 'Company already exists' })
      }
      
      const newCompany = new Company({ name: companyName.trim() })
      await newCompany.save()
      
      const allCompanies = await Company.find({})
      const companyNames = allCompanies.map(c => c.name)
      return res.status(200).json({ success: true, companies: companyNames })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

