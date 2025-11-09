const API_BASE_URL = '/api'

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Request failed')
    }
    
    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

export const getCompanies = async () => {
  try {
    const companies = await apiCall('/companies')
    return companies || []
  } catch (error) {
    console.error('Error loading companies:', error)
    return []
  }
}

export const saveCompany = async (companyName) => {
  try {
    const result = await apiCall('/companies', {
      method: 'POST',
      body: JSON.stringify(companyName)
    })
    return result.success
  } catch (error) {
    console.error('Error saving company:', error)
    return false
  }
}

export const getCompanySuggestions = async (searchTerm = '') => {
  try {
    const suggestions = await apiCall(`/companies/suggestions?q=${encodeURIComponent(searchTerm)}`)
    return suggestions || []
  } catch (error) {
    console.error('Error getting suggestions:', error)
    return []
  }
}
