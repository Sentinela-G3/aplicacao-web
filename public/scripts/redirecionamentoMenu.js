function gerarMenuLateral(){
    const div_lateral = document.getElementById('container_navDashRT')
    const div_mobile = document.getElementById('navBar-mobile')
    
    if (!div_lateral) {
        console.warn('Elemento container_navDashRT não encontrado!');
        return;
    }

    if (!div_mobile) {
        console.warn('Elemento navBar-mobile não encontrado!');
        return;
    }

    div_lateral.innerHTML = `
                    <div class="perfil">
                            <div class="logo">
                                <img src="../assets/img/svgLogo.svg">
                                <span>Sentinela</span>
                            </div>
                            <div class="imagem_perfil">
                                <img id="fotoPerfil_menu" src="../assets/img/img_perfil_nav.jpg">
                            </div>
                            <div class="texto_perfil">
                                <span>
                                    Olá,
                                    <b>${sessionStorage.nomeUsuario}!</b>
                                </span>
                            </div>
                        </div>
                        <div class="btn_nav">
                            <div class="btn_dash" id="btn_dash">
                                
                            </div>
                            <div class="btn_sair">
                                <button onclick="sair()">Sair
                                    <img src="../assets/img/sair.png" alt="Sair">
                                </button>
                            </div>
                        </div>`;

    div_mobile.innerHTML =`<div class="logo-iconMenu">
            <div class="logo-mobile">
                <img  src="../assets/img/svgLogo.svg">
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
            <div class="imagem_perfil">
                <img id="fotoPerfil_menu_mobile" src="../assets/img/img_perfil_nav.jpg">
            </div>
            <div class="texto_perfil">
                <span>
                    Olá,
                    <b>Vinicius!</b>
                </span>
            </div>
        </div>

        <div class="options-menu-mobile" id="options-menu-mobile">
            <div class="btn_dash" id="btn_dash_mobile">
                
            </div>
            <div class="btn_sair">
                <button onclick="sair()">Sair
                    <img src="../assets/img/sair.png" alt="Sair">
                </button>
            </div>
        </div>`;
                    
    const foto = document.getElementById('fotoPerfil_menu')
    const foto_mobile = document.getElementById('fotoPerfil_menu_mobile')

    if(sessionStorage.fotoPerfil){
        foto.src = `../imagens_de_perfil/${sessionStorage.fotoPerfil}`
        foto_mobile.src = `../imagens_de_perfil/${sessionStorage.fotoPerfil}`
    }

    const btn_dash = document.getElementById('btn_dash');
    const btn_dash_mobile = document.getElementById('btn_dash_mobile');
    
    if(sessionStorage.tipoUsuario == 1 ){
        btn_dash.innerHTML = `<li>
                                    <button id="btn_rt" onclick="btn_rt()">Análise em tempo real</button>
                                </li>

                                <li>
                                    <button id="btn_hist" onclick="btn_hist()">Análise histórica</button>
                                </li>

                                <li>
                                    <button id="btn_alerta" onclick="btn_alerta()">Alertas</button>
                                </li>

                                 <li>
                                    <button id="btn_chamados" onclick="btn_chamados()">Suporte Técnico</button>
                                </li>

                                <li>
                                    <button id="btn_myConta" onclick="btn_myConta()" >Minha Conta</button>
                                </li>
                                `

    btn_dash_mobile.innerHTML = `<li>
                                <button id="btn_rt" onclick="btn_rt()">Análise em tempo real</button>
                            </li>

                            <li>
                                <button id="btn_hist" onclick="btn_hist()">Análise histórica</button>
                            </li>

                            <li>
                                <button id="btn_alerta" onclick="btn_alerta()">Alertas</button>
                            </li>

                             <li>
                                <button id="btn_chamados" onclick="btn_chamados()">Suporte Técnico</button>
                            </li>

                            <li>
                                <button id="btn_myConta" onclick="btn_myConta()" >Minha Conta</button>
                            </li>
                            `

    }else if( sessionStorage.tipoUsuario == 2){
        btn_dash.innerHTML = `<li>
                                    <button id="btn_geral" onclick="btn_geral()">Análise geral</button>
                                </li>

                                <li>
                                    <button id="btn_func" onclick="btn_func()">Gerenciamento de Funcionário</button>
                                </li>
                                
                                 <li>
                                    <button id="btn_chamados" onclick="btn_chamados()">Suporte Técnico</button>
                                </li>
                                
                                <li>
                                    <button id="btn_myConta" onclick="btn_myConta()" >Minha Conta</button>
                                </li>
                                `
    
    btn_dash_mobile.innerHTML = `<li>
                                <button id="btn_geral" onclick="btn_geral()">Análise geral</button>
                            </li>

                            <li>
                                <button id="btn_func" onclick="btn_func()">Gerenciamento de Funcionário</button>
                            </li>
                            
                             <li>
                                <button id="btn_chamados" onclick="btn_chamados()">Suporte Técnico</button>
                            </li>
                            
                            <li>
                                <button id="btn_myConta" onclick="btn_myConta()" >Minha Conta</button>
                            </li>
                            `
    }else if( sessionStorage.tipoUsuario == 3){
        btn_dash.innerHTML = `<li>
                                    <button id="btn_hist" onclick="btn_hist()">Análise histórica</button>
                                </li>

                                <li>
                                    <button id="btn_endereco" onclick="btn_endereco()">Gerenciamento de Endereços</button>
                                </li>

                                <li>
                                    <button id="btn_disp" onclick="btn_disp()">Gerenciamento de Modelo</button>
                                </li>
                                
                                <li>
                                    <button id="btn_maquina" onclick="btn_maquina()">Gerenciamento de Maquina</button>
                                </li>
                                
                                <li>
                                    <button id="btn_alerta" onclick="btn_alerta()">Alertas</button>
                                </li>
                                
                                 <li>
                                    <button id="btn_chamados" onclick="btn_chamados()">Suporte Técnico</button>
                                </li>
                                
                                <li>
                                    <button id="btn_myConta" onclick="btn_myConta()" >Minha Conta</button>
                                </li>
                                `

    btn_dash_mobile.innerHTML = `<li>
                                <button id="btn_hist" onclick="btn_hist()">Análise histórica</button>
                            </li>

                            <li>
                                <button id="btn_endereco" onclick="btn_endereco()">Gerenciamento de Endereços</button>
                            </li>

                            <li>
                                <button id="btn_disp" onclick="btn_disp()">Gerenciamento de Modelo</button>
                            </li>
                            
                            <li>
                                <button id="btn_maquina" onclick="btn_maquina()">Gerenciamento de Maquina</button>
                            </li>
                            
                            <li>
                                <button id="btn_alerta" onclick="btn_alerta()">Alertas</button>
                            </li>
                            
                             <li>
                                <button id="btn_chamados" onclick="btn_chamados()">Suporte Técnico</button>
                            </li>
                            
                            <li>
                                <button id="btn_myConta" onclick="btn_myConta()" >Minha Conta</button>
                            </li>
                            `
    } else if( sessionStorage.tipoUsuario == 4){
        btn_dash.innerHTML = `<li>
                                    <button id="btn_rt" onclick="btn_rt()">Análise em tempo real</button>
                                </li>

                                <li>
                                    <button id="btn_hist" onclick="btn_hist()">Análise histórica</button>
                                </li>

                                <li>
                                    <button id="btn_geral" onclick="btn_geral()">Análise geral</button>
                                </li>

                                <li>
                                    <button id="btn_endereco" onclick="btn_endereco()">Gerenciamento de Endereços</button>
                                </li>

                                <li>
                                    <button id="btn_func" onclick="btn_func()">Gerenciamento de Funcionário</button>
                                </li>
                                
                                <li>
                                    <button id="btn_disp" onclick="btn_disp()">Gerenciamento de Modelo</button>
                                </li>
                                
                                <li>
                                    <button id="btn_maquina" onclick="btn_maquina()">Gerenciamento de Maquina</button>
                                </li>
                                
                                <li>
                                    <button id="btn_alerta" onclick="btn_alerta()">Alertas</button>
                                </li>
                                
                                 <li>
                                    <button id="btn_chamados" onclick="btn_chamados()">Suporte Técnico</button>
                                </li>
                                
                                <li>
                                    <button id="btn_myConta" onclick="btn_myConta()" >Minha Conta</button>
                                </li>
                                `

    btn_dash_mobile.innerHTML = `<li>
                                <button id="btn_rt" onclick="btn_rt()">Análise em tempo real</button>
                            </li>

                            <li>
                                <button id="btn_hist" onclick="btn_hist()">Análise histórica</button>
                            </li>

                            <li>
                                <button id="btn_geral" onclick="btn_geral()">Análise geral</button>
                            </li>

                            <li>
                                <button id="btn_endereco" onclick="btn_endereco()">Gerenciamento de Endereços</button>
                            </li>

                            <li>
                                <button id="btn_func" onclick="btn_func()">Gerenciamento de Funcionário</button>
                            </li>
                            
                            <li>
                                <button id="btn_disp" onclick="btn_disp()">Gerenciamento de Modelo</button>
                            </li>
                            
                            <li>
                                <button id="btn_maquina" onclick="btn_maquina()">Gerenciamento de Maquina</button>
                            </li>
                            
                            <li>
                                <button id="btn_alerta" onclick="btn_alerta()">Alertas</button>
                            </li>
                            
                             <li>
                                <button id="btn_chamados" onclick="btn_chamados()">Suporte Técnico</button>
                            </li>
                            
                            <li>
                                <button id="btn_myConta" onclick="btn_myConta()" >Minha Conta</button>
                            </li>
                            `
    }

    const btnAtivo = sessionStorage.getItem('btnAtivo');

    if (btnAtivo) {
        const btn = document.getElementById(btnAtivo);
        if (btn) {
            btn.classList.add('agora');
        }
    }
}

function btn_rt(){
    window.location = './dash_realTime.html';
    sessionStorage.setItem('btnAtivo', 'btn_rt');
}

function btn_hist(){
    window.location = './dash_analiseDetalhada.html'
    sessionStorage.setItem('btnAtivo', 'btn_hist');
}

function btn_geral(){
    window.location = './dash_analiseGeral.html';
    sessionStorage.setItem('btnAtivo', 'btn_geral');
}

function btn_func() {
    window.location = './gerenciar_funcionarios.html';
    sessionStorage.setItem('btnAtivo', 'btn_endereco');
}

function btn_disp() {
    window.location = './cadastroModelo.html';
    sessionStorage.setItem('btnAtivo', 'btn_func');
}

function btn_maquina() {
    window.location = './cadastroMaquina.html';
    sessionStorage.setItem('btnAtivo', 'btn_disp');
}

function btn_endereco(){
    window.location = './cadastroEndereco.html';
    sessionStorage.setItem('btnAtivo', 'btn_maquina');
}

function btn_alerta(){
    window.location = './alertas.html';
    sessionStorage.setItem('btnAtivo', 'btn_alerta');

}

function btn_chamados(){
    window.location = './chamados.html';
    sessionStorage.setItem('btnAtivo', 'btn_chamados');
}

function btn_myConta(){
    window.location = './myConta.html';
    sessionStorage.setItem('btnAtivo', 'btn_myConta');
}

function sair(){
    window.location = '../index.html';
    sessionStorage.clear();
}

gerarMenuLateral()