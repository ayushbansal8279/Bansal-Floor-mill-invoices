export default async function handler(req, res) {
  await connectDB();

  const q = req.query.q || "";

  const companies = await Company.find({
    name: { $regex: q, $options: "i" },
  }).limit(10);

  return res.json(companies);
}