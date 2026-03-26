import { connectDB, Company } from "../../src/utils/mongodb.js";

export const handler = async (event, context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    await connectDB();

    const path = event.path.replace("/api/companies", "").replace(/^\//, "");
    const isSuggestions = path === "suggestions";
    const id = path && !isSuggestions ? path : null;

    let searchTerm = "";

    try {
      const url = new URL(
        event.rawUrl ||
          `http://localhost${event.path}${
            event.rawQuery ? "?" + event.rawQuery : ""
          }`,
      );
      searchTerm = url.searchParams.get("q") || "";
    } catch (e) {
      searchTerm = "";
    }

    // ✅ Ensure string
    if (typeof searchTerm !== "string") {
      searchTerm = "";
    }

    const term = searchTerm.toLowerCase();

    // =========================================
    // GET /api/companies/suggestions
    // =========================================
    if (event.httpMethod === "GET" && isSuggestions) {
      let companies;

      if (!term) {
        companies = await Company.find({})
          .select("name nameHindi address")
          .limit(10)
          .lean();
      } else {
        companies = await Company.find({
          $or: [
            { name: { $regex: term, $options: "i" } },
            { nameHindi: { $regex: term, $options: "i" } },
          ],
        })
          .select("name nameHindi address")
          .limit(10)
          .lean();
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(companies),
      };
    }

    // =========================================
    // GET /api/companies
    // =========================================
    if (event.httpMethod === "GET") {
      const companies = await Company.find({})
        .select("name nameHindi address")
        .lean();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(companies),
      };
    }

    // =========================================
    // POST /api/companies
    // =========================================
    if (event.httpMethod === "POST") {
      let data = {};

      try {
        data = JSON.parse(event.body);
      } catch (e) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Invalid JSON" }),
        };
      }

      const name = typeof data.name === "string" ? data.name.trim() : "";
      const nameHindi =
        typeof data.nameHindi === "string" ? data.nameHindi.trim() : "";
      const address =
        typeof data.address === "string" ? data.address.trim() : "";

      if (!name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Company name is required" }),
        };
      }

      const existing = await Company.findOne({ name }).lean();

      if (existing) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            company: existing,
            message: "Company already exists",
          }),
        };
      }

      const newCompany = new Company({
        name,
        nameHindi,
        address,
      });

      await newCompany.save();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, company: newCompany }),
      };
    }

    // =========================================
    // PUT /api/companies/:id
    // =========================================
    if (event.httpMethod === "PUT") {
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "ID is required" }),
        };
      }

      let data = {};

      try {
        data = JSON.parse(event.body);
      } catch (e) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Invalid JSON" }),
        };
      }

      const updated = await Company.findByIdAndUpdate(
        id,
        {
          ...(data.name && { name: data.name.trim() }),
          ...(data.nameHindi && { nameHindi: data.nameHindi.trim() }),
          ...(data.address && { address: data.address.trim() }),
        },
        { new: true },
      );

      if (!updated) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Company not found" }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, company: updated }),
      };
    }

    // =========================================
    // DELETE /api/companies/:id
    // =========================================
    if (event.httpMethod === "DELETE") {
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "ID is required" }),
        };
      }

      const deleted = await Company.findByIdAndDelete(id);

      if (!deleted) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Company not found" }),
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
