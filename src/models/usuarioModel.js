var database = require("../database/config")

function autenticar(email, senha) {
    var instrucaoSql = `
         SELECT idUsuario, colaborador.nome as nome, email, tipoUsuario, idEmpresa, empresa.status FROM colaborador join empresa on idEmpresa = colaborador.fkEmpresa WHERE email = '${email}' AND senha = SHA2('${senha}', 256);
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function cadastrar(nome, email, telefone, senha, fkEmpresa, tipoUsuario) {
    var instrucaoSql = `
        INSERT INTO colaborador (fk_colaborador_empresa, nome, email, telefone, senha, tipo, data_criacao) 
        VALUES (${fkEmpresa}, '${nome}', '${email}', '${telefone}', SHA2('${senha}', 256), ${tipoUsuario}, NOW());
    `;
    
    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    return database.executar(instrucaoSql);
}

function listarPorEmpresa(fkEmpresa) {
    var instrucaoSql = `
        SELECT idUsuario, nome, tipo, DATE_FORMAT(data_criacao, '%Y-%m-%d') AS dataCriacao
        FROM usuario
        WHERE fkEmpresa = ${fkEmpresa};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function deletar(idFuncionario) {
    var instrucaoSql = `
       DELETE
        FROM usuario
        WHERE idUsuario = ${idFuncionario};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function atualizar(idFuncionario, nome, email, telefone, tipoUsuario) {
    var instrucaoSql = `
        UPDATE usuario 
        SET nome = '${nome}', email = '${email}', telefone = '${telefone}', tipo = ${tipoUsuario} 
        WHERE id_usuario = ${idFuncionario};
    `;
    
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}


function buscarPorId(id) {
    var instrucaoSql = `SELECT * FROM usuario where idUsuario = ${id}`;
    return database.executar(instrucaoSql);
}





module.exports = {
    autenticar,
    cadastrar,
    listarPorEmpresa,
    deletar,
    atualizar,
    buscarPorId
};