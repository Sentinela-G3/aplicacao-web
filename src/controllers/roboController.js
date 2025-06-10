// var roboModel = require("../models/roboModel");

// function obterQtdTotal(req, res) {
//     let empresa = req.params.idEmpresa

//     roboModel.obterQtdTotal(empresa)
//       .then((resultado) => { res.status(200).json(resultado) }
//       ).catch(
//         function (erro) {
//           console.log(erro)
//           console.log("\nHouve um erro ao pegar os modelos de maquinas! Erro: ", erro.sqlMessage)
//           res.status(500).json(erro.sqlMessage)
//         }
//       )
//   }
  
//   function obterQtdComAlertas(req, res) {
//     let empresa = req.params.idEmpresa
  
//     roboModel.obterQtdComAlertas(empresa)
//           .then(function (resultado) {
//               if (resultado.length === 0) {
//                   res.status(404).json({ mensagem: "Máquina não encontrada com o serial informado." });
//               } else {
//                   res.status(200).json(resultado);
//               }
//           })
//           .catch(function (erro) {
//               console.log(erro);
//               console.log(
//                   "\nHouve um erro ao obter o ID da máquina! Erro: ",
//                   erro.sqlMessage
//               );
//               res.status(500).json(erro.sqlMessage);
//           });
//   }
  
//   module.exports = {
//     obterQtdTotal,
//     obterQtdComAlertas
// };