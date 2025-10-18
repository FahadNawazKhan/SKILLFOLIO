// src/controllers/verifyController.js
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).json({ valid: false, error: 'No token provided' });

  try {
    const secretOrKey = process.env.JWT_SECRET || 'dev-secret';
    const payload = jwt.verify(token, secretOrKey, { algorithms: ['HS256', 'RS256'] });
    return res.json({ valid: true, payload });
  } catch (err) {
    console.error('verifyToken error:', err.message);
    return res.status(400).json({ valid: false, error: 'Invalid or expired token' });
  }
};
