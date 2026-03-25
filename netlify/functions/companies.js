import { connectDB, Company } from '../../src/utils/mongodb.js'

export const handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    await connectDB()
    const path = event.path.replace('/api/companies', '').replace(/^\//, '')
    const isSuggestions = path === 'suggestions'
    const url = new URL(event.rawUrl || `http://localhost${event.path}${event.rawQuery ? '?' + event.rawQuery : ''}`)
    const searchTerm = url.searchParams.get('q') || ''

    // GET /api/companies/suggestions
    if (event.httpMethod === 'GET' && isSuggestions) {
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
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(companyNames)
      }
    }

    // GET /api/companies
    if (event.httpMethod === 'GET') {
      const companies = await Company.find({})
      const companyNames = companies.map(c => c.name)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(companyNames)
      }
    }

    // POST /api/companies
    if (event.httpMethod === 'POST') {
      let companyName = event.body
      try {
        companyName = JSON.parse(event.body)
      } catch (e) {
        // If not JSON, use as-is
      }
      
      if (!companyName || !companyName.trim()) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Empty company name' })
        }
      }
      
      const existing = await Company.findOne({ name: companyName })
      if (existing) {
        const allCompanies = await Company.find({})
        const companyNames = allCompanies.map(c => c.name)
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, companies: companyNames, message: 'Company already exists' })
        }
      }
      
      const newCompany = new Company({ name: companyName.trim() })
      await newCompany.save()
      
      const allCompanies = await Company.find({})
      const companyNames = allCompanies.map(c => c.name)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, companies: companyNames })
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

