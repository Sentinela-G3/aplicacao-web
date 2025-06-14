var ambiente_processo = 'local';
// var ambiente_processo = 'producao';

var caminho_env = ambiente_processo === 'producao' ?   '.env.dev' : '.env' ;
// Acima, temos o uso do operador ternário para definir o caminho do. arquivo .env
// A sintaxe do operador ternário é: condição ? valor_se_verdadeiro : valor_se_falso

require("dotenv").config({ path: caminho_env });

var express = require("express");
var cors = require("cors");
var path = require("path");
var PORTA_APP = process.env.APP_PORT;
var HOST_APP = process.env.APP_HOST;

var app = express();

var indexRouter = require("./src/routes/index");
var usuarioRouter = require("./src/routes/usuarios");
var empresasRouter = require("./src/routes/empresas");
var modeloRouter = require("./src/routes/modelos");
var maquinasRouter = require("./src/routes/maquinas")
var medidasRouter = require("./src/routes/medidas")
var jiraRouter = require("./src/routes/jira");
var alertaRouter = require("./src/routes/alertas");
var processoRouter = require("./src/routes/processos");
var bucketRouter = require("./src/routes/bucket");
// var robosRouter = require("./src/routes/robos")

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(cors({
   origin: 'http://localhost:3333'
}));

app.use("/", indexRouter);
app.use("/usuarios", usuarioRouter);
app.use("/empresas", empresasRouter);
app.use("/modelos", modeloRouter);
app.use("/medidas", medidasRouter)
app.use("/maquinas", maquinasRouter);
app.use("/jira", jiraRouter);
app.use("/alertas", alertaRouter);
app.use("/processos", processoRouter);
app.use("/bucket", bucketRouter);
// app.use("/robos", robosRouter)


app.listen(PORTA_APP, function () {
    console.log(`
    ##   ##  ######   #####             ####       ##     ######     ##              ##  ##    ####    ######  
    ##   ##  ##       ##  ##            ## ##     ####      ##      ####             ##  ##     ##         ##  
    ##   ##  ##       ##  ##            ##  ##   ##  ##     ##     ##  ##            ##  ##     ##        ##   
    ## # ##  ####     #####    ######   ##  ##   ######     ##     ######   ######   ##  ##     ##       ##    
    #######  ##       ##  ##            ##  ##   ##  ##     ##     ##  ##            ##  ##     ##      ##     
    ### ###  ##       ##  ##            ## ##    ##  ##     ##     ##  ##             ####      ##     ##      
    ##   ##  ######   #####             ####     ##  ##     ##     ##  ##              ##      ####    ######  
    \n\n\n                                                                                                 
    Servidor do seu site já está rodando! Acesse o caminho a seguir para visualizar .: http://${HOST_APP}:${PORTA_APP} :. \n\n
    Você está rodando sua aplicação em ambiente de .:${process.env.AMBIENTE_PROCESSO}:. \n\n
    \tSe .:desenvolvimento:. você está se conectando ao banco local. \n
    \tSe .:producao:. você está se conectando ao banco remoto. \n\n
    \t Usando o config bda arquivo: ${caminho_env}\n
    \t\tPara alterar o ambiente, comente ou descomente as linhas 1 ou 2 no arquivo 'app.js'\n\n`);
});
