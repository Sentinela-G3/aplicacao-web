function gerarMenuLateral() {
    const div_lateral = document.getElementById('container_navDashRT');
    const div_mobile = document.getElementById('navBar-mobile');

    if (!div_lateral || !div_mobile) {
        console.warn('Elementos do menu não encontrados!');
        return;
    }

    const nomeUsuario = sessionStorage.nomeUsuario || "Usuário";
    const fotoPerfil = sessionStorage.fotoPerfil ? `../imagens_de_perfil/${sessionStorage.fotoPerfil}` : "../assets/img/img_perfil_nav.jpg";
    console.log(sessionStorage.nomeUsuario)
    const perfilHTML = (idFoto) => `
        <div class="imagem_perfil">
            <img id="${idFoto}" src="${fotoPerfil}">
        </div>
        <div class="texto_perfil">
            <span>Olá, <b>${nomeUsuario}!</b></span>
        </div>`;

    div_lateral.innerHTML = `
        <div class="perfil">
            <div class="logo">
                <img src="../assets/img/svgLogo.svg">
                <span>Sentinela</span>
            </div>
            ${perfilHTML('fotoPerfil_menu')}
        </div>
        <div class="btn_nav">
            <div class="btn_dash" id="btn_dash"></div>
            <div class="btn_sair">
                <button onclick="sair()">Sair <img src="../assets/img/sair.png" alt="Sair"></button>
            </div>
        </div>`;

    div_mobile.innerHTML = `
        <div class="logo-iconMenu">
            <div class="logo-mobile">
                <img src="../assets/img/svgLogo.svg">
                <span>Sentinela</span>
            </div>
            <button class="menu-btn" id="menu-btn" onclick="animacaoMenu()">
                <svg width="35" height="25" viewBox="0 0 40 30" fill="black" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="5" rx="2" fill="#fae969"/>
                    <rect y="12" width="40" height="5" rx="2" fill="#fae969"/>
                    <rect y="24" width="40" height="5" rx="2" fill="#fae969"/>
                </svg>
            </button>
        </div>
        <div class="box-perfil" id="box-perfil">
            ${perfilHTML('fotoPerfil_menu_mobile')}
        </div>
        <div class="options-menu-mobile" id="options-menu-mobile">
            <div class="btn_dash" id="btn_dash_mobile"></div>
            <div class="btn_sair">
                <button onclick="sair()">Sair <img src="../assets/img/sair.png" alt="Sair"></button>
            </div>
        </div>`;

    preencherBotoes();
    marcarBotaoAtivo();
}

function preencherBotoes() {
    const botoesPadrao = [
        
    ];

    const botoesPorTipo = {
        1: [ // Administrador
            { id: 'btn_rt', label: 'Análise em tempo real', url: './dash_realTime.html' },
            { id: 'btn_hist', label: 'Análise detalhada', url: './dash_analiseDetalhada.html' },
            { id: 'btn_geral', label: 'Máquinas em manutenção', url: './dashManutencao.html' },
            { id: 'btn_suporte', label: 'Suporte Operacional', url: './suporteOperacional.html' },
            { id: 'btn_analitico', label: 'Desempenho Estatistico', url: './desempenhoEstatistico.html' },
            { id: 'btn_func', label: 'Gerenciamento de Funcionário', url: './gerenciar_funcionarios.html' },
            { id: 'btn_minhaConta', label: 'Minha Conta', url: './myConta.html' },
            ...botoesPadrao
        ],
        2: [ // Monitoramento
            { id: 'btn_rt', label: 'Análise em tempo real', url: './dash_realTime.html' },
            { id: 'btn_hist', label: 'Análise detalhada', url: './dash_analiseDetalhada.html' },
            ...botoesPadrao
        ],
        3: [ // Analista
            { id: 'btn_geral', label: 'Análise geral', url: './dash_analiseGeral.html' },
            ...botoesPadrao
        ]
    };

    const tipoUsuario = parseInt(sessionStorage.tipoUsuario) || 1;
    const botoes = botoesPorTipo[tipoUsuario] || [];

    const gerarHTML = botoes.map(botao => 
        `<li><button id="${botao.id}" onclick="navegar('${botao.url}', '${botao.id}')">${botao.label}</button></li>`
    ).join('');

    document.getElementById('btn_dash').innerHTML = gerarHTML;
    document.getElementById('btn_dash_mobile').innerHTML = gerarHTML;
}

function navegar(url, idBotao) {
    window.location = url;
    sessionStorage.setItem('btnAtivo', idBotao);
}

function marcarBotaoAtivo() {
    const btnAtivo = sessionStorage.getItem('btnAtivo');
    if (btnAtivo) {
        const btn = document.getElementById(btnAtivo);
        if (btn) btn.classList.add('agora');
    }
}

function sair() {
    sessionStorage.clear();
    window.location = '../index.html';
}

gerarMenuLateral();
