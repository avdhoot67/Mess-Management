const mysql = require('mysql2/promise');
require('dotenv').config();

const requiredDatabaseVariables = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingDatabaseVariables = requiredDatabaseVariables.filter((name) => !String(process.env[name] || '').trim());

if (missingDatabaseVariables.length > 0) {
    throw new Error(`Missing database configuration: ${missingDatabaseVariables.join(', ')}`);
}

const positiveInteger = (name, fallback) => {
    const value = Number(process.env[name] || fallback);
    if (!Number.isSafeInteger(value) || value < 1) {
        throw new Error(`${name} must be a positive integer`);
    }
    return value;
};

const poolOptions = {
    host: process.env.DB_HOST,
    port: positiveInteger('DB_PORT', 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: positiveInteger('DB_CONNECTION_LIMIT', 10),
    queueLimit: positiveInteger('DB_QUEUE_LIMIT', 25),
    connectTimeout: positiveInteger('DB_CONNECT_TIMEOUT_MS', 10000),
    maxIdle: positiveInteger('DB_MAX_IDLE', 10),
    idleTimeout: positiveInteger('DB_IDLE_TIMEOUT_MS', 60000),
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

if (process.env.DB_SSL === 'true') {
    poolOptions.ssl = {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    };
}

const pool = mysql.createPool(poolOptions);

module.exports = pool;
