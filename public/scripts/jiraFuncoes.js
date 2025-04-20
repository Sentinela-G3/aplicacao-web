document.addEventListener('DOMContentLoaded', () => {
    const ticketForm = document.getElementById('ticketForm');
    const ticketsList = document.getElementById('tickets');
    const apiBaseUrl = window.location.origin;
    // Função para buscar os tickets
    async function fetchTickets() {
        try {
          const response = await fetch('http://localhost:3333/jira/tickets');
          
          if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
          }
      
          const data = await response.json();
          
          // Verifique o formato dos dados retornados
          console.log('Resposta da API:', data.values[0]);
      
          // A resposta contém os tickets dentro de data.values
          if (data.values) {
            renderTickets(data.values);  // Agora estamos passando os tickets de dentro de 'values'
          } else {
            console.error('A resposta não contém tickets ou não é um array');
          }
        } catch (error) {
          console.error('Erro ao buscar tickets:', error);
        }
      }
  
    // Função para renderizar os tickets na lista
    function renderTickets(tickets) {
      const div = document.getElementById("box-linhas")
      div.innerHTML = '';
      tickets.forEach(ticket => {
        console.log(ticket)
        const date = new Date(ticket.createdDate.jira);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses começam em 0
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        const textHoraAbertura = `${day}/${month}/${year} às ${hours}:${minutes}`

        div.innerHTML += `<tr>
                            <td class="alerta-chave">${ticket.issueKey}</td>
                            <td class="alerta-desc">${ticket.summary}</td>
                            <td class="alerta-dispositivo">ROBO 0120</td>
                            <td class="alerta-horario"> ${textHoraAbertura}</td>
                            <td><span class="alerta-status status-resolvido">${ticket.currentStatus.status}</span></td>
                          </tr>`;
      });
    }

    // Função para criar um novo ticket
    async function createTicket(event) {
        event.preventDefault();
      
        const summary = document.getElementById('summary').value;
        const description = document.getElementById('description').value;
        const priority = document.getElementById('priority').value;
      
        // Dados para criação de ticket
        const ticketData = {
            summary: summary,
            description: description,
            priority: priority
          };
      
        try {
          const response = await fetch('http://localhost:3333/jira/create-ticket', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(ticketData),
          });
      
          if (response.ok) {
            alert('Ticket criado com sucesso!');
            fetchTickets(); // Atualiza a lista de tickets
            ticketForm.reset();
          } else {
            const errorData = await response.json();
            console.error('Erro ao criar ticket:', errorData);
            alert('Erro ao criar o ticket: ' + (errorData.details || 'Desconhecido'));
          }
        } catch (error) {
          console.error('Erro ao criar ticket:', error);
          alert('Erro ao criar o ticket');
        }
      }
  
    // Evento de submit do formulário
    // ticketForm.addEventListener('submit', createTicket);
  
    // Carrega os tickets ao carregar a página
    fetchTickets();
  });
  

//Função para filtar alertas de acordo com status e periodo
function filtrarAlertas() {
const statusSelecionado = document.getElementById('select-status').value.toLowerCase();
const dataInicioInput = document.getElementById('periodoInicio').value;
const dataFimInput = document.getElementById('periodoFim').value;

const dataInicio = dataInicioInput ? new Date(`${dataInicioInput}T00:00:00`) : null;
const dataFim = dataFimInput ? new Date(`${dataFimInput}T23:59:59`) : null;

const linhas = document.querySelectorAll('#lista-alertas tbody tr');

linhas.forEach(linha => {
  const status = linha.querySelector('.alerta-status').textContent.toLowerCase();
  const dataTexto = linha.querySelector('.alerta-horario').textContent; 

  const [dataParte, horaParte] = dataTexto.split(' às ');
  const [dia, mes, ano] = dataParte.split('/');
  const [hora, minuto] = horaParte.split(':');

  const dataChamado = new Date(ano, mes - 1, dia, hora, minuto); 

  let exibir = true;

  if (statusSelecionado !== 'todos' && status !== statusSelecionado) {
    exibir = false;
  }

  if (dataInicio && dataChamado < dataInicio) {
    exibir = false;
  }

  if (dataFim && dataChamado > dataFim) {
    exibir = false;
  }

  linha.style.display = exibir ? '' : 'none';
});
}
    