function gerarMenuLateral(){
    const div_lateral = document.getAnimations('body_dashRealTime')

    div_lateral.innerHTML = `
                    <div class="perfil">
                            <div class="logo">
                                <img src="../assets/img/svgLogo.svg">
                                <span>Sentinela</span>
                            </div>
                            <div class="imagem_perfil">
                                <img id="fotoPerfil_menu">
                            </div>
                            <div class="texto_perfil">
                                <span>
                                    Olá,
                                    <b>${sessionStorage.nomeUsuario}!</b>
                                </span>
                            </div>
                        </div>
                        <div class="btn_nav">
                            <div class="btn_dash">
                                <li>
                                    <button onclick="btn_rt()">Análise em tempo real</button>
                                </li>
                                <li>
                                    <button onclick="btn_hist()">Análise histórica</button>
                                </li>
                                <li>
                                    <button onclick="btn_geral()">Análise geral</button>
                                </li>
                                <li>
                                    <button onclick="btn_endereco()">Gerenciamento de Endereços</button>
                                </li>
                                <li>
                                    <button onclick="btn_func()">Gerenciamento de Funcionário</button>
                                </li>
                                <li>
                                    <button onclick="btn_disp()">Gerenciamento de Modelo</button>
                                </li>
                                <li>
                                    <button onclick="btn_maquina()">Gerenciamento de Maquina</button>
                                </li>
                                <li>
                                    <button onclick="btn_alerta()" class="agora">Alertas</button>
                                </li>
                            </div>
                            <div class="btn_sair">
                                <button onclick="sair()">Sair
                                    <img src="../assets/img/sair.png" alt="Sair">
                                </button>
                            </div>
                        </div>`;
                    
    const foto = document.getElementById('fotoPerfil_menu')

    if(sessionStorage.fotoPerfil){
        foto.scr = "../assets/img/img_perfil_nav.jpg"
    }else{
        foto.scr = `../imagens_de_perfil/${sessionStorage.fotoPerfil}`
    }

                        
}

function btn_rt(){
    window.location = './dash_realTime.html';
}

function btn_hist(){
    window.location = './dash_analiseHistorico.html'
}

function btn_geral(){
    window.location = './dash_analiseGeral.html';
}

function btn_func() {
    window.location = './gerenciar_funcionarios.html';
}

function btn_disp() {
    window.location = './cadastroModelo.html';
}

function btn_maquina() {
    window.location = './cadastroMaquina.html';
}

function btn_endereco(){
    window.location = './cadastroEndereco.html';
}

function btn_alerta(){
    window.location = './alertas.html';

}

function btn_alerta(){
    window.location = './chamados.html';

}

function sair(){
    window.location = '../index.html';
    sessionStorage.clear();
}

gerarMenuLateral()