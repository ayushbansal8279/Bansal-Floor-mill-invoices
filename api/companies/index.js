import { connectDB } from "../_lib/mongodb.js";
import Company from "../_models/Company.js";

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "GET") {
    const companies = await Company.find({});
    return res.json(companies);
  }

  if (req.method === "POST") {
    const company = new Company(req.body);
    await company.save();
    return res.json(company);
  }

  res.status(405).end();
}