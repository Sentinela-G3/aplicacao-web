const axios = require('axios');
require('dotenv').config();

const { JIRA_URL, EMAIL, API_TOKEN } = process.env;

const auth = {
  auth: {
    username: EMAIL,
    password: API_TOKEN,
  },
};

async function createTicket(summary, description, priority) {
  try {
    const response = await axios.post(
      `${JIRA_URL}/rest/servicedeskapi/request`,
      {
        serviceDeskId: 2,
        requestTypeId: 34,
        raiseOnBehalfOf: EMAIL,
        requestFieldValues: {
          summary,
          description
        },
      },
      auth
    );
    return response.data;
  } catch (error) {
    console.error('Erro ao criar ticket:', error.response?.data || error.message);
    throw new Error('Erro ao criar ticket');
  }
}

async function listTickets() {
  try {
    const response = await axios.get(
      `${JIRA_URL}/rest/servicedeskapi/request`,
      auth
    );
    return response.data;
  } catch (error) {
    console.error('Erro ao obter tickets:', error.response?.data || error.message);
    throw new Error('Erro ao obter tickets');
  }
}

module.exports = {
  createTicket,
  listTickets
};
