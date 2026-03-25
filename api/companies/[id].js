export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "PUT") {
    return res.json({ success: true, id });
  }

  if (req.method === "DELETE") {
    return res.json({ success: true, id });
  }

  res.status(405).end();
}