import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiPlus, FiTrash2, FiSave, FiChevronUp, FiChevronDown } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getItems } from '../utils/itemStorage'
import { getNextInvoiceNumber, saveInvoice, updateInvoice } from '../utils/invoiceStorage'
import { saveCompany, getCompanySuggestions } from '../utils/companyStorage'
import './InvoiceForm.css'

const InvoiceForm = ({ onGenerate, initialData = null, isEditMode = false }) => {
  const [companyNameLang, setCompanyNameLang] = useState('hindi')
  const [toCompanyLang, setToCompanyLang] = useState('english')
  const [invoiceInfo, setInvoiceInfo] = useState({
    fromName: 'कीर्ति भोग आटा',
    fromNameEng: 'Kirti Bhog Aata',
    fromAddress: 'Gulaothi',
    fromEmail: '',
    toName: '',
    toNameHindi: '',
    toAddress: '',
    toVehicle: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
  })

  const [items, setItems] = useState([
    { id: 1, name: '', rate: 0, quantity: 1, amount: 0, ratePrefilled: false }
  ])

  const [predefinedItems, setPredefinedItems] = useState([])
  const [taxRate, setTaxRate] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [companySuggestions, setCompanySuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [isEditingTotal, setIsEditingTotal] = useState(false)
  const [editedTotal, setEditedTotal] = useState(0)
  const suggestionsRef = useRef(null)

  useEffect(() => {
    if (initialData) {
      // Restore form data when coming back from preview
      setInvoiceInfo(initialData)
      setCompanyNameLang(initialData.companyNameLang || 'hindi')
      setToCompanyLang(initialData.toCompanyLang || 'english')
      setTaxRate(initialData.taxRate || 0)
      setDiscount(initialData.discount || 0)
      if (initialData.items && initialData.items.length > 0) {
        setItems(initialData.items.map((item, idx) => ({
          ...item,
          id: item.id || Date.now() + idx,
          ratePrefilled: false
        })))
      }
    } else {
      // Always get next invoice number for new invoices
      getNextInvoiceNumber().then(nextInvoiceNum => {
        setInvoiceInfo(prev => ({
          ...prev,
          invoiceNumber: `INV-${nextInvoiceNum}`,
          invoiceDate: new Date().toISOString().split('T')[0] // Reset date to today
        }))
      })
    }
    loadPredefinedItems()
  }, [initialData, isEditMode])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadPredefinedItems = async () => {
    try {
      const savedItems = await getItems()
      setPredefinedItems(savedItems)
    } catch (error) {
      console.error('Error loading items:', error)
      toast.error('Failed to load predefined items')
    }
  }

  const calculateItemAmount = (rate, quantity) => {
    return parseFloat(rate) * parseFloat(quantity) || 0
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0)
  }

  const calculateTax = () => {
    const subtotal = calculateSubtotal()
    return (subtotal * parseFloat(taxRate)) / 100 || 0
  }

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal()
    return parseFloat(discount) || 0
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax()
    const discountAmount = calculateDiscountAmount()
    return subtotal + tax - discountAmount
  }

  const handleTotalClick = () => {
    const currentTotal = calculateTotal()
    setEditedTotal(currentTotal)
    setIsEditingTotal(true)
  }

  const handleTotalChange = (newTotal) => {
    const newTotalValue = parseFloat(newTotal) || 0
    const currentSubtotal = calculateSubtotal()
    
    if (currentSubtotal === 0 || newTotalValue === 0) {
      setIsEditingTotal(false)
      return
    }

    // Calculate what the subtotal should be to achieve the desired total
    // Formula: total = subtotal + (subtotal * taxRate/100) - discount
    // Rearranging: subtotal = (total + discount) / (1 + taxRate/100)
    
    const taxRateDecimal = parseFloat(taxRate) / 100 || 0
    const discountAmount = parseFloat(discount) || 0
    
    // Handle division by zero when taxRate is 0
    let targetSubtotal
    if (taxRateDecimal === 0) {
      targetSubtotal = newTotalValue + discountAmount
    } else {
      targetSubtotal = (newTotalValue + discountAmount) / (1 + taxRateDecimal)
    }

    // Calculate ratio to adjust rates proportionally to achieve target subtotal
    const ratio = currentSubtotal > 0 ? targetSubtotal / currentSubtotal : 1

    // Adjust all item rates proportionally
    setItems(items.map(item => {
      if (item.rate > 0 && item.quantity > 0) {
        const newRate = item.rate * ratio
        return {
          ...item,
          rate: parseFloat(newRate.toFixed(2)),
          amount: calculateItemAmount(newRate, item.quantity),
          ratePrefilled: false // Mark as manually adjusted
        }
      }
      return item
    }))

    setIsEditingTotal(false)
  }

  const handleTotalBlur = () => {
    if (isEditingTotal) {
      handleTotalChange(editedTotal)
    }
  }

  const handleTotalKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTotalChange(editedTotal)
    } else if (e.key === 'Escape') {
      setIsEditingTotal(false)
      setEditedTotal(calculateTotal())
    }
  }

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        if (field === 'rate') {
          // Clear prefilled flag when user manually changes rate
          updatedItem.ratePrefilled = false
          updatedItem.amount = calculateItemAmount(value, updatedItem.quantity)
        } else if (field === 'quantity') {
          updatedItem.amount = calculateItemAmount(updatedItem.rate, value)
        }
        return updatedItem
      }
      return item
    }))
  }

  const handlePredefinedItemSelect = (itemId, predefinedItem) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedItem = {
          ...item,
          name: predefinedItem.name,
          rate: predefinedItem.rate,
          ratePrefilled: true
        }
        updatedItem.amount = calculateItemAmount(updatedItem.rate, updatedItem.quantity)
        return updatedItem
      }
      return item
    }))
  }

  const handleRateChange = (id, delta) => {
    const item = items.find(i => i.id === id)
    if (item) {
      const newRate = Math.max(0, parseFloat(item.rate || 0) + delta)
      handleItemChange(id, 'rate', newRate)
    }
  }

  const handleQuantityChange = (id, delta) => {
    const item = items.find(i => i.id === id)
    if (item) {
      const newQuantity = Math.max(0, parseFloat(item.quantity || 1) + delta)
      handleItemChange(id, 'quantity', newQuantity)
    }
  }

  const handleAddItem = () => {
    setItems([...items, {
      id: Date.now(),
      name: '',
      rate: 0,
      quantity: 1,
      amount: 0,
      ratePrefilled: false
    }])
  }

  const handleRemoveItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const handleToNameChange = async (value) => {
    setInvoiceInfo({ ...invoiceInfo, toName: value })
    if (value.trim()) {
      try {
        const suggestions = await getCompanySuggestions(value)
        setCompanySuggestions(suggestions)
        setShowSuggestions(suggestions.length > 0)
      } catch (error) {
        console.error('Error getting suggestions:', error)
        setShowSuggestions(false)
      }
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionSelect = (suggestion) => {
    setInvoiceInfo({ ...invoiceInfo, toName: suggestion })
    setShowSuggestions(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      // Save company name for autofill
      if (invoiceInfo.toName.trim()) {
        await saveCompany(invoiceInfo.toName)
      }
      
      const invoiceData = {
        ...invoiceInfo,
        companyNameLang,
        toCompanyLang,
        items: items.filter(item => item.name.trim() !== ''),
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        taxRate: parseFloat(taxRate) || 0,
        discount: calculateDiscountAmount(),
        total: calculateTotal(),
        totalMode: 'auto'
      }
      
      if (isEditMode && invoiceInfo.invoiceNumber) {
        // Update existing invoice
        const success = await updateInvoice(invoiceInfo.invoiceNumber, invoiceData)
        if (success) {
          toast.success('Invoice updated successfully!')
          onGenerate(invoiceData, true)
        } else {
          const errorMsg = 'Failed to update invoice. Please check if the server is running.'
          setSubmitError(errorMsg)
          toast.error(errorMsg)
        }
      } else {
        // Save new invoice
        const success = await saveInvoice(invoiceData)
        if (success) {
          toast.success('Invoice saved successfully!')
          onGenerate(invoiceData, false)
        } else {
          const errorMsg = 'Failed to save invoice. Please check if the server is running on http://localhost:3001'
          setSubmitError(errorMsg)
          toast.error(errorMsg)
        }
      }
    } catch (error) {
      console.error('Error submitting invoice:', error)
      const errorMsg = `Error: ${error.message || 'Failed to save invoice. Please ensure the backend server is running.'}`
      setSubmitError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.form 
      className="invoice-form" 
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="form-section">
        <h2>Invoice Information</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Invoice Number</label>
            <input
              type="text"
              value={invoiceInfo.invoiceNumber}
              onChange={(e) => setInvoiceInfo({ ...invoiceInfo, invoiceNumber: e.target.value })}
              required
              className="invoice-number-input"
            />
          </div>
          <div className="form-group">
            <label>Invoice Date</label>
            <input
              type="date"
              value={invoiceInfo.invoiceDate}
              onChange={(e) => setInvoiceInfo({ ...invoiceInfo, invoiceDate: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              value={invoiceInfo.dueDate}
              onChange={(e) => setInvoiceInfo({ ...invoiceInfo, dueDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="section-header-with-toggle">
          <h2>From (Your Information)</h2>
          <div className="language-toggle">
            <label>Language:</label>
            <select
              value={companyNameLang}
              onChange={(e) => setCompanyNameLang(e.target.value)}
              className="lang-select"
            >
              <option value="hindi">Hindi</option>
              <option value="english">English</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Name/Company</label>
          <input
            type="text"
            value={companyNameLang === 'hindi' ? invoiceInfo.fromName : invoiceInfo.fromNameEng}
            onChange={(e) => {
              if (companyNameLang === 'hindi') {
                setInvoiceInfo({ ...invoiceInfo, fromName: e.target.value })
              } else {
                setInvoiceInfo({ ...invoiceInfo, fromNameEng: e.target.value })
              }
            }}
            required
            className="hindi-input"
          />
        </div>
        <div className="form-group">
          <label>Address</label>
          <textarea
            value={invoiceInfo.fromAddress}
            onChange={(e) => setInvoiceInfo({ ...invoiceInfo, fromAddress: e.target.value })}
            rows="3"
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={invoiceInfo.fromEmail}
            onChange={(e) => setInvoiceInfo({ ...invoiceInfo, fromEmail: e.target.value })}
          />
        </div>
      </div>

      <div className="form-section">
        <div className="section-header-with-toggle">
          <h2>To (Client Information)</h2>
          <div className="language-toggle">
            <label>Language:</label>
            <select
              value={toCompanyLang}
              onChange={(e) => {
                const newLang = e.target.value
                // Get the currently displayed value (before language change)
                const currentDisplayedValue = toCompanyLang === 'hindi' 
                  ? invoiceInfo.toNameHindi 
                  : invoiceInfo.toName
                
                // Auto-convert name when language changes - copy current displayed value to the other field
                if (newLang === 'hindi') {
                  // Switching to Hindi - copy current displayed value (English) to Hindi field
                  if (currentDisplayedValue) {
                    setInvoiceInfo({ 
                      ...invoiceInfo, 
                      toNameHindi: currentDisplayedValue 
                    })
                  }
                } else {
                  // Switching to English - copy current displayed value (Hindi) to English field
                  if (currentDisplayedValue) {
                    setInvoiceInfo({ 
                      ...invoiceInfo, 
                      toName: currentDisplayedValue 
                    })
                  }
                }
                setToCompanyLang(newLang)
              }}
              className="lang-select"
            >
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Name/Company</label>
          <div className="autocomplete-wrapper" ref={suggestionsRef}>
            <input
              type="text"
              value={toCompanyLang === 'hindi' ? invoiceInfo.toNameHindi : invoiceInfo.toName}
              onChange={(e) => {
                const value = e.target.value
                if (toCompanyLang === 'hindi') {
                  setInvoiceInfo({ ...invoiceInfo, toNameHindi: value })
                } else {
                  handleToNameChange(value)
                }
              }}
              onFocus={async () => {
                if (invoiceInfo.toName) {
                  try {
                    const suggestions = await getCompanySuggestions(invoiceInfo.toName)
                    setCompanySuggestions(suggestions)
                    setShowSuggestions(suggestions.length > 0)
                  } catch (error) {
                    console.error('Error getting suggestions:', error)
                  }
                }
              }}
              required
              className={toCompanyLang === 'hindi' ? 'hindi-input' : ''}
            />
            {showSuggestions && companySuggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {companySuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="suggestion-item"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="form-group">
          <label>Address</label>
          <textarea
            value={invoiceInfo.toAddress}
            onChange={(e) => setInvoiceInfo({ ...invoiceInfo, toAddress: e.target.value })}
            rows="3"
          />
        </div>
        <div className="form-group">
          <label>Vehicle</label>
          <input
            type="text"
            value={invoiceInfo.toVehicle}
            onChange={(e) => setInvoiceInfo({ ...invoiceInfo, toVehicle: e.target.value })}
            placeholder="Vehicle number or details"
          />
        </div>
      </div>

      <div className="form-section">
        <div className="section-header">
          <h2>Items</h2>
        </div>
        <div className="items-table">
          <div className="items-header">
            <div className="col-item">Item Name</div>
            <div className="col-rate">Rate (₹)</div>
            <div className="col-quantity">Quantity</div>
            <div className="col-amount">Amount (₹)</div>
            <div className="col-action">Action</div>
          </div>
          {items.map((item) => (
            <motion.div 
              key={item.id} 
              className="items-row"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="col-item">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const selectedItem = predefinedItems.find(p => p.name === e.target.value)
                      if (selectedItem) {
                        handlePredefinedItemSelect(item.id, selectedItem)
                      }
                    }
                  }}
                  className="predefined-select"
                >
                  <option value="">Select Item or Type...</option>
                  {predefinedItems.map((preItem) => (
                    <option key={preItem.id} value={preItem.name}>{preItem.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                  placeholder="Item name"
                  required
                  className="item-name-input"
                />
              </div>
              <div className="col-rate">
                <div className="number-input-wrapper">
                  <input
                    type="number"
                    value={item.rate === 0 ? '' : (item.rate || '')}
                    onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                    className={`number-input visible-number ${item.ratePrefilled ? 'prefilled' : ''}`}
                    style={{ 
                      color: '#1a1a1a',
                      WebkitTextFillColor: '#1a1a1a',
                      textFillColor: '#1a1a1a'
                    }}
                  />
                  <div className="number-controls">
                    <button
                      type="button"
                      className="number-btn up"
                      onClick={() => handleRateChange(item.id, 0.01)}
                      title="Increase rate"
                    >
                      <FiChevronUp />
                    </button>
                    <button
                      type="button"
                      className="number-btn down"
                      onClick={() => handleRateChange(item.id, -0.01)}
                      title="Decrease rate"
                    >
                      <FiChevronDown />
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-quantity">
                <div className="number-input-wrapper">
                  <input
                    type="number"
                    value={item.quantity === 0 ? '' : (item.quantity || '')}
                    onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                    placeholder="1"
                    min="0"
                    step="1"
                    required
                    className="number-input visible-number"
                    style={{ 
                      color: '#1a1a1a',
                      WebkitTextFillColor: '#1a1a1a',
                      textFillColor: '#1a1a1a'
                    }}
                  />
                  <div className="number-controls">
                    <button
                      type="button"
                      className="number-btn up"
                      onClick={() => handleQuantityChange(item.id, 1)}
                      title="Increase quantity"
                    >
                      <FiChevronUp />
                    </button>
                    <button
                      type="button"
                      className="number-btn down"
                      onClick={() => handleQuantityChange(item.id, -1)}
                      title="Decrease quantity"
                    >
                      <FiChevronDown />
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-amount">
                <span className="amount-display">
                  ₹{item.amount.toFixed(2)}
                </span>
              </div>
              <div className="col-action">
                <motion.button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="btn-remove"
                  disabled={items.length === 1}
                  whileHover={{ scale: items.length > 1 ? 1.1 : 1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiTrash2 />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="add-item-container">
          <motion.button 
            type="button" 
            onClick={handleAddItem} 
            className="btn-add"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPlus /> Add Item
          </motion.button>
        </div>
      </div>

      <div className="form-section">
        <h2>Totals</h2>
        <div className="totals-breakdown">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>₹{calculateSubtotal().toFixed(2)}</span>
          </div>
          <div className="total-row">
            <div className="tax-input-group">
              <label>Tax Rate (%):</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                min="0"
                step="0.01"
                className="tax-input"
              />
            </div>
            <span>₹{calculateTax().toFixed(2)}</span>
          </div>
          <div className="total-row">
            <div className="discount-input-group">
              <label>Discount (₹):</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                min="0"
                step="0.01"
                className="discount-input"
              />
            </div>
            <span>-₹{calculateDiscountAmount().toFixed(2)}</span>
          </div>
          <div className="total-row total-final">
            <span>Total:</span>
            {isEditingTotal ? (
              <input
                type="number"
                value={editedTotal}
                onChange={(e) => setEditedTotal(e.target.value)}
                onBlur={handleTotalBlur}
                onKeyDown={handleTotalKeyPress}
                min="0"
                step="0.01"
                className="editable-total-input"
                autoFocus
                style={{
                  width: '120px',
                  padding: '8px',
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  textAlign: 'right',
                  border: '2px solid #3498db',
                  borderRadius: '4px',
                  color: '#3498db'
                }}
              />
            ) : (
              <span 
                onClick={handleTotalClick}
                className="editable-total"
                style={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e3f2fd'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                title="Click to edit total (rates will adjust proportionally)"
              >
                ₹{calculateTotal().toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="form-actions">
        {submitError && (
          <div className="error-message" style={{ 
            color: '#d32f2f', 
            backgroundColor: '#ffebee', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '10px',
            border: '1px solid #ef5350'
          }}>
            {submitError}
          </div>
        )}
        <motion.button 
          type="submit" 
          className="btn-generate"
          disabled={isSubmitting}
          whileHover={!isSubmitting ? { scale: 1.05 } : {}}
          whileTap={!isSubmitting ? { scale: 0.95 } : {}}
          style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
        >
          <FiSave /> {isSubmitting ? 'Saving...' : 'Generate & Save Invoice'}
        </motion.button>
      </div>
    </motion.form>
  )
}

export default InvoiceForm
