var database = require("../database/config")

function autenticar(email, senha) {
    var instrucaoSql = `
         SELECT id_usuario, colaborador.nome as nome, email, tipo, fotoPerfil ,  id_empresa, empresa.status FROM colaborador join empresa on id_empresa = fk_colaborador_empresa WHERE email = '${email}' AND senha = SHA2('${senha}', 256);
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
         SELECT id_usuario, nome, tipo, DATE_FORMAT(data_criacao, '%Y-%m-%d') AS dataCriacao
        FROM colaborador
        WHERE fk_colaborador_empresa = ${fkEmpresa};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function deletar(idFuncionario) {
    var instrucaoSql = `
       DELETE
        FROM colaborador
        WHERE id_usuario = ${idFuncionario};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function atualizar(idFuncionario, nome, email, telefone, tipoUsuario) {
    var instrucaoSql = `
        UPDATE colaborador 
        SET nome = '${nome}', email = '${email}', telefone = '${telefone}', tipo = ${tipoUsuario} 
        WHERE id_usuario = ${idFuncionario};
    `;
    
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}


function buscarPorId(id) {
    var instrucaoSql = `SELECT * FROM colaborador where id_usuario = ${id}`;
    return database.executar(instrucaoSql);
}

function buscarInformacoesPorEmail(email) {
    var instrucaoSql = `
         SELECT colaborador.nome as nome, email, telefone, fotoPerfil, data_criacao FROM colaborador WHERE email = '${email}';
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}


function alterarImagem(usuario) {
    console.log(usuario)
  
    const instrucao = `UPDATE colaborador
                        SET fotoPerfil = '${usuario.imagem}'
                        WHERE id_usuario = ${usuario.id};`;
  
    console.log(instrucao)
  
    console.log('Passei aq no Model!')
    
    return database.executar(instrucao);
  }




module.exports = {
    autenticar,
    cadastrar,
    listarPorEmpresa,
    deletar,
    atualizar,
    buscarPorId,
    buscarInformacoesPorEmail,
    alterarImagem
};