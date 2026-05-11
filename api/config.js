export default (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: {} });
  }
  
  if (req.method === 'PUT' || req.method === 'POST') {
    return res.status(200).json({ success: true, lastUpdated: Date.now() });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
};
