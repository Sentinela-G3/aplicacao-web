async function fetchTickets() {
    console.log("alou fetch (global - não usado se DOMContentLoaded estiver ativo)");
    try {
        const response = await fetch('http://localhost:3333/jira/tickets');
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Resposta da API (primeiro ticket):', data.values ? data.values[0] : "Nenhum ticket");

        if (data.values && Array.isArray(data.values)) {
            if (document.getElementById("iptMaquina") && document.getElementById("iptMaquina").value) {
                 PesquisarMaquina(data.values);
            } else {
                console.log("iptMaquina está vazio");
            }
        } else {
            console.error('A resposta n contém tickets validos ou data.values n é um array:', data);
            const tabela = document.getElementById("tabaletaMaquinas")?.querySelector("tbody");
            if (tabela) {
                tabela.innerHTML = '<tr><td colspan="10">Nenhum ticket encontrado ou formato inválido.</td></tr>';
            }
        }
    } catch (error) {
        console.error('Erro ao buscar tickets:', error);
        const tabela = document.getElementById("tabaletaMaquinas")?.querySelector("tbody");
        if (tabela) {
            tabela.innerHTML = '<tr><td colspan="10">Erro ao carregar tickets.</td></tr>';
        }
    }
}


function PesquisarMaquina(todosOsTickets) {
    if (!todosOsTickets || !Array.isArray(todosOsTickets)) {
        console.error("PesquisarMaquina chamada sem um array de tickets válido.");
        const tabela = document.getElementById("tabaletaMaquinas")?.querySelector("tbody");
        if (tabela) tabela.innerHTML = '<tr><td colspan="10">Dados de tickets inválidos para pesquisa.</td></tr>';
        return;
    }

    var varMaquina = iptMaquina.value.trim();
    const tabela = document.getElementById("tabaletaMaquinas")?.querySelector("tbody");
    const NUM_COLUNAS = 10;

    if (!tabela) {
        console.error("Elemento da tabela (tbody) não encontrado!");
        return;
    }
    tabela.innerHTML = '';

    console.log("PesquisarMaquina foi chamada para a máquina:", varMaquina, "com tickets:", todosOsTickets.length);

    const ticketsDaMaquinaEspecifica = todosOsTickets.filter(ticket => {
        const numeroSerialField = ticket.requestFieldValues.find(field => field.label === "Summary");
        let numeroSerial = "Desconhecido";
        if (numeroSerialField?.value) {
            const parts = numeroSerialField.value.trim().split(/\s+/);
            if (parts.length >= 2 && parts[0].toLowerCase() === "máquina") {
                numeroSerial = parts[1];
            } else {
                numeroSerial = parts[0];
            }
        }
        return numeroSerial.toLowerCase() === varMaquina.toLowerCase(); 
    });

    if (ticketsDaMaquinaEspecifica.length === 0) {
        tabela.innerHTML = `<tr><td colspan="${NUM_COLUNAS}">Nenhum ticket encontrado para a máquina: ${varMaquina}.</td></tr>`;
        return;
    }

    const urgenciaPrioridade = { "Leve": 1, "Grave": 2, "Crítico": 3, "Desconhecido": 0 };
    const recursosNomes = ['CPU', 'Memória', 'Disco', 'Rede', 'Tempo de Uso', 'Bateria'];
    const baseUrl = "https://sentinelacomvc.atlassian.net/browse/"; 

    const primeiroTicketFiltrado = ticketsDaMaquinaEspecifica[0];
    const dadosAgregadosDaMaquina = {
        numeroSerial: varMaquina,
        maxUrgenciaMaquina: "Desconhecido",
        prioridadeUrgenciaMaquina: 0,
        alertasPorRecurso: {},
        links: [],
        primeiroAlertaData: new Date(primeiroTicketFiltrado.createdDate.jira),
        ultimoAlertaData: new Date(primeiroTicketFiltrado.createdDate.jira),
        primeiroAlertaLink: `${baseUrl}${primeiroTicketFiltrado.issueKey || primeiroTicketFiltrado.key}`,
        ultimoAlertaLink: `${baseUrl}${primeiroTicketFiltrado.issueKey || primeiroTicketFiltrado.key}`,
    };

    recursosNomes.forEach(rNome => {
        dadosAgregadosDaMaquina.alertasPorRecurso[rNome] = {
            count: 0,
            maxUrgenciaParaEsteRecurso: "Desconhecido",
            prioridadeUrgenciaParaEsteRecurso: 0
        };
    });

    ticketsDaMaquinaEspecifica.forEach(ticket => {
        const status = ticket.currentStatus.status;
        if (status === "Em andamento" || status === "Pendente") {
            console.log(`Ticket ${ticket.issueKey} da máquina ${varMaquina} pulado devido ao status: ${status}`);
            return;
        }

        const urgenciaField = ticket.requestFieldValues.find(field => field.label === "Urgência");
        let urgencia = urgenciaField?.value?.value ?? urgenciaField?.value?.[0]?.value ?? "Desconhecido";
        urgencia = urgencia.toString().trim();
        urgencia = urgencia.charAt(0).toUpperCase() + urgencia.slice(1).toLowerCase();
        if (!urgenciaPrioridade.hasOwnProperty(urgencia)) urgencia = "Desconhecido";

        const recursoField = ticket.requestFieldValues.find(field => field.label === "Recurso");
        let recurso = recursoField?.value?.value ?? recursoField?.value?.[0]?.value ?? "Desconhecido";
        recurso = recurso.toString().trim();
        if (recurso.toLowerCase() === "memória ram") recurso = "Memória";
        if (recurso.toLowerCase() === "tempo de uso (uptime)") recurso = "Tempo de Uso";
        if (!recursosNomes.includes(recurso)) recurso = "Desconhecido";

        const createdDate = new Date(ticket.createdDate.jira);
        const link = `${baseUrl}${ticket.issueKey || ticket.key}`;

        if (createdDate < dadosAgregadosDaMaquina.primeiroAlertaData) {
            dadosAgregadosDaMaquina.primeiroAlertaData = createdDate;
            dadosAgregadosDaMaquina.primeiroAlertaLink = link; 
        }
        if (createdDate > dadosAgregadosDaMaquina.ultimoAlertaData) {
            dadosAgregadosDaMaquina.ultimoAlertaData = createdDate;
            dadosAgregadosDaMaquina.ultimoAlertaLink = link; 
        }
        dadosAgregadosDaMaquina.links.push({ url: link, date: createdDate });

        if (recurso !== "Desconhecido" && dadosAgregadosDaMaquina.alertasPorRecurso[recurso]) {
            const recursoNaMaquina = dadosAgregadosDaMaquina.alertasPorRecurso[recurso];
            recursoNaMaquina.count++;
            if (urgenciaPrioridade[urgencia] > recursoNaMaquina.prioridadeUrgenciaParaEsteRecurso) {
                recursoNaMaquina.maxUrgenciaParaEsteRecurso = urgencia;
                recursoNaMaquina.prioridadeUrgenciaParaEsteRecurso = urgenciaPrioridade[urgencia];
            }
        }

        if (urgenciaPrioridade[urgencia] > dadosAgregadosDaMaquina.prioridadeUrgenciaMaquina) {
            dadosAgregadosDaMaquina.maxUrgenciaMaquina = urgencia;
            dadosAgregadosDaMaquina.prioridadeUrgenciaMaquina = urgenciaPrioridade[urgencia];
        }
    });

    const linha = document.createElement("tr");
    const celSerial = document.createElement("td");
    const spanSerial = document.createElement("span");
    spanSerial.innerText = dadosAgregadosDaMaquina.numeroSerial;

    if (dadosAgregadosDaMaquina.maxUrgenciaMaquina === "Crítico") {
        spanSerial.classList.add("serial-highlight-red");
    } else if (dadosAgregadosDaMaquina.maxUrgenciaMaquina === "Grave") {
        spanSerial.classList.add("serial-highlight-yellow");
    } else if (dadosAgregadosDaMaquina.maxUrgenciaMaquina === "Leve") {
        spanSerial.classList.add("serial-highlight-green");
    } else {
        spanSerial.classList.add("serial-highlight-gray");
    }
    celSerial.appendChild(spanSerial);
    linha.appendChild(celSerial);

    recursosNomes.forEach(recursoNome => {
        const td = document.createElement("td");
        const dadosDoRecurso = dadosAgregadosDaMaquina.alertasPorRecurso[recursoNome];
        const qtdAlertasEsteRecurso = dadosDoRecurso.count;

        td.innerText = qtdAlertasEsteRecurso > 0 ? qtdAlertasEsteRecurso : "";
        td.classList.add("fontAdjust");

        if (qtdAlertasEsteRecurso > 0) {
            if (dadosDoRecurso.maxUrgenciaParaEsteRecurso === "Crítico") {
                td.style.color = "rgba(254, 73, 78, 1)";
            } else if (dadosDoRecurso.maxUrgenciaParaEsteRecurso === "Grave") {
                td.style.color = "rgba(255, 170, 0, 1)";
            } else if (dadosDoRecurso.maxUrgenciaParaEsteRecurso === "Leve") {
                td.style.color = "rgba(118, 198, 126, 1)";
            } else {
                td.style.color = "black";
            }
        }
        linha.appendChild(td);
    });

    const celLink = document.createElement("td");
    const aLinkPrincipal = document.createElement("a"); 

    if (dadosAgregadosDaMaquina.links.length > 0) {
        dadosAgregadosDaMaquina.links.sort((linkA, linkB) => linkB.date - linkA.date);
        aLinkPrincipal.href = dadosAgregadosDaMaquina.links[0].url;
    } else {
        aLinkPrincipal.href = "#";
    }
    aLinkPrincipal.innerText = "Ver ticket(s)";
    aLinkPrincipal.target = "_blank";
    celLink.appendChild(aLinkPrincipal);
    linha.appendChild(celLink);

    const celPrimeiroAlerta = document.createElement("td");
    const aPrimeiroAlerta = document.createElement("a");
    aPrimeiroAlerta.href = dadosAgregadosDaMaquina.primeiroAlertaLink || "#";
    aPrimeiroAlerta.target = "_blank";
    aPrimeiroAlerta.innerText = dadosAgregadosDaMaquina.primeiroAlertaData.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + " " + dadosAgregadosDaMaquina.primeiroAlertaData.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    celPrimeiroAlerta.appendChild(aPrimeiroAlerta);
    linha.appendChild(celPrimeiroAlerta);

    const celUltimoAlerta = document.createElement("td");
    const aUltimoAlerta = document.createElement("a");
    aUltimoAlerta.href = dadosAgregadosDaMaquina.ultimoAlertaLink || "#";
    aUltimoAlerta.target = "_blank";
    aUltimoAlerta.innerText = dadosAgregadosDaMaquina.ultimoAlertaData.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + " " + dadosAgregadosDaMaquina.ultimoAlertaData.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    celUltimoAlerta.appendChild(aUltimoAlerta);
    linha.appendChild(celUltimoAlerta);

    tabela.appendChild(linha);
    console.log("Máquina pesquisada e renderizada:", JSON.parse(JSON.stringify(dadosAgregadosDaMaquina)));
}



document.addEventListener('DOMContentLoaded', () => {
    console.log("alou DOMContentLoaded");
    async function fetchTickets() {
        console.log("alou fetch");
        try {                                                                                                   
            const response = await fetch('http://localhost:3333/jira/tickets');
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('Resposta da API (primeiro ticket):', data.values ? data.values[0] : "Nenhum ticket");

            if (data.values && Array.isArray(data.values)) {
                renderTickets(data.values);
            } else {
                console.error('A resposta não contém tickets ou não é um array');
            }
        } catch (error) {
            console.error('Erro ao buscar tickets:', error);
        }
    }

    function renderTickets(tickets) {
        const divPctCrit = document.getElementById("pctMaquinasCrit");
        const divPctGrave = document.getElementById("pctMaquinasGrave");
        const divPctComum = document.getElementById("pctMaquinasComuns");

        const iQtdCrit = document.getElementById("qtdMaquinasCrit");
        const iQtdGrave = document.getElementById("qtdMaquinasGrave");
        const iQtdComum = document.getElementById("qtdMaquinasComuns");

        const tabela = document.getElementById("tabaletaMaquinas").querySelector("tbody");
        tabela.innerHTML = '';

        const maquinasAgregadas = {};
        const urgenciaPrioridade = { "Leve": 1, "Grave": 2, "Crítico": 3, "Desconhecido": 0 };
        const recursosNomes = ['CPU', 'Memória', 'Disco', 'Rede', 'Tempo de Uso', 'Bateria'];
        const baseUrl = "https://sentinelacomvc.atlassian.net/browse/"; 

        tickets.forEach(ticket => {

            const status = ticket.currentStatus.status;

            if (status === "Em andamento" || status === "Pendente") {
                return;
            }

            const urgenciaField = ticket.requestFieldValues.find(field => field.label === "Urgência");
            let urgencia = urgenciaField?.value?.value ?? urgenciaField?.value?.[0]?.value ?? "Desconhecido";
            urgencia = urgencia.toString().trim();
            urgencia = urgencia.charAt(0).toUpperCase() + urgencia.slice(1).toLowerCase();
            if (!urgenciaPrioridade.hasOwnProperty(urgencia)) urgencia = "Desconhecido";


            const numeroSerialField = ticket.requestFieldValues.find(field => field.label === "Summary");
            let numeroSerial = "Desconhecido";

            if (numeroSerialField?.value) {
                const parts = numeroSerialField.value.trim().split(/\s+/);
                if (parts.length >= 2 && parts[0].toLowerCase() === "máquina") {
                    numeroSerial = parts[1];
                } else {
                    numeroSerial = parts[0];
                }
            }

            const recursoField = ticket.requestFieldValues.find(field => field.label === "Recurso");
            let recurso = recursoField?.value?.value ?? recursoField?.value?.[0]?.value ?? "Desconhecido";
            recurso = recurso.toString().trim();
            if (recurso.toLowerCase() === "memória ram") recurso = "Memória";
            if (recurso.toLowerCase() === "tempo de uso (uptime)") recurso = "Tempo de Uso";
            if (!recursosNomes.includes(recurso)) recurso = "Desconhecido";

            const link = `${baseUrl}${ticket.issueKey || ticket.key}`;
            const createdDate = new Date(ticket.createdDate.jira);


            if (!maquinasAgregadas[numeroSerial]) {
                maquinasAgregadas[numeroSerial] = {
                    numeroSerial: numeroSerial,
                    maxUrgenciaMaquina: "Desconhecido",
                    prioridadeUrgenciaMaquina: 0,
                    alertasPorRecurso: {},
                    links: [],
                    primeiroAlertaData: createdDate,
                    ultimoAlertaData: createdDate,
                    primeiroAlertaLink: link, 
                    ultimoAlertaLink: link,   
                };
                recursosNomes.forEach(rNome => {
                    maquinasAgregadas[numeroSerial].alertasPorRecurso[rNome] = {
                        count: 0,
                        maxUrgenciaParaEsteRecurso: "Desconhecido",
                        prioridadeUrgenciaParaEsteRecurso: 0
                    };
                });
            }

            const maquinaAtual = maquinasAgregadas[numeroSerial];

            if (createdDate < maquinaAtual.primeiroAlertaData) {
                maquinaAtual.primeiroAlertaData = createdDate;
                maquinaAtual.primeiroAlertaLink = link; 
            }
            if (createdDate > maquinaAtual.ultimoAlertaData) {
                maquinaAtual.ultimoAlertaData = createdDate;
                maquinaAtual.ultimoAlertaLink = link; 
            }

            maquinaAtual.links.push({ url: link, date: createdDate });

            if (recurso === "Desconhecido") {
                console.warn(`Recurso desconhecido no ticket ${ticket.issueKey}: ${recursoField?.value?.value ?? recursoField?.value?.[0]?.value}`);
            } else {
                const recursoNaMaquina = maquinaAtual.alertasPorRecurso[recurso];
                recursoNaMaquina.count++;
                if (urgenciaPrioridade[urgencia] > recursoNaMaquina.prioridadeUrgenciaParaEsteRecurso) {
                    recursoNaMaquina.maxUrgenciaParaEsteRecurso = urgencia;
                    recursoNaMaquina.prioridadeUrgenciaParaEsteRecurso = urgenciaPrioridade[urgencia];
                }
            }


            if (urgenciaPrioridade[urgencia] > maquinaAtual.prioridadeUrgenciaMaquina) {
                maquinaAtual.maxUrgenciaMaquina = urgencia;
                maquinaAtual.prioridadeUrgenciaMaquina = urgenciaPrioridade[urgencia];
            }
        });

        console.log("máquinas:", JSON.parse(JSON.stringify(maquinasAgregadas)));

        const maquinasOrdenadas = Object.values(maquinasAgregadas).sort((a, b) => {
            if (b.prioridadeUrgenciaMaquina !== a.prioridadeUrgenciaMaquina) {
                return b.prioridadeUrgenciaMaquina - a.prioridadeUrgenciaMaquina;
            }
            return b.ultimoAlertaData - a.ultimoAlertaData;
        });


        let qtdMaquinasCritico = 0;
        let qtdMaquinasGrave = 0;
        let qtdMaquinasLeve = 0;

        const alertasPorRecursoEUrgenciaGlobal = {};
        recursosNomes.forEach(rec => {
            alertasPorRecursoEUrgenciaGlobal[rec] = { Crítico: 0, Grave: 0, Leve: 0, Desconhecido: 0 };
        });
        let contagemTotalAlertasPorRecurso = {};
        recursosNomes.forEach(rec => contagemTotalAlertasPorRecurso[rec] = 0);

        maquinasOrdenadas.forEach(dadosMaquina => {
            if (dadosMaquina.maxUrgenciaMaquina === "Crítico") qtdMaquinasCritico++;
            else if (dadosMaquina.maxUrgenciaMaquina === "Grave") qtdMaquinasGrave++;
            else if (dadosMaquina.maxUrgenciaMaquina === "Leve") qtdMaquinasLeve++;

            const linha = document.createElement("tr");

            const celSerial = document.createElement("td");
            const spanSerial = document.createElement("span");
            spanSerial.innerText = dadosMaquina.numeroSerial;
            if (dadosMaquina.maxUrgenciaMaquina === "Crítico") {
                spanSerial.classList.add("serial-highlight-red");
            } else if (dadosMaquina.maxUrgenciaMaquina === "Grave") {
                spanSerial.classList.add("serial-highlight-yellow");
            } else if (dadosMaquina.maxUrgenciaMaquina === "Leve") {
                spanSerial.classList.add("serial-highlight-green");
            } else {
                spanSerial.classList.add("serial-highlight-gray");
            }
            celSerial.appendChild(spanSerial);
            linha.appendChild(celSerial);

            recursosNomes.forEach(recursoNome => {
                const td = document.createElement("td");
                const dadosDoRecursoEspecifico = dadosMaquina.alertasPorRecurso[recursoNome];
                const qtdAlertasEsteRecurso = dadosDoRecursoEspecifico.count;

                td.innerText = qtdAlertasEsteRecurso > 0 ? qtdAlertasEsteRecurso : "";
                td.classList.add("fontAdjust")


                if (qtdAlertasEsteRecurso > 0) {
                    contagemTotalAlertasPorRecurso[recursoNome] += qtdAlertasEsteRecurso;
                    if (dadosDoRecursoEspecifico.maxUrgenciaParaEsteRecurso !== "Desconhecido") {
                        alertasPorRecursoEUrgenciaGlobal[recursoNome][dadosDoRecursoEspecifico.maxUrgenciaParaEsteRecurso]++;
                    }


                    if (dadosDoRecursoEspecifico.maxUrgenciaParaEsteRecurso === "Crítico") {
                        td.style.color = "rgba(254, 73, 78, 1)";
                    } else if (dadosDoRecursoEspecifico.maxUrgenciaParaEsteRecurso === "Grave") {
                        td.style.color = "rgba(255, 170, 0, 1)";
                    } else if (dadosDoRecursoEspecifico.maxUrgenciaParaEsteRecurso === "Leve") {
                        td.style.color = "rgba(118, 198, 126, 1)";
                    } else {
                        td.style.color = "black";
                    }
                }

                linha.appendChild(td);
            });

            const celLink = document.createElement("td");
            const aLinkPrincipal = document.createElement("a"); 
            if (dadosMaquina.links.length > 0) {
                dadosMaquina.links.sort((linkA, linkB) => linkB.date - linkA.date);
                aLinkPrincipal.href = dadosMaquina.links[0].url;
            } else {
                aLinkPrincipal.href = "#";
            }
            aLinkPrincipal.innerText = "Ver ticket(s)";
            aLinkPrincipal.target = "_blank";
            celLink.appendChild(aLinkPrincipal);
            linha.appendChild(celLink);

            const celPrimeiroAlerta = document.createElement("td");
            const aPrimeiroAlerta = document.createElement("a");
            aPrimeiroAlerta.href = dadosMaquina.primeiroAlertaLink || "#";
            aPrimeiroAlerta.target = "_blank";
            aPrimeiroAlerta.innerText = dadosMaquina.primeiroAlertaData.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + " " + dadosMaquina.primeiroAlertaData.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            celPrimeiroAlerta.appendChild(aPrimeiroAlerta);
            linha.appendChild(celPrimeiroAlerta);

            const celUltimoAlerta = document.createElement("td");
            const aUltimoAlerta = document.createElement("a");
            aUltimoAlerta.href = dadosMaquina.ultimoAlertaLink || "#";
            aUltimoAlerta.target = "_blank";
            aUltimoAlerta.innerText = dadosMaquina.ultimoAlertaData.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + " " + dadosMaquina.ultimoAlertaData.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            celUltimoAlerta.appendChild(aUltimoAlerta);
            linha.appendChild(celUltimoAlerta);

            tabela.appendChild(linha);
        });

        const qtdMaquinasAlertasTotais = qtdMaquinasCritico + qtdMaquinasGrave + qtdMaquinasLeve;

        if (qtdMaquinasAlertasTotais > 0) {
            divPctCrit.innerText = ((qtdMaquinasCritico / qtdMaquinasAlertasTotais) * 100).toFixed(1) + "%";
            divPctGrave.innerText = ((qtdMaquinasGrave / qtdMaquinasAlertasTotais) * 100).toFixed(1) + "%";
            divPctComum.innerText = ((qtdMaquinasLeve / qtdMaquinasAlertasTotais) * 100).toFixed(1) + "%";
        } else {
            divPctCrit.innerText = "0%";
            divPctGrave.innerText = "0%";
            divPctComum.innerText = "0%";
        }

        iQtdCrit.innerText = `${qtdMaquinasCritico} máquinas com alertas crítico`;
        iQtdGrave.innerText = `${qtdMaquinasGrave} máquinas com alertas graves`;
        iQtdComum.innerText = `${qtdMaquinasLeve} máquinas com alertas leves`;

        if (window.myChartInstance) {
            window.myChartInstance.destroy();
        }

        const ctx = document.getElementById('myChart');
        if (!ctx) {
            console.warn("Elemento canvas 'myChart' não encontrado. O gráfico não será renderizado.");
            return;
        }

        const dataValues = recursosNomes.map(rec => contagemTotalAlertasPorRecurso[rec]);
        const maxValue = Math.max(...dataValues, 1);

        const coresUrgencia = {
            Crítico: `rgba(255, 106, 106, ALPHA)`,
            Grave: `rgb(255, 211, 100, ALPHA)`,
            Leve: `rgba(118, 198, 126, ALPHA)`,
            Desconhecido: `rgba(128, 128, 128, ALPHA)`
        };

        const backgroundColor = dataValues.map((valorAtual, index) => {
            const recursoAtual = recursosNomes[index];
            const urgenciasDoRecurso = alertasPorRecursoEUrgenciaGlobal[recursoAtual];
            let urgenciaCorPredominante = "Leve";

            if (urgenciasDoRecurso["Crítico"] > 0) {
                urgenciaCorPredominante = "Crítico";
            } else if (urgenciasDoRecurso["Grave"] > 0) {
                urgenciaCorPredominante = "Grave";
            } else if (urgenciasDoRecurso["Leve"] > 0) {
                urgenciaCorPredominante = "Leve";
            } else if (valorAtual > 0) {
                urgenciaCorPredominante = "Desconhecido";
            }


            const alpha = valorAtual > 0 ? Math.max(valorAtual / maxValue, 0.3) : 0.1;
            return coresUrgencia[urgenciaCorPredominante].replace("ALPHA", alpha.toFixed(2));
        });

        window.myChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: recursosNomes,
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
                            font: {
                                size: 12
                            },
                            generateLabels: function (chart) {
                                return [
                                    { text: 'Possui alertas críticos', fillStyle: coresUrgencia.Crítico.replace("ALPHA", "1"), strokeStyle: coresUrgencia.Crítico.replace("ALPHA", "1"), lineWidth: 1 },
                                    { text: 'Possui alertas graves', fillStyle: coresUrgencia.Grave.replace("ALPHA", "1"), strokeStyle: coresUrgencia.Grave.replace("ALPHA", "1"), lineWidth: 1 },
                                    { text: 'Somente alertas leves', fillStyle: coresUrgencia.Leve.replace("ALPHA", "1"), strokeStyle: coresUrgencia.Leve.replace("ALPHA", "1"), lineWidth: 1 }
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    fetchTickets();
});