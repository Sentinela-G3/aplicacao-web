CREATE DATABASE Sentinela;
USE Sentinela;
CREATE TABLE empresa (
    id_empresa INT PRIMARY KEY AUTO_INCREMENT,
    razao_social VARCHAR(100) NOT NULL,
    cnpj CHAR(14) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    data_inicio DATE NOT NULL,
    status TINYINT NOT NULL
);

CREATE TABLE endereco_empresa (
    id_endereco INT PRIMARY KEY AUTO_INCREMENT,
    cep CHAR(9) NOT NULL,
    numero INT NOT NULL,
    logradouro VARCHAR(250) NOT NULL,
    estado VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    complemento VARCHAR(100) NOT NULL,
    fk_endereco_empresa INT UNIQUE NOT NULL,
    FOREIGN KEY (fk_endereco_empresa)
        REFERENCES empresa(id_empresa) 
        ON DELETE CASCADE -- Exclui registros dependentes quando a empresa for excluída
);

CREATE TABLE colaborador (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(250) NOT NULL,
    email VARCHAR(250) NOT NULL,
    telefone CHAR(11) NOT NULL,
    senha CHAR(64) NOT NULL,
    fotoPerfil VARCHAR(256),
    tipo INT NOT NULL,
    data_criacao DATE,
    fk_colaborador_empresa INT NOT NULL,
    FOREIGN KEY (fk_colaborador_empresa)
        REFERENCES empresa(id_empresa) 
        ON DELETE CASCADE -- Exclui colaboradores quando a empresa for excluída
);

CREATE TABLE maquina (
    id_maquina INT PRIMARY KEY AUTO_INCREMENT,
    modelo VARCHAR(100) NOT NULL,
    so VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    status TINYINT NOT NULL,
    setor VARCHAR(50) NOT NULL,
    fk_maquina_empresa INT NOT NULL,
    FOREIGN KEY (fk_maquina_empresa)
        REFERENCES empresa(id_empresa) 
        ON DELETE CASCADE -- Exclui máquinas quando a empresa for excluída
);

CREATE TABLE componente (
    id_componente INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(50) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    valor FLOAT NOT NULL,
    minimo FLOAT NOT NULL,
    maximo FLOAT NOT NULL,
    fk_componente_maquina INT NOT NULL,
    FOREIGN KEY (fk_componente_maquina)
        REFERENCES maquina(id_maquina) 
        ON DELETE CASCADE -- Exclui componentes quando a máquina for excluída
);

CREATE TABLE comandos_agente (
    id_comando INT PRIMARY KEY AUTO_INCREMENT,
    id_maquina VARCHAR(255) NOT NULL, 
    pid_processo INT NOT NULL,         
    tipo_comando VARCHAR(50) NOT NULL DEFAULT 'encerrar_processo', -
    status VARCHAR(50) NOT NULL DEFAULT 'pendente', 
    data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_execucao DATETIME NULL,
    mensagem_status TEXT NULL, 
    INDEX (id_maquina, status) 
);

-- CAPTURA
CREATE TABLE historico (
    id_historico INT PRIMARY KEY AUTO_INCREMENT,
    data_captura DATETIME NOT NULL,
    valor FLOAT,
    fk_historico_componente INT NOT NULL,
    FOREIGN KEY (fk_historico_componente)
        REFERENCES componente(id_componente) 
        ON DELETE CASCADE -- Exclui histórico quando o componente for excluído
);

CREATE TABLE alerta (
    id_alerta INT PRIMARY KEY AUTO_INCREMENT,
    data_captura DATETIME NOT NULL,
    valor FLOAT,
    fk_alerta_componente INT NOT NULL,
    FOREIGN KEY (fk_alerta_componente)
        REFERENCES componente(id_componente) 
        ON DELETE CASCADE -- Exclui alertas quando o componente for excluído
);
