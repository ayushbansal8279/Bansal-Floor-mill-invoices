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

export const getItems = async () => {
  try {
    const items = await apiCall('/items')
    return items || []
  } catch (error) {
    console.error('Error loading items:', error)
    return []
  }
}

export const saveItems = async (items) => {
  try {
    // For bulk save, we'll delete all and recreate
    // This is a simple approach - in production, you'd want a bulk update endpoint
    const existingItems = await getItems()
    for (const item of items) {
      if (item.id && existingItems.find(i => i.id === item.id)) {
        await apiCall(`/items/${item.id}`, {
          method: 'PUT',
          body: JSON.stringify(item)
        })
      } else {
        await apiCall('/items', {
          method: 'POST',
          body: JSON.stringify(item)
        })
      }
    }
    return true
  } catch (error) {
    console.error('Error saving items:', error)
    return false
  }
}

export const addItem = async (item) => {
  try {
    const result = await apiCall('/items', {
      method: 'POST',
      body: JSON.stringify({
        ...item,
        id: item.id || Date.now()
      })
    })
    return result.item
  } catch (error) {
    console.error('Error adding item:', error)
    return null
  }
}

export const updateItem = async (id, updatedItem) => {
  try {
    const result = await apiCall(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedItem)
    })
    return result.success
  } catch (error) {
    console.error('Error updating item:', error)
    return false
  }
}

export const deleteItem = async (id) => {
  try {
    const result = await apiCall(`/items/${id}`, {
      method: 'DELETE'
    })
    return result.success
  } catch (error) {
    console.error('Error deleting item:', error)
    return false
  }
}
