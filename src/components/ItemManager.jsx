import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiTrash2, FiEdit2, FiSave, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getItems, saveItems, addItem, updateItem, deleteItem } from '../utils/itemStorage'
import './ItemManager.css'

const ItemManager = () => {
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ name: '', rate: '' })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    setLoading(true)
    try {
      const savedItems = await getItems()
      setItems(savedItems)
      if (savedItems.length === 0) {
        toast.info('No items found. Add items using the "Add New Item" button.')
      }
    } catch (error) {
      console.error('Error loading items:', error)
      toast.error('Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (formData.name && formData.rate) {
      try {
        const newItem = await addItem({
          name: formData.name,
          rate: parseFloat(formData.rate)
        })
        if (newItem) {
          setItems([...items, newItem])
          setFormData({ name: '', rate: '' })
          setShowForm(false)
          toast.success('Item added successfully!')
        }
      } catch (error) {
        toast.error('Failed to add item')
      }
    } else {
      toast.error('Please fill all fields')
    }
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setFormData({ name: item.name, rate: item.rate.toString() })
    setShowForm(true)
  }

  const handleUpdate = async () => {
    if (formData.name && formData.rate && editingId) {
      try {
        const success = await updateItem(editingId, {
          name: formData.name,
          rate: parseFloat(formData.rate)
        })
        if (success) {
          setItems(items.map(item => 
            item.id === editingId 
              ? { ...item, name: formData.name, rate: parseFloat(formData.rate) }
              : item
          ))
          setEditingId(null)
          setFormData({ name: '', rate: '' })
          setShowForm(false)
          toast.success('Item updated successfully!')
        }
      } catch (error) {
        toast.error('Failed to update item')
      }
    } else {
      toast.error('Please fill all fields')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const success = await deleteItem(id)
        if (success) {
          setItems(items.filter(item => item.id !== id))
          toast.success('Item deleted successfully!')
        }
      } catch (error) {
        toast.error('Failed to delete item')
      }
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({ name: '', rate: '' })
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ fontSize: '48px' }}
        >
          ⏳
        </motion.div>
        <p>Loading items...</p>
      </div>
    )
  }

  return (
    <motion.div 
      className="item-manager"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="item-manager-header">
        <h2>Manage Items</h2>
        {!showForm && (
          <motion.button
            className="btn-add-item"
            onClick={() => setShowForm(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPlus /> Add New Item
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="item-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3>{editingId ? 'Edit Item' : 'Add New Item'}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Item Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter item name"
                />
              </div>
              <div className="form-group">
                <label>Rate (₹)</label>
                <input
                  type="number"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="form-actions">
              <motion.button
                className="btn-save"
                onClick={editingId ? handleUpdate : handleAdd}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiSave /> {editingId ? 'Update' : 'Save'}
              </motion.button>
              <motion.button
                className="btn-cancel"
                onClick={handleCancel}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiX /> Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="items-list">
        <AnimatePresence>
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="empty-state"
            >
              <p>No items found. Add your first item!</p>
            </motion.div>
          ) : (
            items.map((item) => (
              <motion.div
                key={item.id}
                className="item-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              >
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p className="item-rate">₹{parseFloat(item.rate).toFixed(2)}</p>
                </div>
                <div className="item-actions">
                  <motion.button
                    className="btn-edit"
                    onClick={() => handleEdit(item)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Edit item"
                  >
                    <FiEdit2 />
                  </motion.button>
                  <motion.button
                    className="btn-delete"
                    onClick={() => handleDelete(item.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Delete item"
                  >
                    <FiTrash2 />
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default ItemManager
