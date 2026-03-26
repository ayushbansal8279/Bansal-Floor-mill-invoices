import { connectDB, Item } from "../../src/utils/mongodb.js";

export const handler = async (event, context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    await connectDB();

    const path = event.path.replace("/api/items", "").replace(/^\//, "");
    const itemId = path ? parseInt(path) : null;

    // =========================================
    // GET /api/items
    // =========================================
    if (event.httpMethod === "GET" && !path) {
      const items = await Item.find({}).sort({ id: 1 }).lean();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(items),
      };
    }

    // =========================================
    // POST /api/items
    // =========================================
    if (event.httpMethod === "POST") {
      let itemData = {};

      try {
        itemData = JSON.parse(event.body);
      } catch {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Invalid JSON" }),
        };
      }

      const newItem = new Item({
        ...itemData,
        id: itemData.id || Date.now(),
      });

      await newItem.save();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          item: newItem.toObject(),
        }),
      };
    }

    // =========================================
    // PUT /api/items/:id
    // =========================================
    if (event.httpMethod === "PUT") {
      if (!itemId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "ID is required" }),
        };
      }

      let updatedData = {};

      try {
        updatedData = JSON.parse(event.body);
      } catch {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Invalid JSON" }),
        };
      }

      const updatedItem = await Item.findOneAndUpdate(
        { id: itemId },
        updatedData,
        { new: true },
      );

      if (!updatedItem) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Item not found" }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          item: updatedItem.toObject(),
        }),
      };
    }

    // =========================================
    // DELETE /api/items/:id
    // =========================================
    if (event.httpMethod === "DELETE") {
      if (!itemId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "ID is required" }),
        };
      }

      const result = await Item.findOneAndDelete({ id: itemId });

      if (!result) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Item not found" }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "Internal server error",
      }),
    };
  }
};