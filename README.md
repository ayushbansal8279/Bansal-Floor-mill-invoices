# Naresh Chand Chakki - Invoice Generator

A fully functional invoice generation application built with React and Vite. Create professional invoices with persistent file-based storage that can be accessed anytime, anywhere. **No separate backend server needed** - everything runs in a single Vite dev server!

## Features

- ✅ Add multiple items with name, rate, and quantity
- ✅ Predefined items with selection from list
- ✅ Automatic amount calculation (rate × quantity)
- ✅ Automatic total calculation with tax and discount
- ✅ Manual total entry option
- ✅ Professional invoice preview
- ✅ Print/Save as PDF functionality
- ✅ Split view for two invoices on one page
- ✅ View and search all previous invoices
- ✅ Edit and delete invoices
- ✅ **MongoDB database** - All invoice data stored in MongoDB cloud database
- ✅ Responsive design for mobile and desktop
- ✅ Modern, beautiful UI with animations
- ✅ Hindi/English language support for company names

## Data Storage

**Invoices are now stored in MongoDB:**
- All invoice data is saved to MongoDB Atlas cloud database
- Database: `invoice-app`
- Collections: `invoices`, `items`, `companies`, `lastinvoicenumbers`

This means your invoice data is:
- ✅ **Cloud-based** - Stored in MongoDB Atlas, accessible from anywhere
- ✅ **Persistent** - Never lost, even if you clear browser data
- ✅ **Scalable** - Can handle thousands of invoices
- ✅ **Secure** - Protected by MongoDB authentication
- ✅ **Backed up** - MongoDB Atlas provides automatic backups


## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

That's it! The Vite dev server includes built-in API middleware that handles all file operations. No need to run a separate backend server!

The app will be available at: `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Fill in Invoice Information**: Enter invoice number, dates, and your details
2. **Add Client Information**: Enter the recipient's name and address
3. **Add Items**: 
   - Select from predefined items or enter manually
   - Enter item name, rate, and quantity
   - Amount is automatically calculated
   - Click "Add Item" to add more items
4. **Choose Total Mode**:
   - **Automatic**: System calculates total with optional tax and discount
   - **Manual**: Enter the total amount manually
5. **Generate Invoice**: Click "Generate Invoice" to preview
6. **Print/Save**: Use the print button to save as PDF or print
7. **View All Invoices**: Navigate to "All Invoices" from the sidebar to view, search, edit, or delete previous invoices

## API Endpoints

The Vite dev server includes built-in API middleware that provides the following REST API endpoints:

- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:invoiceNumber` - Get single invoice
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:invoiceNumber` - Update invoice
- `DELETE /api/invoices/:invoiceNumber` - Delete invoice
- `GET /api/invoices/last-number` - Get last invoice number
- `GET /api/invoices/next-number` - Get next invoice number
- `GET /api/invoices/export/json` - Export all invoices as JSON
- `GET /api/items` - Get all items
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `GET /api/companies` - Get all companies
- `POST /api/companies` - Save company name
- `GET /api/companies/suggestions?q=term` - Get company suggestions

## Technologies Used

- React 18
- Vite (with custom API middleware plugin)
- CSS3 (Modern styling with gradients and animations)
- Framer Motion (Animations)
- React Icons
- React Hot Toast (Notifications)

## File Structure

```
├── vite-plugin-api.js       # Vite plugin for API middleware (handles file operations)
├── vite.config.js           # Vite configuration with API plugin
├── src/
│   ├── components/          # React components
│   ├── data/               # JSON data files (auto-created)
│   │   ├── invoices.json   # All invoices
│   │   ├── lastInvoiceNumber.json  # Last invoice number
│   │   ├── predefinedItems.json   # Predefined items
│   │   └── companies.json  # Company names for autofill
│   └── utils/              # Utility functions
│       ├── invoiceStorage.js  # API calls for invoices
│       ├── itemStorage.js     # Item management
│       └── companyStorage.js  # Company name autofill
```

## License

MIT
