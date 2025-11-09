import { connectDB, Item } from '../../src/utils/mongodb.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    await connectDB()
    const { method, body, query } = req
    const itemId = parseInt(query.id)

    if (!itemId || isNaN(itemId)) {
      return res.status(400).json({ error: 'Invalid item ID' })
    }

    // PUT /api/items/:id
    if (method === 'PUT') {
      const updatedData = typeof body === 'string' ? JSON.parse(body) : body
      const updatedItem = await Item.findOneAndUpdate(
        { id: itemId },
        updatedData,
        { new: true }
      )
      
      if (!updatedItem) {
        return res.status(404).json({ error: 'Item not found' })
      }
      
      return res.status(200).json({ success: true, item: updatedItem.toObject() })
    }

    // DELETE /api/items/:id
    if (method === 'DELETE') {
      const result = await Item.findOneAndDelete({ id: itemId })
      
      if (!result) {
        return res.status(404).json({ error: 'Item not found' })
      }
      
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

