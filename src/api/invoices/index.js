// /api/invoices/index.js
import { connectDB } from "../_lib/mongodb.js";
import Invoice from "../_models/Invoice.js";

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "GET") {
    const invoices = await Invoice.find({}).sort({ savedAt: -1 });
    return res.json(invoices);
  }

  if (req.method === "POST") {
    try {
      const invoice = new Invoice({
        ...req.body,
        savedAt: new Date().toISOString(),
      });

      await invoice.save();
      return res.json({ success: true, invoice });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).end();
}