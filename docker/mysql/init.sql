CREATE DATABASE sentinela;
USE sentinela;
DROP DATABASE sentinela;

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
    fotoPerfil VARCHAR(256) NULL,
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

SELECT * FROM empresa;
SELECT * FROM colaborador;
SELECT * FROM maquina;


INSERT INTO empresa (razao_social, cnpj, categoria, data_inicio, status)
VALUES ('Tech Solutions LTDA', '12345678000195', 'Tecnologia', '2023-01-15', 1);

INSERT INTO endereco_empresa (cep, numero, logradouro, estado, cidade, complemento, fk_endereco_empresa) 
VALUES ( '12345-678', 100, 'Rua das Inovações', 'SP', 'São Paulo', 'Próximo ao parque', LAST_INSERT_ID()
);

-- Inserindo um colaborador vinculado à empresa recém-inserida
INSERT INTO colaborador ( nome, email, telefone, senha, fotoPerfil, tipo, data_criacao, fk_colaborador_empresa) 
VALUES (
    'Ana Souza', 'ana.souza@techsolutions.com', '11999999999', 
    SHA2('senhaSegura123', 256),
    'https://exemplo.com/fotos/ana.jpg', 1, CURDATE(), LAST_INSERT_ID()
    );

-- Desativa o modo seguro
SET SQL_SAFE_UPDATES = 0;

-- Agora o UPDATE funciona sem WHERE com chave
UPDATE empresa
SET status = 2;

-- (Opcional) Reativa o modo seguro
SET SQL_SAFE_UPDATES = 1;


