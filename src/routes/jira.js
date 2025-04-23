const express = require('express');
const router = express.Router();
const { createTicket, listTickets } = require('../controllers/jiraService');

router.post('/create-ticket', async (req, res) => {
  const { summary, description, priority } = req.body;

  try {
    const result = await createTicket(summary, description, priority);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tickets', async (req, res) => {
  try {
    const result = await listTickets();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
