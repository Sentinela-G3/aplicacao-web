FROM mysql:latest
COPY ./init.sql /docker-entrypoint-initdb.d/ 
ENV MYSQL_ROOT_PASSWORD=senha123
EXPOSE 3307