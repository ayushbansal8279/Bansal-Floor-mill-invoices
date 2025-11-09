import { connectDB, Item } from '../src/utils/mongodb.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    await connectDB()
    const { query, method, body } = req
    const itemId = query.id ? parseInt(query.id) : null

    // GET /api/items
    if (method === 'GET' && !itemId) {
      const items = await Item.find({}).sort({ id: 1 })
      return res.status(200).json(items)
    }

    // POST /api/items
    if (method === 'POST') {
      const itemData = typeof body === 'string' ? JSON.parse(body) : body
      const newItem = new Item({
        ...itemData,
        id: itemData.id || Date.now()
      })
      await newItem.save()
      return res.status(200).json({ success: true, item: newItem.toObject() })
    }

    // PUT /api/items/:id
    if (method === 'PUT' && itemId) {
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
    if (method === 'DELETE' && itemId) {
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

