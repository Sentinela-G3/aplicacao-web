
const modal = document.getElementById("userModal");
const openModalBtn = document.querySelector(".add-btn");
const closeModalBtn = document.querySelector(".close");
const form = document.getElementById("userForm");

// Abrir o modal ao clicar no botão
openModalBtn.addEventListener("click", () => {
    modal.style.display = "flex";
});

// Fechar o modal ao clicar no botão "X"
closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

// Fechar o modal ao clicar fora do conteúdo
window.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();


    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const telefone = document.getElementById("telefone").value;
    const senha = document.getElementById("senha").value;
    const tipoUsuarioTexto = document.getElementById("tipoUsuario").value;
    const fkEmpresa = sessionStorage.getItem("idEmpresa");

    let tipoUsuario;
    switch (tipoUsuarioTexto) {
        case "1":
            tipoUsuario = 1; 
            break;
        case "2":
            tipoUsuario = 2; 
            break;
        case "3":
            tipoUsuario = 3; 
            break;
        default:
            tipoUsuario = 3; 
    }

    if (!fkEmpresa) {
        alert("Erro: ID da empresa não encontrado. Faça login novamente.");
        return;
    }

    const novoUsuario = {
        nomeServer: nome,
        emailServer: email,
        telefoneServer: telefone,
        senhaServer: senha,
        fkEmpresaServer: fkEmpresa,
        tipoUsuarioServer: tipoUsuario
    };

    try {
        const response = await fetch("/usuarios/cadastrar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(novoUsuario)
        });

        const data = await response.json();

        if (response.ok) {
            alert("Usuário cadastrado com sucesso!");
           
            modal.style.display = "none";
            form.reset();

            setTimeout(() => {
                    window.location.reload();
                }, 1000);

            
            
          
        } else {
            alert("Erro ao cadastrar: " + data.mensagem);
        }
    } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        //alert("Erro ao conectar com o servidor.");
    }
});
