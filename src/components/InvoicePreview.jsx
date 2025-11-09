import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FiPrinter, FiArrowLeft, FiDownload, FiCopy, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { exportInvoicesToJSON } from '../utils/invoiceStorage'
import DeleteConfirmationModal from './DeleteConfirmationModal'
import './InvoicePreview.css'

const InvoicePreview = ({ invoiceData, onReset, onBackToEdit, onEdit, onBackToList, isFromList = false, onDelete }) => {
  const invoiceRef = useRef(null)
  const [splitView, setSplitView] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const handlePrint = () => {
    if (splitView) {
      // Add class for split print
      document.body.classList.add('print-split-view')
    }
    window.print()
    setTimeout(() => {
      document.body.classList.remove('print-split-view')
    }, 1000)
  }

  const handleExportJSON = () => {
    exportInvoicesToJSON()
  }

  const handleDeleteClick = () => {
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (onDelete && invoiceData) {
      onDelete(invoiceData.invoiceNumber)
      setDeleteModalOpen(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCompanyName = () => {
    if (invoiceData.companyNameLang === 'english') {
      return invoiceData.fromNameEng || invoiceData.fromName
    }
    return invoiceData.fromName
  }

  const getToCompanyName = () => {
    if (invoiceData.toCompanyLang === 'hindi') {
      return invoiceData.toNameHindi || invoiceData.toName
    }
    return invoiceData.toName
  }

  const InvoiceContent = () => (
    <div ref={invoiceRef} className={`invoice-preview ${splitView ? 'split-view' : ''}`}>
      <div className="invoice-header">
        <div className="invoice-title-section">
          <h1>INVOICE</h1>
          <div className="invoice-number">
            <strong>Invoice #:</strong> {invoiceData.invoiceNumber}
          </div>
        </div>
        <div className="invoice-dates">
          <div className="date-item">
            <strong>Date:</strong> {formatDate(invoiceData.invoiceDate)}
          </div>
          {invoiceData.dueDate && (
            <div className="date-item">
              <strong>Due Date:</strong> {formatDate(invoiceData.dueDate)}
            </div>
          )}
        </div>
      </div>

      <div className="invoice-parties">
        <div className="party-section">
          <h3>From:</h3>
          <div className="party-info">
            <p className={`party-name hindi-text ${invoiceData.companyNameLang === 'english' ? 'english-text' : ''}`}>
              {getCompanyName()}
            </p>
            {invoiceData.fromAddress && (
              <p className="party-address">{invoiceData.fromAddress}</p>
            )}
            {invoiceData.fromEmail && (
              <p className="party-email">{invoiceData.fromEmail}</p>
            )}
          </div>
        </div>
        <div className="party-section">
          <h3>To:</h3>
          <div className="party-info">
            {getToCompanyName() && (
              <p className={`party-name ${invoiceData.toCompanyLang === 'hindi' ? 'hindi-text' : ''}`}>
                {getToCompanyName()}
              </p>
            )}
            {invoiceData.toAddress && (
              <p className="party-address">{invoiceData.toAddress}</p>
            )}
            {invoiceData.toVehicle && (
              <p className="party-vehicle">
                <strong>Vehicle:</strong> {invoiceData.toVehicle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="invoice-items">
        <table className="items-table">
          <thead>
            <tr>
              <th className="col-item">Item</th>
              <th className="col-rate">Rate</th>
              <th className="col-quantity">Quantity</th>
              <th className="col-amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map((item, index) => (
              <tr key={index}>
                <td className="col-item">{item.name}</td>
                <td className="col-rate">₹{parseFloat(item.rate).toFixed(2)}</td>
                <td className="col-quantity">{item.quantity}</td>
                <td className="col-amount">₹{item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="invoice-totals">
        <div className="totals-section">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>₹{invoiceData.subtotal.toFixed(2)}</span>
          </div>
          {invoiceData.totalMode === 'auto' && invoiceData.taxRate > 0 && (
            <div className="total-row">
              <span>Tax ({invoiceData.taxRate}%):</span>
              <span>₹{invoiceData.tax.toFixed(2)}</span>
            </div>
          )}
          {invoiceData.totalMode === 'auto' && invoiceData.discount > 0 && (
            <div className="total-row">
              <span>Discount:</span>
              <span>-₹{invoiceData.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="total-row total-final">
            <span>Total:</span>
            <span>₹{invoiceData.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="invoice-footer">
        <p>Thank you for your business!</p>
        {invoiceData.totalMode === 'manual' && (
          <p className="manual-total-note">
            * Total amount was manually entered
          </p>
        )}
      </div>

      {splitView && (
        <div className="signature-section">
          <div className="signature-box">
            <div className="signature-line"></div>
            <p>Customer Signature</p>
          </div>
          <div className="signature-box">
            <div className="signature-line"></div>
            <p>Authorized Signature</p>
          </div>
        </div>
      )}
      
      {isFromList && onEdit && !splitView && (
        <div className="edit-button-in-preview">
          <motion.button 
            onClick={onEdit} 
            className="btn-edit-in-preview"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiEdit2 /> Edit Invoice
          </motion.button>
        </div>
      )}
    </div>
  )

  if (splitView) {
    return (
      <div className="split-invoice-container">
        <div className="split-invoice-wrapper-horizontal">
          <InvoiceContent />
          <InvoiceContent />
        </div>
        <div className="split-invoice-actions">
          <motion.button 
            onClick={isFromList ? (onBackToList || onReset) : (onBackToEdit || onReset)} 
            className="btn-back"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiArrowLeft /> {isFromList ? 'Back to List' : 'Back to Edit'}
          </motion.button>
          <div className="action-buttons">
            <motion.button 
              onClick={handleExportJSON} 
              className="btn-export"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiDownload /> Export JSON
            </motion.button>
            <motion.button 
              onClick={handlePrint} 
              className="btn-print"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPrinter /> Print / Save as PDF
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="invoice-preview-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="invoice-actions">
        <div className="back-buttons-group">
          <motion.button 
            onClick={isFromList ? (onBackToList || onReset) : (onBackToEdit || onReset)} 
            className="btn-back"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiArrowLeft /> {isFromList ? 'Back to List' : 'Back to Edit'}
          </motion.button>
          {!isFromList && onEdit && (
            <motion.button 
              onClick={onEdit} 
              className="btn-edit-invoice"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiEdit2 /> Edit Invoice
            </motion.button>
          )}
          {isFromList && onDelete && (
            <motion.button 
              onClick={handleDeleteClick} 
              className="btn-delete-invoice"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiTrash2 /> Delete Invoice
            </motion.button>
          )}
        </div>
        <div className="action-buttons">
          <motion.button 
            onClick={() => setSplitView(!splitView)} 
            className="btn-split"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiCopy /> {splitView ? 'Single View' : 'Split View'}
          </motion.button>
          <motion.button 
            onClick={handleExportJSON} 
            className="btn-export"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiDownload /> Export JSON
          </motion.button>
          <motion.button 
            onClick={handlePrint} 
            className="btn-print"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPrinter /> Print / Save as PDF
          </motion.button>
        </div>
      </div>
      <InvoiceContent />
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        invoiceNumber={invoiceData?.invoiceNumber || ''}
      />
    </motion.div>
  )
}

export default InvoicePreview
