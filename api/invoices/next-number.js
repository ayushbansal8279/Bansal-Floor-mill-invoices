export default async function handler(req, res) {
  await connectDB();

  const doc = await LastInvoiceNumber.findById("lastInvoiceNumber");
  const nextNumber = (doc?.lastNumber || 0) + 1;

  return res.json({ nextNumber });
}