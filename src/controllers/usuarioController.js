const { json } = require("express");
var usuarioModel = require("../models/usuarioModel");

function buscarPorId(req, res) {
    const idUsuario = req.params.idUsuario;

    if(!idUsuario) {
        res.status(400).send("ID Usuário não encontrado");
        return;
    }

    usuarioModel.buscarPorId(idUsuario)
    .then((usuario => {
        res.status(200).json({
            usuario
        })
    }))
    .catch(
        function (erro) {
            console.log(erro);
            console.log("\nHouve um erro ao realizar a busca! Erro: ", erro.sqlMessage);
            res.status(500).json(erro.sqlMessage);
        }
    );

}

function autenticar(req, res) {
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está indefinida!");
    } else {

        usuarioModel.autenticar(email, senha)
            .then(
                function (resultadoAutenticar) {
                    console.log(`\nResultados encontrados: ${resultadoAutenticar.length}`);
                    console.log(`Resultados: ${JSON.stringify(resultadoAutenticar)}`);

                    if (resultadoAutenticar.length == 1) {
                        console.log(resultadoAutenticar);
                        res.json({
                            resultadoAutenticar
                        })
                    } else if (resultadoAutenticar.length == 0) {
                        res.status(403).send("Email e/ou senha inválido(s)");
                    } else {
                        res.status(403).send("Mais de um usuário com o mesmo login e senha!");
                    }
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log("\nHouve um erro ao realizar o login! Erro: ", erro.sqlMessage);
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }

}

function cadastrar(req, res) {
    // Crie uma variável que vá recuperar os valores do arquivo cadastro.html
    var nome = req.body.nomeServer;
    var email = req.body.emailServer;
    var telefone = req.body.telefoneServer;
    var senha = req.body.senhaServer;
    var fkEmpresa = req.body.fkEmpresaServer;
    var tipoUsuario = req.body.tipoUsuarioServer; // Novo campo

    // Faça as validações dos valores
    if (nome == undefined) {
        res.status(400).send("Seu nome está undefined!");
    } else if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    } else if (telefone == undefined) {
        res.status(400).send("Seu telefone está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está undefined!");
    } else if (fkEmpresa == undefined) {
        res.status(400).send("Sua fkEmpresa está undefined!");
    } else if (tipoUsuario == undefined) {
        res.status(400).send("O tipo de usuário está undefined!");
    } else {
        // Passe os valores como parâmetro e vá para o arquivo usuarioModel.js
        usuarioModel.cadastrar(nome, email, telefone, senha, fkEmpresa, tipoUsuario)
            .then(
                function (resultado) {
                    res.json(resultado);
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log(
                        "\nHouve um erro ao realizar o cadastro! Erro: ",
                        erro.sqlMessage
                    );
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }
}

function listarPorEmpresa(req, res) {
    var fkEmpresa = req.params.fkEmpresa;

    if (!fkEmpresa) {
        res.status(400).send("O ID da empresa está indefinido!");
        return;
    }

    usuarioModel.listarPorEmpresa(fkEmpresa)
        .then(resultado => {
            if (resultado.length > 0) {
                res.json(resultado);
            } else {
                res.status(404).send("Nenhum usuário encontrado para esta empresa.");
            }
        })
        .catch(erro => {
            console.error("Erro ao buscar usuários:", erro);
            res.status(500).json(erro.sqlMessage);
        });
}

function deletar(req, res) {
    var idFuncionario = req.params.idFuncionario;

    if (!idFuncionario) {
        res.status(400).send("O ID do funcionário está indefinido!");
        return;
    }

    usuarioModel.deletar(idFuncionario)
        .then(() => {
            res.status(200).json({ mensagem: "Usuário deletado com sucesso" });
        })
        .catch(erro => {
            console.error("Erro ao buscar usuários:", erro);
            res.status(500).json(erro.sqlMessage);
        });

}

function atualizar(req, res) {
    const idFuncionario = req.params.idFuncionario;

    const { nomeServer, emailServer, telefoneServer, tipoUsuarioServer } = req.body;

    if (!idFuncionario) {
        return res.status(400).send("ID do funcionário não fornecido.");
    }

    if (!nomeServer || !emailServer || !telefoneServer || !tipoUsuarioServer) {
        return res.status(400).send("Todos os campos devem ser preenchidos.");
    }

    usuarioModel.atualizar(idFuncionario, nomeServer, emailServer, telefoneServer, tipoUsuarioServer)
        .then(() => res.status(200).send("Usuário atualizado com sucesso."))
        .catch(error => {
            console.error("Erro ao atualizar usuário:", error);
            res.status(500).send(error.sqlMessage);
        });
}

function buscarInformacoesPorEmail(req, res) {
    var email = req.body.emailServer;

    if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    } else {

        usuarioModel.buscarInformacoesPorEmail(email)
            .then(
                function (resultadoAutenticar) {
                    console.log(`\nResultados encontrados: ${resultadoAutenticar.length}`);
                    console.log(`Resultados: ${JSON.stringify(resultadoAutenticar)}`);

                    if (resultadoAutenticar.length == 1) {
                        console.log(resultadoAutenticar);
                        res.json({
                            resultadoAutenticar
                        })
                    } else if (resultadoAutenticar.length == 0) {
                        res.status(403).send("Nenhum usuário encontrado!");
                    } else {
                        res.status(403).send("Mais de um usuário encontrado!");
                    }
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log("\nHouve um erro ao realizar o login! Erro: ", erro.sqlMessage);
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }

}


function alterarImagem(req, res) {
    const imagem = req.file.filename;
    const id = req.body.id;
    console.log(id)
    const usuario = {id ,imagem }
    
    usuarioModel.alterarImagem(usuario)
    .then(resultado => {
      res.status(201).send("Foto de perfil alterada com sucesso");
    }).catch(err => {
      console.error("Erro ao executar a instrução SQL:", err.stack);
      res.status(500).send(err);
    });
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
}