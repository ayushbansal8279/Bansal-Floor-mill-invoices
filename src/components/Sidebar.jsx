import { motion } from 'framer-motion'
import { FiHome, FiFileText, FiSettings, FiList } from 'react-icons/fi'
import './Sidebar.css'

const Sidebar = ({ activePage, setActivePage }) => {
  const menuItems = [
    { id: 'create', icon: FiHome, label: 'Create Invoice' },
    { id: 'invoices', icon: FiList, label: 'All Invoices' },
    { id: 'items', icon: FiSettings, label: 'Manage Items' },
  ]

  return (
    <motion.div 
      className="sidebar"
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      <div className="sidebar-header">
        <h2>Naresh Chand Chakki</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activePage === item.id
          return (
            <motion.button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon />
              <span>{item.label}</span>
            </motion.button>
          )
        })}
      </nav>
    </motion.div>
  )
}

export default Sidebar

