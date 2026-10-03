const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: Number(process.env.DB_QUEUE_LIMIT || 25),
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
    maxIdle: Number(process.env.DB_MAX_IDLE || 10),
    idleTimeout: Number(process.env.DB_IDLE_TIMEOUT_MS || 60000),
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

module.exports = pool;
