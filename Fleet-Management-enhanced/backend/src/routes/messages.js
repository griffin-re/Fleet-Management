const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/channels', authenticate, async (req, res) => {
  res.json([
    { id: 'general', name: 'General', description: 'General operations' },
    { id: 'alerts', name: 'Alerts', description: 'Alert notifications' },
    { id: 'logistics', name: 'Logistics', description: 'Logistics coordination' },
  ]);
});

router.get('/channels/:channelId', authenticate, async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  res.json({
    data: [],
    pagination: { page, limit, totalCount: 0, totalPages: 0 },
  });
});

router.post('/channels/:channelId', authenticate, async (req, res) => {
  const { content } = req.body;
  res.status(201).json({ id: 1, content, senderId: req.user.id });
});

router.post('/broadcast', authenticate, async (req, res) => {
  const { content, severity } = req.body;
  res.status(201).json({ message: 'Broadcast sent', id: 1 });
});

module.exports = router;
