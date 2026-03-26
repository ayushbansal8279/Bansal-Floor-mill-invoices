// Use Vercel API routes in production, local API in development
const API_BASE_URL = import.meta.env.PROD
  ? "/api"
  : import.meta.env.VITE_API_URL || "/api";

// 🔥 cache
let invoicesCache = null;

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = { error: "Invalid JSON response" };
    }

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const saveInvoice = async (invoiceData, isUpdate = false) => {
  try {
    let result;

    if (isUpdate && invoiceData.invoiceNumber) {
      result = await apiCall(`/invoices/${invoiceData.invoiceNumber}`, {
        method: "PUT",
        body: JSON.stringify(invoiceData),
      });

      // 🔄 update cache
      if (invoicesCache) {
        invoicesCache = invoicesCache.map((inv) =>
          inv.invoiceNumber === invoiceData.invoiceNumber ? invoiceData : inv,
        );
      }
    } else {
      result = await apiCall("/invoices", {
        method: "POST",
        body: JSON.stringify(invoiceData),
      });

      // 🔄 update cache
      if (invoicesCache) {
        invoicesCache = [...invoicesCache, invoiceData];
      }
    }

    return result.success;
  } catch (error) {
    console.error("Error saving invoice:", error);
    console.error("API Base URL:", API_BASE_URL);
    throw error;
  }
};

export const updateInvoice = async (invoiceNumber, updatedData) => {
  try {
    const result = await apiCall(`/invoices/${invoiceNumber}`, {
      method: "PUT",
      body: JSON.stringify({ ...updatedData, invoiceNumber }),
    });

    // 🔄 update cache
    if (invoicesCache) {
      invoicesCache = invoicesCache.map((inv) =>
        inv.invoiceNumber === invoiceNumber ? updatedData : inv,
      );
    }

    return result.success;
  } catch (error) {
    console.error("Error updating invoice:", error);
    return false;
  }
};

export const deleteInvoice = async (invoiceNumber) => {
  try {
    const result = await apiCall(`/invoices/${invoiceNumber}`, {
      method: "DELETE",
    });

    // 🔄 update cache
    if (invoicesCache) {
      invoicesCache = invoicesCache.filter(
        (inv) => inv.invoiceNumber !== invoiceNumber,
      );
    }

    return result.success;
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return false;
  }
};

export const getInvoices = async () => {
  try {
    // ✅ cache hit
    if (invoicesCache) return invoicesCache;

    const invoices = await apiCall("/invoices");
    invoicesCache = invoices || [];

    return invoicesCache;
  } catch (error) {
    console.error("Error loading invoices:", error);
    return [];
  }
};

export const getLastInvoiceNumber = async () => {
  try {
    const result = await apiCall("/invoices/last-number");
    return result.lastNumber || 0;
  } catch (error) {
    console.error("Error getting last invoice number:", error);
    return 0;
  }
};

export const getNextInvoiceNumber = async () => {
  try {
    const result = await apiCall("/invoices/next-number");
    return result.nextNumber || 1;
  } catch (error) {
    console.error("Error getting next invoice number:", error);
    return 1;
  }
};

const extractInvoiceNumber = (invoiceNumber) => {
  const match = invoiceNumber.toString().match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

export const exportInvoicesToJSON = async () => {
  try {
    const invoices = await getInvoices();
    const dataStr = JSON.stringify(invoices, null, 2);

    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `invoices_${new Date().toISOString().split("T")[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting invoices:", error);
  }
};

export const importInvoicesFromJSON = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const invoices = JSON.parse(e.target.result);

        if (!Array.isArray(invoices)) {
          return reject(new Error("Invalid JSON format"));
        }

        // 🚀 parallel import (faster)
        await Promise.all(invoices.map((inv) => saveInvoice(inv, false)));

        // 🔄 reset cache
        invoicesCache = null;

        resolve(invoices);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsText(file);
  });
};
