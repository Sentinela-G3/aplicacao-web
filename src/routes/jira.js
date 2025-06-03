const express = require('express');
const router = express.Router();
const jiraController  = require('../controllers/jiraService');

router.post('/create-ticket', async (req, res) => {
  const { summary, description, priority } = req.body;

  try {
    const result = await jiraController .createTicket(summary, description, priority);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/setar-responsavel', async (req, res) => {
  const { issueKey, accountId } = req.body;

  try {
    const result = await jiraController .setarResponsavel(issueKey, accountId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tickets', async (req, res) => {
  try {
    const result = await jiraController .listTickets();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get(`/buscarResponsavel/:chaveTicket`, async (req, res) => {
  try {
    const { chaveTicket } = req.params;
    const result = await jiraController.buscarResponsavel(chaveTicket);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/membros', async (req, res) => {
  try {
    const result = await jiraController.buscarMembros();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
