import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiAlertTriangle, FiX } from 'react-icons/fi'
import './DeleteConfirmationModal.css'

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, invoiceNumber }) => {
  const [confirmText, setConfirmText] = useState('')
  const isConfirmValid = confirmText.toLowerCase() === 'delete'

  const handleConfirm = () => {
    if (isConfirmValid) {
      onConfirm()
      setConfirmText('')
      onClose()
    }
  }

  const handleClose = () => {
    setConfirmText('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={handleClose}>
        <motion.div
          className="delete-modal"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="modal-title-section">
              <FiAlertTriangle className="warning-icon" />
              <h3>Delete Invoice</h3>
            </div>
            <button className="modal-close-btn" onClick={handleClose}>
              <FiX />
            </button>
          </div>

          <div className="modal-content">
            <p className="warning-message">
              Are you sure you want to delete invoice <strong>{invoiceNumber}</strong>?
            </p>
            <p className="confirmation-instruction">
              This action cannot be undone. Type <strong>"delete"</strong> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type 'delete' to confirm"
              className="confirm-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isConfirmValid) {
                  handleConfirm()
                } else if (e.key === 'Escape') {
                  handleClose()
                }
              }}
            />
          </div>

          <div className="modal-actions">
            <motion.button
              className="btn-cancel"
              onClick={handleClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancel
            </motion.button>
            <motion.button
              className={`btn-delete-confirm ${isConfirmValid ? 'enabled' : 'disabled'}`}
              onClick={handleConfirm}
              disabled={!isConfirmValid}
              whileHover={isConfirmValid ? { scale: 1.05 } : {}}
              whileTap={isConfirmValid ? { scale: 0.95 } : {}}
            >
              Delete Invoice
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default DeleteConfirmationModal

