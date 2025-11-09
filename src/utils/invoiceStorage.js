// Use Vercel API routes in production, local API in development
const API_BASE_URL = import.meta.env.PROD 
  ? '/api' 
  : (import.meta.env.VITE_API_URL || '/api')

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

export const saveInvoice = async (invoiceData, isUpdate = false) => {
  try {
    if (isUpdate && invoiceData.invoiceNumber) {
      // Update existing invoice
      const result = await apiCall(`/invoices/${invoiceData.invoiceNumber}`, {
        method: 'PUT',
        body: JSON.stringify(invoiceData)
      })
      return result.success
    } else {
      // Create new invoice
      const result = await apiCall('/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData)
      })
      return result.success
    }
  } catch (error) {
    console.error('Error saving invoice:', error)
    console.error('API Base URL:', API_BASE_URL)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    })
    throw error // Re-throw to let the component handle it
  }
}

export const updateInvoice = async (invoiceNumber, updatedData) => {
  try {
    const result = await apiCall(`/invoices/${invoiceNumber}`, {
      method: 'PUT',
      body: JSON.stringify({ ...updatedData, invoiceNumber })
    })
    return result.success
  } catch (error) {
    console.error('Error updating invoice:', error)
    return false
  }
}

export const deleteInvoice = async (invoiceNumber) => {
  try {
    const result = await apiCall(`/invoices/${invoiceNumber}`, {
      method: 'DELETE'
    })
    return result.success
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return false
  }
}

export const getInvoices = async () => {
  try {
    const invoices = await apiCall('/invoices')
    return invoices || []
  } catch (error) {
    console.error('Error loading invoices:', error)
    return []
  }
}

export const getLastInvoiceNumber = async () => {
  try {
    const result = await apiCall('/invoices/last-number')
    return result.lastNumber || 0
  } catch (error) {
    console.error('Error getting last invoice number:', error)
    return 0
  }
}

export const getNextInvoiceNumber = async () => {
  try {
    const result = await apiCall('/invoices/next-number')
    return result.nextNumber || 1
  } catch (error) {
    console.error('Error getting next invoice number:', error)
    return 1
  }
}

const extractInvoiceNumber = (invoiceNumber) => {
  // Extract number from formats like "INV-1", "1", "INV001", etc.
  const match = invoiceNumber.toString().match(/\d+/)
  return match ? parseInt(match[0], 10) : null
}

export const exportInvoicesToJSON = async () => {
  try {
    const invoices = await getInvoices()
    const dataStr = JSON.stringify(invoices, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoices_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting invoices:', error)
  }
}

export const importInvoicesFromJSON = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const invoices = JSON.parse(e.target.result)
        if (Array.isArray(invoices)) {
          // Import each invoice
          for (const invoice of invoices) {
            await saveInvoice(invoice, false)
          }
          resolve(invoices)
        } else {
          reject(new Error('Invalid JSON format'))
        }
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}
