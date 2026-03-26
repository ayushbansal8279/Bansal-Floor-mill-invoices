// same base logic as invoices/items
const API_BASE_URL = import.meta.env.PROD
  ? "/api"
  : import.meta.env.VITE_API_URL || "/api";

const apiCall = async (endpoint, options = {}) => {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error);
  }

  return await res.json();
};

// GET
export const getCompanies = async () => {
  return await apiCall("/companies");
};

// ADD
export const addCompany = async (data) => {
  const res = await fetch('/api/companies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  const result = await res.json()
  return result.company   // ✅ IMPORTANT
}

// UPDATE
export const updateCompany = async (id, company) => {
  return await apiCall(`/companies/${id}`, {
    method: "PUT",
    body: JSON.stringify(company),
  });
};

// DELETE
export const deleteCompany = async (id) => {
  return await apiCall(`/companies/${id}`, {
    method: "DELETE",
  });
};

// SAVE (used in InvoiceForm)
export const saveCompany = async (company) => {
  return await addCompany(company);
};

export const getCompanySuggestions = async (query) => {
  if (!query) return [];

  try {
    return await apiCall(
      `/companies/suggestions?q=${encodeURIComponent(query)}`
    );
  } catch (err) {
    console.error("Error getting suggestions:", err);
    return [];
  }
};
