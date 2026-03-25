import { connectDB } from "../_lib/mongodb.js";
import LastInvoiceNumber from "../_models/LastInvoiceNumber.js";

export default async function handler(req, res) {
  await connectDB();

  const doc = await LastInvoiceNumber.findById("lastInvoiceNumber");
  return res.json({ lastNumber: doc?.lastNumber || 0 });
}