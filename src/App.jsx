import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import InvoiceForm from './components/InvoiceForm'
import InvoicePreview from './components/InvoicePreview'
import InvoiceList from './components/InvoiceList'
import ItemManager from './components/ItemManager'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState('create')
  const [invoiceData, setInvoiceData] = useState(null)
  const [editingInvoiceData, setEditingInvoiceData] = useState(null)
  const [viewingFromList, setViewingFromList] = useState(false)
  const [pageDirection, setPageDirection] = useState(0)

  const handleInvoiceGenerate = (data, isUpdate = false) => {
    setInvoiceData(data)
    setViewingFromList(false) // Not viewing from list when generating
    if (!isUpdate) {
      setEditingInvoiceData(null) // Clear editing data when new invoice is generated
    }
  }

  const handleEditInvoice = (invoice) => {
    setEditingInvoiceData(invoice) // Set invoice data for editing
    setInvoiceData(null) // Hide preview, show form
    setActivePage('create') // Switch to create page
    setViewingFromList(false)
  }

  const handleViewFromList = (invoice) => {
    setInvoiceData(invoice)
    setViewingFromList(true)
  }

  const handleBackToEdit = () => {
    setEditingInvoiceData(invoiceData) // Save current invoice data for editing
    setInvoiceData(null) // Hide preview, show form
  }

  const handleReset = () => {
    // Keep invoiceData so form can restore it
  }

  const handlePageChange = (newPage) => {
    const currentIndex = ['create', 'invoices', 'items'].indexOf(activePage)
    const newIndex = ['create', 'invoices', 'items'].indexOf(newPage)
    setPageDirection(newIndex > currentIndex ? 1 : -1)
    setActivePage(newPage)
    setInvoiceData(null)
    // Reset editing data when switching to create page for new invoice
    if (newPage === 'create') {
      setEditingInvoiceData(null)
      setViewingFromList(false)
    }
  }

  const renderPage = () => {
    switch (activePage) {
      case 'create':
        return !invoiceData ? (
          <InvoiceForm 
            key={editingInvoiceData ? `edit-${editingInvoiceData.invoiceNumber}` : 'new-invoice'}
            onGenerate={handleInvoiceGenerate} 
            initialData={editingInvoiceData}
            isEditMode={!!editingInvoiceData}
          />
        ) : (
          <InvoicePreview 
            invoiceData={invoiceData} 
            onReset={handleReset} 
            onBackToEdit={handleBackToEdit}
            onEdit={viewingFromList ? () => handleEditInvoice(invoiceData) : undefined}
            isFromList={viewingFromList}
            onBackToList={() => {
              setViewingFromList(false)
              setInvoiceData(null)
              setActivePage('invoices')
            }}
          />
        )
      case 'invoices':
        return <InvoiceList onViewInvoice={handleViewFromList} onEditInvoice={handleEditInvoice} />
      case 'items':
        return <ItemManager />
      default:
        return <InvoiceForm onGenerate={handleInvoiceGenerate} />
    }
  }

  return (
    <div className="app">
      <Sidebar activePage={activePage} setActivePage={handlePageChange} />
      <div className="main-content">
        <AnimatePresence mode="wait" custom={pageDirection}>
          <motion.div
            key={activePage}
            custom={pageDirection}
            initial={{ opacity: 0, x: pageDirection * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: pageDirection * -50 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 100 }}
            className="page-content"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
