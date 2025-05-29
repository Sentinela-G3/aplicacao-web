

// 4 variaveis
// 1 qtd total de maquinas
// 1 p critico
// 1 p grave
// 1 p leve

// essas variaveis vão vir dos ids

// funcao que recebe do jira funcoes o json

document.addEventListener('DOMContentLoaded', () => {

    console.log("alou")

    console.log("alou")

    console.log("alou")

    const qtdMaquinasAlertasTotais = 0;
    const ticketForm = document.getElementById('ticketForm');
    const ticketsList = document.getElementById('tickets');
    const apiBaseUrl = window.location.origin;

    async function fetchTickets() {
        console.log("alou fetch")
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


    function renderTickets(tickets) {
        const divPctCrit = document.getElementById("pctMaquinasCrit")
        const divPctGrave = document.getElementById("pctMaquinasGrave")
        const divPctComum = document.getElementById("pctMaquinasComuns")

        const iQtdCrit = document.getElementById("qtdMaquinasCrit")
        const iQtdGrave = document.getElementById("qtdMaquinasGrave")
        const iQtdComum = document.getElementById("qtdMaquinasComuns")

        const div = document.getElementById("box-linhas")

        let qtdAlertasCpu = 0;
        let qtdAlertasUptime = 0;
        let qtdAlertasRede = 0;
        let qtdAlertasBateria = 0;
        let qtdAlertasDisco = 0;
        let qtdAlertasRam = 0;  

        let qtdMaquinasCritico = 0;
        let qtdMaquinasGrave = 0;
        let qtdMaquinasLeve = 0;
        let qtdMaquinasAlertasTotais = 0;

        const alertasPorRecursoEUrgencia = {
            CPU: { Crítico: 0, Grave: 0, Leve: 0 },
            Memória: { Crítico: 0, Grave: 0, Leve: 0 },
            Disco: { Crítico: 0, Grave: 0, Leve: 0 },
            Rede: { Crítico: 0, Grave: 0, Leve: 0 },
            "Tempo de Uso": { Crítico: 0, Grave: 0, Leve: 0 },
            Bateria: { Crítico: 0, Grave: 0, Leve: 0 }
        };

        tickets.forEach(ticket => {
            console.log(ticket)
            const date = new Date(ticket.createdDate.jira);

            const urgenciaField = ticket.requestFieldValues.find(field => field.label === "Urgência");
            const urgencia = urgenciaField?.value?.value ?? urgenciaField?.value?.[0]?.value;
            const urgenciaTratada = (urgencia || "").toString().trim().toLowerCase();
            const urgenciaNormalizada = urgenciaTratada.charAt(0).toUpperCase() + urgenciaTratada.slice(1).toLowerCase();

            const numeroSerialField = ticket.requestFieldValues.find(field => field.label === "Summary")
            const numeroSerial = numeroSerialField?.value?.split(" ")[1];
            console.log(numeroSerial)

            const recursoField = ticket.requestFieldValues.find(field => field.label === "Recurso");
            let recurso = recursoField?.value?.value ?? recursoField?.value?.[0]?.value;
            console.log(urgencia);

            const maquina = ticket.summary;

            const descricao = ticket.requestFieldValues?.find(f => f.fieldId === "description")?.value;
            const descricaoSeparada = descricao.split('*');
            const descricaoTratada = descricaoSeparada[3].charAt(0).toUpperCase() + descricaoSeparada[3].slice(1);

            if (urgencia === "Crítico") {
                qtdMaquinasCritico++
            } else if (urgencia === "Grave") {
                qtdMaquinasGrave++
            } else if (urgencia === "Leve") {
                qtdMaquinasLeve++
            } else {
                console.log("skibidi", urgencia)
            }

            if (recurso in alertasPorRecursoEUrgencia && ["Crítico", "Grave", "Leve"].includes(urgenciaTratada)) {
                alertasPorRecursoEUrgencia[recurso][urgenciaTratada]++;
            }

            if (recurso in alertasPorRecursoEUrgencia && ["Crítico", "Grave", "Leve"].includes(urgenciaNormalizada)) {
                alertasPorRecursoEUrgencia[recurso][urgenciaNormalizada]++;
            }
            

            console.log(recurso)

            if (recurso === "Rede") {
                qtdAlertasRede++
                if (urgencia == "Crítico") {
                    console.log("AOOAOAOA")
                } else {
                    console.log("D:")
                }
            } else if (recurso === "CPU") {
                qtdAlertasCpu++
            } else if (recurso === "Memória") {
                qtdAlertasRam++
            } else if (recurso === "Disco") {
                qtdAlertasDisco++
            } else if (recurso === "Tempo de Uso") {
                qtdAlertasUptime++
            } else if (recurso === "Bateria") {
                qtdAlertasBateria++
            } else {
                console.log("Não deuuuuu")
            }

            qtdMaquinasAlertasTotais = qtdMaquinasCritico + qtdMaquinasGrave + qtdMaquinasLeve;

            divPctCrit.innerText = ((qtdMaquinasCritico / qtdMaquinasAlertasTotais) * 100).toFixed(1) + "%";
            divPctGrave.innerText = ((qtdMaquinasGrave / qtdMaquinasAlertasTotais) * 100).toFixed(1) + "%";
            divPctComum.innerText = ((qtdMaquinasLeve / qtdMaquinasAlertasTotais) * 100).toFixed(1) + "%";

            iQtdCrit.innerText = `${qtdMaquinasCritico} máquinas com alertas crítico`;
            iQtdGrave.innerText = `${qtdMaquinasGrave} máquinas com alertas graves`;
            iQtdComum.innerText = `${qtdMaquinasLeve} máquinas com alertas leves`;

            if (window.myChartInstance) {
                window.myChartInstance.destroy();
            }

            const ctx = document.getElementById('myChart');

            const dataValues = [
                qtdAlertasCpu,
                qtdAlertasRam,
                qtdAlertasDisco,
                qtdAlertasRede,
                qtdAlertasUptime,
                qtdAlertasBateria
            ];

            const maxValue = Math.max(...dataValues);
            console.log("alou")


            const recursos = ['CPU', 'Memória', 'Disco', 'Rede', 'Tempo de Uso', 'Bateria'];
            const coresUrgencia = {
                Crítico: `rgba(254, 73, 78, ALPHA)`,
                Grave: `rgba(255, 211, 100, ALPHA)`,
                Leve: `rgba(118, 198, 126, ALPHA)`
            };

            const backgroundColor = dataValues.map((valorAtual, index) => {
                const recursoAtual = recursos[index];
                const recursoNomeMapeado = recursoAtual;
                const recursoAlertas = alertasPorRecursoEUrgencia[recursoNomeMapeado] || { Crítico: 0, Grave: 0, Leve: 0 };
            
                let urgenciaCor;
                if (recursoAlertas["Crítico"] > 0) {
                    urgenciaCor = "Crítico";
                } else if (recursoAlertas["Grave"] > 0) {
                    urgenciaCor = "Grave";
                } else {
                    urgenciaCor = "Leve";
                }
            
                const alpha = Math.max(valorAtual / maxValue, 0.1);
                return coresUrgencia[urgenciaCor].replace("ALPHA", alpha.toFixed(2));

            });

            

            window.myChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: recursos,
                    datasets: [{
                        label: 'Quantidade de conflitos',
                        data: dataValues,
                        backgroundColor: backgroundColor,
                        borderWidth: 1
                    }]
                },
                options: {
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                generateLabels: function(chart) {
                                    return [
                                        {
                                            text: 'Possui alertas críticos',
                                            fillStyle: 'rgba(254, 73, 78, 1)', // vermelho
                                            strokeStyle: 'rgba(254, 73, 78, 1)',
                                            lineWidth: 1
                                        },
                                        {
                                            text: 'Possui alertas graves',
                                            fillStyle: 'rgba(255, 211, 100, 1)', // amarelo
                                            strokeStyle: 'rgba(255, 211, 100, 1)',
                                            lineWidth: 1
                                        },
                                        {
                                            text: 'Somente alertas leves',
                                            fillStyle: 'rgba(118, 198, 126, 1)', // verde
                                            strokeStyle: 'rgba(118, 198, 126, 1)',
                                            lineWidth: 1
                                        }
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            

            console.log(qtdMaquinasAlertasTotais)
            console.log(qtdMaquinasCritico)
            console.log(qtdMaquinasGrave)
            console.log(qtdMaquinasLeve)

            console.log(qtdAlertasRede)

            console.log("Ticket:", ticket);
            console.log("Urgência:", urgenciaField);
            console.log("Recurso:", recursoField);

            console.log(alertasPorRecursoEUrgencia)

            const tabela = document.getElementById("tabaletaMaquinas").querySelector("tbody") 
            const linha = document.createElement("tr")

            const celSerial = document.createElement("td");
            const spanSerial = document.createElement("span");
            spanSerial.innerText = numeroSerial || "Desconhecido";
            celSerial.appendChild(spanSerial);
            linha.appendChild(celSerial);
                       
            function contarAlertasPorRecurso(nomeRecurso) {
                return (recurso === nomeRecurso) ? 1 : 0;
            }

            recursos.forEach(recursoNome => {
                const td = document.createElement("td");
                td.innerText = recurso === recursoNome ? "1" : "0";
                linha.appendChild(td);
            });

            tabela.appendChild(linha);

        });



    }


    fetchTickets();

})