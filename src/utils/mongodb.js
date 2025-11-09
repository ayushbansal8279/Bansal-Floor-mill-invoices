import mongoose from 'mongoose'

// MongoDB connection string - URL encode special characters in password (@ becomes %40)
// In Vercel/Netlify, use environment variable MONGODB_URI
const DEFAULT_MONGODB_URI = 'mongodb+srv://bansalayush8279:Ayush%401234@cluster0.jfltuuy.mongodb.net/invoice-app?retryWrites=true&w=majority'
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI

let isConnected = false

// Connect to MongoDB
export const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return
  }

  try {
    // Close existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close()
    }

    const uri = process.env.MONGODB_URI || MONGODB_URI
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set')
    }

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    isConnected = true
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    console.error('Connection string used:', process.env.MONGODB_URI ? 'From env var' : 'Default')
    isConnected = false
    throw error
  }
}

// Invoice Schema
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  invoiceDate: { type: String, required: true },
  fromName: { type: String, default: '' },
  fromNameEng: { type: String, default: '' },
  fromAddress: { type: String, default: '' },
  toName: { type: String, default: '' },
  toNameHindi: { type: String, default: '' },
  toAddress: { type: String, default: '' },
  toVehicle: { type: String, default: '' },
  items: [{
    name: String,
    rate: Number,
    quantity: Number,
    amount: Number,
    ratePrefilled: Boolean
  }],
  subtotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  savedAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: '' }
}, {
  timestamps: false // We're managing timestamps manually
})

// Last Invoice Number Schema
const lastInvoiceNumberSchema = new mongoose.Schema({
  _id: { type: String, default: 'lastInvoiceNumber' },
  lastNumber: { type: Number, default: 0 }
})

// Predefined Items Schema
const itemSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  rate: { type: Number, default: 0 }
})

// Company Schema (for autofill)
const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  nameHindi: { type: String, default: '' },
  address: { type: String, default: '' },
  vehicle: { type: String, default: '' }
})

// Create models
export const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema)
export const LastInvoiceNumber = mongoose.models.LastInvoiceNumber || mongoose.model('LastInvoiceNumber', lastInvoiceNumberSchema)
export const Item = mongoose.models.Item || mongoose.model('Item', itemSchema)
export const Company = mongoose.models.Company || mongoose.model('Company', companySchema)

// Initialize connection on import
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB on startup:', err)
})

