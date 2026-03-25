import { connectDB } from "../_lib/mongodb.js";
import Item from "../_models/Item.js";

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "GET") {
    const items = await Item.find({}).sort({ id: 1 });
    return res.json(items);
  }

  if (req.method === "POST") {
    const item = new Item({
      ...req.body,
      id: req.body.id || Date.now(),
    });

    await item.save();
    return res.json({ success: true, item });
  }

  res.status(405).end();
}