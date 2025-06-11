create database sentinela;
use sentinela;

CREATE TABLE empresa (
    id_empresa INT PRIMARY KEY AUTO_INCREMENT,
    razao_social VARCHAR(100) NOT NULL,
    cnpj CHAR(14) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    data_inicio DATE NOT NULL,
    status TINYINT NOT NULL DEFAULT 2
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
        ON DELETE CASCADE 
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
        ON DELETE CASCADE 
);

CREATE TABLE modelo (
    id_modelo INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100)
);

CREATE TABLE maquina (
    id_maquina INT PRIMARY KEY AUTO_INCREMENT,
    fk_modelo INT,
    so VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    setor VARCHAR(50) NOT NULL,
    fk_maquina_empresa INT NOT NULL,
    FOREIGN KEY (fk_maquina_empresa)
        REFERENCES empresa(id_empresa) 
        ON DELETE CASCADE,
    FOREIGN KEY (fk_modelo)
        REFERENCES modelo(id_modelo) 
        ON DELETE CASCADE 
);

CREATE TABLE componente (
    id_componente INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(50) NULL,
    modelo VARCHAR(100),
    valor FLOAT NOT NULL,
    threshold_grave FLOAT, 
    threshold_critico FLOAT,
    threshold_leve FLOAT,
    unidade_medida VARCHAR(10),
    minimo FLOAT NULL DEFAULT 30.0,
    maximo FLOAT NULL DEFAULT 70.0,
    fk_componente_maquina INT NOT NULL,
    FOREIGN KEY (fk_componente_maquina)
        REFERENCES maquina(id_maquina) 
        ON DELETE CASCADE 
);

CREATE TABLE comandos_agente (
    id_comando INT PRIMARY KEY AUTO_INCREMENT,
    id_maquina VARCHAR(255) NOT NULL, 
    pid_processo INT NOT NULL,         
    tipo_comando VARCHAR(50) NOT NULL DEFAULT 'encerrar_processo', 
    status VARCHAR(50) NOT NULL DEFAULT 'pendente', 
    data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_execucao DATETIME NULL,
    mensagem_status TEXT NULL, 
    INDEX (id_maquina, status) 
);

CREATE TABLE historico (
    id_historico INT PRIMARY KEY AUTO_INCREMENT,
    data_captura DATETIME NOT NULL,
    valor FLOAT,
    fk_historico_componente INT NOT NULL,
    FOREIGN KEY (fk_historico_componente)
        REFERENCES componente(id_componente) 
        ON DELETE CASCADE 
);

CREATE TABLE alerta (
    id_alerta INT PRIMARY KEY AUTO_INCREMENT,
    data_captura DATETIME NOT NULL,
    valor FLOAT,
    fk_alerta_componente INT NOT NULL,
    FOREIGN KEY (fk_alerta_componente)
        REFERENCES componente(id_componente) 
        ON DELETE CASCADE 
);

INSERT INTO empresa (razao_social, cnpj, categoria, data_inicio, status) VALUES
('Amazon Robotics', '12345678000100', 'Tecnologia', '2023-01-15', 2);

INSERT INTO endereco_empresa (cep, numero, logradouro, estado, cidade, complemento, fk_endereco_empresa) VALUES
('01414-001', '595', 'Rua Haddock Lobo', 'SP', 'São Paulo', 'Cerqueira César', 1);

INSERT INTO colaborador (nome, email, telefone, senha, fotoPerfil, tipo, data_criacao, fk_colaborador_empresa) VALUES
('Administrador', 'adm@email.com', '11987654321', SHA2('123456', 256), NULL, 1, '2023-01-20', 1);

INSERT INTO colaborador (nome, email, telefone, senha, fotoPerfil, tipo, data_criacao, fk_colaborador_empresa) VALUES
('Mariana Campos', 'mariana@email.com', '11987654321', SHA2('123456', 256), NULL, 1, '2023-01-20', 1);

INSERT INTO colaborador (nome, email, telefone, senha, fotoPerfil, tipo, data_criacao, fk_colaborador_empresa) VALUES
('Gilberto Silva', 'gilberto@email.com', '11987654321', SHA2('123456', 256), NULL, 2, '2023-01-20', 1);

INSERT INTO colaborador (nome, email, telefone, senha, fotoPerfil, tipo, data_criacao, fk_colaborador_empresa) VALUES
('Ronaldo Alves', 'ronaldo@email.com', '11987654321', SHA2('123456', 256), NULL, 3, '2023-01-20', 1);

INSERT INTO modelo (nome) VALUES
('X100'),
('X200');

INSERT INTO maquina (fk_modelo, so, serial_number, setor, fk_maquina_empresa) VALUES
(1, 'Ubuntu Linux', 'PE037DC0', 'Setor A-12', 1),
(2, 'Windows 10 IoT', 'NHQJCAL005322003029Z00', 'Setor B-02', 1),
(1, 'Ubuntu Linux', 'PE03UVN2', 'Setor A-20', 1),
(2, 'Windows 10 IoT', 'FVFZTLKKL40Y', 'Setor C-66', 1),
(1, 'Ubuntu Linux', 'PE0DW7S5', 'Setor A-12', 1);

INSERT INTO componente (tipo, modelo, valor, threshold_grave, threshold_critico, threshold_leve, unidade_medida, fk_componente_maquina) VALUES
('cpu_percent', 'Intel i5', 55.0, 90.0, 75.0, 60.0, '%', 1),
('battery_percent', 'BatteryPack-A', 85.0, 20.0, 40.0, 60.0, '%', 1),
('ram_percent', '8GB DDR4', 45.0, 90.0, 75.0, 60.0, '%', 1),
('net_usage', 'Realtek Gigabit', 10.0, 90.0, 75.0, 60.0, 'ms', 1),
('disk_percent', 'SSD 256GB', 35.0, 90.0, 75.0, 60.0, '%', 1);

INSERT INTO componente (tipo, modelo, valor, threshold_grave, threshold_critico, threshold_leve, unidade_medida, fk_componente_maquina) VALUES
('cpu_percent', 'Intel i7', 65.0, 90.0, 75.0, 60.0, '%', 2),
('ram_percent', '16GB DDR4', 60.0, 90.0, 75.0, 60.0, '%', 2),
('net_usage', 'Intel Ethernet', 8.0, 90.0, 75.0, 60.0, 'ms', 2),
('disk_percent', 'HDD 1TB', 40.0, 90.0, 75.0, 60.0, '%', 2);

INSERT INTO componente (tipo, modelo, valor, threshold_grave, threshold_critico, threshold_leve, unidade_medida, fk_componente_maquina) VALUES
('cpu_percent', 'Intel i5', 55.0, 90.0, 75.0, 60.0, '%', 3),
('battery_percent', 'BatteryPack-A', 85.0, 20.0, 40.0, 60.0, '%', 3),
('ram_percent', '8GB DDR4', 45.0, 90.0, 75.0, 60.0, '%', 3),
('net_usage', 'Realtek Gigabit', 10.0, 90.0, 75.0, 60.0, 'ms', 3),
('disk_percent', 'SSD 256GB', 35.0, 90.0, 75.0, 60.0, '%', 3);

INSERT INTO componente (tipo, modelo, valor, threshold_grave, threshold_critico, threshold_leve, unidade_medida, fk_componente_maquina) VALUES
('cpu_percent', 'Intel i7', 65.0, 90.0, 75.0, 60.0, '%', 4),
('ram_percent', '16GB DDR4', 60.0, 90.0, 75.0, 60.0, '%', 4),
('net_usage', 'Intel Ethernet', 8.0, 90.0, 75.0, 60.0, 'ms', 4),
('disk_percent', 'HDD 1TB', 40.0, 90.0, 75.0, 60.0, '%', 4);

INSERT INTO componente (tipo, modelo, valor, threshold_grave, threshold_critico, threshold_leve, unidade_medida, fk_componente_maquina) VALUES
('cpu_percent', 'Intel i5', 55.0, 90.0, 75.0, 60.0, '%', 5),
('battery_percent', 'BatteryPack-A', 85.0, 20.0, 40.0, 60.0, '%', 5),
('ram_percent', '8GB DDR4', 45.0, 90.0, 75.0, 60.0, '%', 5),
('net_usage', 'Realtek Gigabit', 10.0, 90.0, 75.0, 60.0, 'ms', 5),
('disk_percent', 'SSD 256GB', 35.0, 90.0, 75.0, 60.0, '%', 5);