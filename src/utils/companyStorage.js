// same base logic as invoices/items
const API_BASE_URL = import.meta.env.PROD
  ? "/api"
  : import.meta.env.VITE_API_URL || "/api";

// 🔥 simple in-memory cache
let companiesCache = null;

const apiCall = async (endpoint, options = {}) => {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  let data = null;

  try {
    data = await res.json();
  } catch (e) {
    data = { error: "Invalid JSON response" };
  }

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
};

// GET
export const getCompanies = async () => {
  // ✅ cache for faster UI (no extra calls)
  if (companiesCache) return companiesCache;

  const data = await apiCall("/companies");
  companiesCache = data;
  return data;
};

// ADD
export const addCompany = async (data) => {
  const result = await apiCall("/companies", {
    method: "POST",
    body: JSON.stringify(data),
  });

  // 🔄 update cache (no reload needed)
  if (companiesCache && result.company) {
    companiesCache = [...companiesCache, result.company];
  }

  return result.company;
};

// UPDATE
export const updateCompany = async (id, company) => {
  const result = await apiCall(`/companies/${id}`, {
    method: "PUT",
    body: JSON.stringify(company),
  });

  // 🔄 update cache
  if (companiesCache && result.company) {
    companiesCache = companiesCache.map((c) =>
      c._id === id ? result.company : c,
    );
  }

  return result.company;
};

// DELETE
export const deleteCompany = async (id) => {
  await apiCall(`/companies/${id}`, {
    method: "DELETE",
  });

  // 🔄 update cache
  if (companiesCache) {
    companiesCache = companiesCache.filter((c) => c._id !== id);
  }
};

// SAVE (used in InvoiceForm)
export const saveCompany = async (company) => {
  return await addCompany(company);
};

// SUGGESTIONS
export const getCompanySuggestions = async (query) => {
  if (!query || typeof query !== "string") return [];

  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    return await apiCall(
      `/companies/suggestions?q=${encodeURIComponent(trimmed)}`,
    );
  } catch (err) {
    console.error("Error getting suggestions:", err);
    return [];
  }
};
