
window.onload = listarModelosDetalhados;
window.addEventListener("load", contarAlertasUltimaSemana);
window.addEventListener("load", listarTempoAtividade);


function listarModelosDetalhados() {
    console.log("fkEmpresaServer enviado:", { fkEmpresaServer: 1 });
    fetch("/maquinas/listarModelosDetalhados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fkEmpresaServer: 1 })
    })
        .then(res => {
            if (!res.ok) {
                throw new Error("Falha na requisição. Status: " + res.status);
            }
            return res.json();
        })
        .then(data => {
            const tbody = document.getElementById("corpo-tabela-modelos");
            tbody.innerHTML = "";
            if (Array.isArray(data)) {
                data.forEach(maquina => {
                    const tr = document.createElement("tr");

                    tr.innerHTML =
                        `<td>${maquina.modelo}</td>
                    <td>${maquina.cpu}</td>
                    <td>${maquina.ram_gb}</td>
                    <td>${maquina.disco}</td>
                    <td>${maquina.capacidade_disco_gb}</td>
                    <td>${maquina.capacidade_tda}</td>
                    `
                        ;

                    tbody.appendChild(tr);
                });
            } else {
                console.error("Dados recebidos não são um array.");
            }
        })
        .catch(err => {
            console.error("Erro ao buscar modelos detalhados:", err);
        });
}

function listarTempoAtividade() {
    fetch("/maquinas/listarTempoAtividade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fkEmpresaServer: 1 })
    })
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById("corpo-tabela-maquinas");
            tbody.innerHTML = "";

            data.forEach(maquina => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
            <td>${maquina.serial_number}</td>
            <td>${maquina.tempo_atividade ?? 'Desligada'}</td>
            <td>${maquina.sistema_operacional}</td>
            <td>${maquina.modelo}</td>
        `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error("Erro ao buscar tempo de atividade:", err));
}

function contarAlertasUltimaSemana() {
    console.log("Enviando fkEmpresa para alertas da semana:", { fkEmpresaServer: 1 });

    fetch("/alertas/quantidadeUltimaSemana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fkEmpresaServer: 1 })
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Erro ao obter quantidade de alertas.");
            }
            return response.json();
        })
        .then(function (data) {
            console.log("Qtd total de alertas na ultima semana: ", data.totalUltimaSemana);
            document.getElementById('alertas-box-id').innerText = `Alertas da semana: \n\n ${data.totalUltimaSemana}`;
        })
        .catch(function (error) {
            console.error("Erro ao obter o qtd de alertas:", error);
        });
}

function obterAlertasAberto() {
    var idUsuario = sessionStorage.idUsuario;

    fetch(`/medidas/personagemFavorito/${idUsuario}`)
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Erro ao obter personagem favorito.");
            }
            return response.json();
        })
        .then(function (data) {
            console.log("Personagem favorito: ", data.nome);
            document.getElementById('persoFav').innerText = `${data.nome}`;
        })
        .catch(function (error) {
            console.error("Erro ao obter o personagem favorito:", error);
        });
}

fetch("/alertas/quantidadeMaquinas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fkEmpresaServer: 1 })
})
    .then(res => res.json())
    .then(data => {
        const ctx = document.getElementById('myChart');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['ativas', 'com alertas', 'TDA em risco', 'desativas'],
                datasets: [{
                    label: 'qtd de maquinas',
                    data: [
                        data.maquinas_ligadas,
                        data.maquinas_com_alertas,
                        data.maquinas_em_risco,
                        data.maquinas_desligadas
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    })
    .catch(err => {
        console.error("Erro ao carregar o gráfico:", err);
    });