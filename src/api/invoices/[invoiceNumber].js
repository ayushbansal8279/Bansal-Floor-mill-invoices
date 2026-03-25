// /api/invoices/[invoiceNumber].js
import { connectDB } from "../_lib/mongodb.js";
import Invoice from "../_models/Invoice.js";

export default async function handler(req, res) {
  await connectDB();

  const { invoiceNumber } = req.query;

  if (req.method === "GET") {
    const invoice = await Invoice.findOne({ invoiceNumber });
    if (!invoice) return res.status(404).json({ error: "Not found" });
    return res.json(invoice);
  }

  if (req.method === "PUT") {
    const updated = await Invoice.findOneAndUpdate(
      { invoiceNumber },
      req.body,
      { new: true }
    );
    return res.json({ success: true, invoice: updated });
  }

  if (req.method === "DELETE") {
    await Invoice.findOneAndDelete({ invoiceNumber });
    return res.json({ success: true });
  }

  res.status(405).end();
}