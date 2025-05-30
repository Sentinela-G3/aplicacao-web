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

async function buscarMembros(){
  try {
    const response = await axios.get(
      `${JIRA_URL}/rest/api/3/user/assignable/search`, {
        params: { project: 'SUPSEN' }, // Substitua 'TESTE' pela chave do projeto real
        headers: {
          Authorization: `Basic ${Buffer.from(`${EMAIL}:${API_TOKEN}`).toString('base64')}`,
          Accept: 'application/json'
        }
  });

    const usuarios = response.data;

    usuarios.forEach(usuario => {
      console.log(`Nome: ${usuario.displayName}, AccountId: ${usuario.accountId}`);
    });
    
    return usuarios;

  } catch (error) {
    console.error('Erro ao buscar membros2:', error.response ? error.response.data : error.message);
  }
}


module.exports = {
  createTicket,
  listTickets,
  buscarMembros
};
