export default async function handler(req, res) {
  await connectDB();

  const id = parseInt(req.query.id);

  if (req.method === "PUT") {
    const updated = await Item.findOneAndUpdate({ id }, req.body, {
      new: true,
    });
    return res.json({ success: true, item: updated });
  }

  if (req.method === "DELETE") {
    await Item.findOneAndDelete({ id });
    return res.json({ success: true });
  }

  res.status(405).end();
}