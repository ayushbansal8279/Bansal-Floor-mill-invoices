// Use Vercel API routes in production, local API in development
const API_BASE_URL = import.meta.env.PROD
  ? "/api"
  : import.meta.env.VITE_API_URL || "/api";

// 🔥 cache
let itemsCache = null;

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

export const getItems = async () => {
  try {
    // ✅ cache
    if (itemsCache) return itemsCache;

    const items = await apiCall("/items");
    itemsCache = items || [];

    return itemsCache;
  } catch (error) {
    console.error("Error loading items:", error);
    return [];
  }
};

export const saveItems = async (items) => {
  try {
    const existingItems = await getItems();

    // 🔥 parallel execution (FAST)
    await Promise.all(
      items.map((item) => {
        if (item.id && existingItems.find((i) => i.id === item.id)) {
          return apiCall(`/items/${item.id}`, {
            method: "PUT",
            body: JSON.stringify(item),
          });
        } else {
          return apiCall("/items", {
            method: "POST",
            body: JSON.stringify(item),
          });
        }
      }),
    );

    // 🔄 update cache
    itemsCache = items;

    return true;
  } catch (error) {
    console.error("Error saving items:", error);
    return false;
  }
};

export const addItem = async (item) => {
  try {
    const result = await apiCall("/items", {
      method: "POST",
      body: JSON.stringify({
        ...item,
        id: item.id || Date.now(),
      }),
    });

    // 🔄 update cache
    if (itemsCache && result.item) {
      itemsCache = [...itemsCache, result.item];
    }

    return result.item;
  } catch (error) {
    console.error("Error adding item:", error);
    return null;
  }
};

export const updateItem = async (id, updatedItem) => {
  try {
    const result = await apiCall(`/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(updatedItem),
    });

    // 🔄 update cache
    if (itemsCache) {
      itemsCache = itemsCache.map((i) => (i.id === id ? updatedItem : i));
    }

    return result.success;
  } catch (error) {
    console.error("Error updating item:", error);
    return false;
  }
};

export const deleteItem = async (id) => {
  try {
    const result = await apiCall(`/items/${id}`, {
      method: "DELETE",
    });

    // 🔄 update cache
    if (itemsCache) {
      itemsCache = itemsCache.filter((i) => i.id !== id);
    }

    return result.success;
  } catch (error) {
    console.error("Error deleting item:", error);
    return false;
  }
}; 