const form = document.getElementById("userForm");
const modal = document.getElementById("userModal");
const openModalBtn = document.querySelector(".add-btn");
const closeModalBtn = document.querySelector(".close");

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

    if (!nome || !email || !telefone || !senha || tipoUsuarioTexto === "#") {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    const emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailReg.test(email)) {
        alert('Email inválido. Verifique o formato.');
        return;
    }

    const telefoneReg = /^\d{11}$/;
    if (!telefoneReg.test(telefone)) {
        alert('Telefone inválido. O formato correto é 11999999999.');
        return;
    }

    const senhaReg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]|\\:;"'<>,.?/~`]).{8,}$/;
    if (!senhaReg.test(senha)) {
        alert('A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial.');
        return;
    }
    

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

document.querySelector(".pesq-btn").addEventListener("click", () => {
    const termo = document.getElementById("inputPesquisa").value.toLowerCase();
    const cards = document.querySelectorAll(".grid .card");

    cards.forEach(card => {
        const nome = card.querySelector("h2").textContent.toLowerCase();
        const corresponde = nome.includes(termo);
        card.style.display = corresponde ? "block" : "none";
    });
});

document.getElementById("inputPesquisa").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        document.querySelector(".pesq-btn").click();
    }
});
