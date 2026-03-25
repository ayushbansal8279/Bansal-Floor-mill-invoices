import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiChevronLeft, FiChevronRight, FiEye } from "react-icons/fi";
import toast from "react-hot-toast";
import { getInvoices, deleteInvoice } from "../utils/invoiceStorage";
import InvoicePreview from "./InvoicePreview";
import "./InvoiceList.css";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const InvoiceList = ({ onViewInvoice, onEditInvoice }) => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [pageDirection, setPageDirection] = useState(0);

  const itemsPerPage = 10;

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [searchTerm, invoices, fromDate, toDate]);

  const loadInvoices = async () => {
    const allInvoices = await getInvoices();

    setInvoices(
      allInvoices.sort((a, b) => {
        const numA = parseInt(a.invoiceNumber.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.invoiceNumber.match(/\d+/)?.[0] || 0);
        return numB - numA;
      }),
    );
  };

  const filterInvoices = () => {
    let filtered = [...invoices];
    const term = searchTerm.toLowerCase();

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(term) ||
          inv.toName?.toLowerCase().includes(term) ||
          inv.fromName?.toLowerCase().includes(term),
      );
    }

    if (fromDate) {
      filtered = filtered.filter(
        (inv) => new Date(inv.invoiceDate) >= new Date(fromDate),
      );
    }

    if (toDate) {
      filtered = filtered.filter(
        (inv) => new Date(inv.invoiceDate) <= new Date(toDate),
      );
    }

    setFilteredInvoices(filtered);
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    if (filteredInvoices.length === 0) {
      toast.error("No invoices to export");
      return;
    }

    const data = filteredInvoices.map((inv) => ({
      "Invoice Number": inv.invoiceNumber,
      Date: formatDate(inv.invoiceDate),
      "Party Name": inv.toName || "",
      "Amount (₹)": inv.total || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

    const buffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, "Invoices.xlsx");
  };

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedInvoices = filteredInvoices.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPageDirection(newPage > currentPage ? 1 : -1);
      setCurrentPage(newPage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (selectedInvoice) {
    return (
      <div className="invoice-list-container">
        <InvoicePreview
          invoiceData={selectedInvoice}
          onReset={() => setSelectedInvoice(null)}
          onBackToList={() => setSelectedInvoice(null)}
          onEdit={() => {
            if (onEditInvoice) {
              onEditInvoice(selectedInvoice);
              setSelectedInvoice(null);
            }
          }}
          onDelete={async (invoiceNumber) => {
            try {
              const success = await deleteInvoice(invoiceNumber);

              if (success) {
                await loadInvoices();
                setSelectedInvoice(null);
                toast.success("Invoice deleted successfully!");
              } else {
                toast.error("Failed to delete invoice");
              }
            } catch (error) {
              toast.error("Error deleting invoice");
            }
          }}
          isFromList={true}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="invoice-list"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="invoice-list-header">
        <h2>All Invoices</h2>
      </div>

      <div className="filters-bar">
        <div className="filters-left">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search invoice / party..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="date-input">
            <span>From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="date-input">
            <span>To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>

        <div className="filters-right">
          <button
            className="clear-filters"
            onClick={() => {
              setSearchTerm("");
              setFromDate("");
              setToDate("");
            }}
          >
            Clear
          </button>

          <button className="export-btn" onClick={exportToExcel}>
            Export Excel
          </button>
        </div>
      </div>

      <div className="invoices-stats">
        <p>
          Total Invoices:
          <strong> {filteredInvoices.length}</strong>
        </p>
      </div>

      <AnimatePresence mode="wait" custom={pageDirection}>
        <motion.div
          key={currentPage}
          className="invoices-table-container"
          custom={pageDirection}
          initial={{ opacity: 0, x: pageDirection * 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: pageDirection * -100 }}
          transition={{ duration: 0.3 }}
        >
          <table className="invoices-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>To (Party)</th>
                <th>Total (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-invoices">
                    No invoices found
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <motion.tr
                    key={invoice.invoiceNumber}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ backgroundColor: "#f8f9fa" }}
                  >
                    <td className="invoice-number-cell" data-label="Invoice #">
  {invoice.invoiceNumber}
</td>

<td data-label="Date">
  {formatDate(invoice.invoiceDate)}
</td>

<td data-label="Party">
  {invoice.toName || "N/A"}
</td>

<td className="total-cell" data-label="Total">
  ₹{invoice.total?.toFixed(2) || "0.00"}
</td>

<td className="actions-cell" data-label="Actions">
  <motion.button
    className="btn-view"
    onClick={() => setSelectedInvoice(invoice)}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
  >
    <FiEye />
    <span className="btn-text">View</span>
  </motion.button>
</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      </AnimatePresence>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            <FiChevronLeft /> Previous
          </button>

          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next <FiChevronRight />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default InvoiceList;
