#!/bin/sh
set -e

# Monta a URL JDBC a partir das partes (host, porta, nome) quando DB_URL não foi informada,
# como acontece no Render, que fornece os dados do banco separadamente.
if [ -z "$DB_URL" ] && [ -n "$DB_HOST" ]; then
  export DB_URL="jdbc:postgresql://${DB_HOST}:${DB_PORT:-5432}/${DB_NAME:-educonnect}"
fi

# Plataformas como o Render definem a porta na variável PORT.
export SERVER_PORT="${SERVER_PORT:-${PORT:-8080}}"

exec java -XX:MaxRAMPercentage=75 -jar app.jar
