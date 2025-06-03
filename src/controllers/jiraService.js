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

async function buscarMembros() {
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


async function buscarResponsavel(issueKey) {
  const auth = btoa(`${EMAIL}:${API_TOKEN}`);
  try {
    const response = await axios.get(`${JIRA_URL}/rest/api/3/issue/${issueKey}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    const assignee = response.data.fields.assignee;

    if (assignee) {
      console.log('Responsável pelo ticket:');
      console.log(`Nome: ${assignee.displayName}`);
      console.log(`ID: ${assignee.accountId}`);
      return assignee.displayName
      // console.log(`Email: ${assignee.emailAddress}`); // Pode estar indisponível
    } else {
      console.log('Este ticket não possui responsável atribuído.');
      return "Ninguem"
    }

  } catch (error) {
    if (error.response) {
      console.error('Erro da API:', error.response.status, error.response.data);
    } else {
      console.error('Erro na requisição:', error.message);
    }
  }
}

async function setarResponsavel(issueKey, accountId) {
  const auth = btoa(`${EMAIL}:${API_TOKEN}`);
  console.log(issueKey, accountId);

  try {
    console.log(issueKey, accountId)
    const response = await axios.put(
      `${JIRA_URL}/rest/api/3/issue/${issueKey}/assignee`,
      {
        accountId: accountId  // corpo correto
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    console.log('Usuário atribuído com sucesso:', response.status);
    return response.data;  // caso queira retornar algo ao front
  } catch (error) {
    console.error('❌ Erro ao atualizar campo de texto:', error.response?.data || error.message);
    throw error;
  }
}


module.exports = {
  createTicket,
  listTickets,
  buscarMembros,
  buscarResponsavel,
  setarResponsavel
};
