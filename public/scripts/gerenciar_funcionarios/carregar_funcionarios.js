function carregarFuncionarios() {
    const idEmpresa = sessionStorage.idEmpresa;

    fetch(`/usuarios/listarPorEmpresa/${idEmpresa}`)
        .then(response => response.json())
        .then(funcionarios => {
            const grid = document.querySelector(".grid");
            grid.innerHTML = "";

            funcionarios.forEach(funcionario => {
                const card = document.createElement("div");
                card.classList.add("card");
                card.innerHTML = `
                    <h2>${funcionario.nome}</h2>
                    <p><strong>Tipo de Usuário:</strong> ${funcionario.tipoUsuario}</p>
                    <p><strong>Criado em:</strong> ${funcionario.dataCriacao}</p>
                    <div class="buttons">
                        <button class="edit" onclick="abrirModalEdicao(${funcionario.idUsuario})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete" onclick="excluirFuncionario(${funcionario.idUsuario})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                grid.appendChild(card);
            });
        })
        .catch(error => console.error("Erro ao carregar funcionários:", error));

   
}


function excluirFuncionario(idFuncionario) {
    const idUsuarioLogado = sessionStorage.getItem('idUsuario')
    if (idFuncionario == idUsuarioLogado) {
        alert("Você não pode excluir a si mesmo!");
        return;
    }

    if (confirm("Tem certeza que deseja excluir este funcionário?")) {
        fetch(`/usuarios/${idFuncionario}`, {
            method: "DELETE"
        })
            .then(response => {
                if (response.ok) {
                    alert("Funcionário excluído com sucesso!");
                    window.location.reload();
                } else {
                    alert("Erro ao excluir funcionário.");
                }
            })
            .catch(error => {
                console.error("Erro ao excluir:", error);
            });
    }
}

function atualizarFuncionario(idFuncionario) {
    const idUsuarioLogado = sessionStorage.idUsuario;
    if (!idFuncionario) {
        alert("ID do funcionário não encontrado!");
        return;
    }

    const nome = document.getElementById("edit-nome").value;
    const email = document.getElementById("edit-email").value;
    const telefone = document.getElementById("edit-telefone").value;
    const tipoUsuario = document.getElementById("edit-tipoUsuario").value;

    if (!nome || !email || !telefone || !tipoUsuario) {
        alert("Todos os campos devem ser preenchidos!");
        return;
    }

    // Enviando a requisição para o backend
    fetch(`/usuarios/${idFuncionario}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nomeServer: nome,
            emailServer: email,
            telefoneServer: telefone,
            tipoUsuarioServer: tipoUsuario
        })
    })
        .then(response => {
            if (response.ok) {
                alert("Usuário atualizado com sucesso!");
                window.location.reload();
            } else {
                response.text().then(text => alert("Erro ao atualizar: " + text));
            }
        })
        .catch(error => {
            console.error("Erro ao atualizar:", error);
        });
}

let idUsuarioAtual = null;

function abrirModalEdicao(idFuncionario) {
    idUsuarioAtual = idFuncionario;

    fetch(`/usuarios/${idFuncionario}`)
        .then(response => response.json())
        .then(dados => {
            dados = dados.usuario[0]
            console.log(dados)
            document.getElementById("edit-nome").value = dados.nome;
            document.getElementById("edit-email").value = dados.email;
            document.getElementById("edit-telefone").value = dados.telefone;
            document.getElementById("edit-tipoUsuario").value = dados.tipoUsuario;
            document.getElementById("editModal").style.display = "flex";
        })
        .catch(error => console.error("Erro ao buscar dados:", error));
}

function atualizarFuncionario() {
    if (!idUsuarioAtual) {
        alert("ID do funcionário não encontrado!");
        return;
    }

    const nome = document.getElementById("edit-nome").value;
    const email = document.getElementById("edit-email").value;
    const telefone = document.getElementById("edit-telefone").value;
    const tipoUsuario = document.getElementById("edit-tipoUsuario").value;

    if (!nome || !email || !telefone || !tipoUsuario) {
        alert("Todos os campos devem ser preenchidos!");
        return;
    }

    fetch(`/usuarios/${idUsuarioAtual}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nomeServer: nome,
            emailServer: email,
            telefoneServer: telefone,
            tipoUsuarioServer: tipoUsuario
        })
    })
        .then(response => {
            if (response.ok) {
                alert("Usuário atualizado com sucesso!");
                fecharModalEdicao();
                carregarFuncionarios();
            } else {
                response.text().then(text => alert("Erro ao atualizar: " + text));
            }
        })
        .catch(error => {
            console.error("Erro ao atualizar:", error);
        });
}


document.addEventListener("DOMContentLoaded", () => {
    const editModal = document.getElementById("editModal");
    const editButtons = document.querySelectorAll(".edit");
    const closeModalButton = document.querySelector("#editModal .close");

    editButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            editModal.style.display = "flex";
        });
    });

    closeModalButton.addEventListener("click", () => {
        fecharModalEdicao();
    });

    window.addEventListener("click", (event) => {
        if (event.target === editModal) {
            fecharModalEdicao();
        }
    });
});

function fecharModalEdicao() {
    const editModal = document.getElementById("editModal");
    editModal.style.display = "none";
}


carregarFuncionarios();