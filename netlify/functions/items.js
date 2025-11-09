import { connectDB, Item } from '../../src/utils/mongodb.js'

export const handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    const path = event.path.replace('/api/items', '').replace(/^\//, '')
    const itemId = path ? parseInt(path) : null

    // GET /api/items
    if (event.httpMethod === 'GET' && !path) {
      const items = await Item.find({}).sort({ id: 1 })
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(items)
      }
    }

    // POST /api/items
    if (event.httpMethod === 'POST') {
      const itemData = JSON.parse(event.body)
      const newItem = new Item({
        ...itemData,
        id: itemData.id || Date.now()
      })
      await newItem.save()
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, item: newItem.toObject() })
      }
    }

    // PUT /api/items/:id
    if (event.httpMethod === 'PUT' && itemId) {
      const updatedData = JSON.parse(event.body)
      const updatedItem = await Item.findOneAndUpdate(
        { id: itemId },
        updatedData,
        { new: true }
      )
      
      if (!updatedItem) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Item not found' })
        }
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, item: updatedItem.toObject() })
      }
    }

    // DELETE /api/items/:id
    if (event.httpMethod === 'DELETE' && itemId) {
      const result = await Item.findOneAndDelete({ id: itemId })
      
      if (!result) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Item not found' })
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

