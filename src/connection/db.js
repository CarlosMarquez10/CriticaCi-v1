// src/db/pool.js (o como se llame)
import 'dotenv/config';
import mysql from 'mysql2/promise';


const pool = mysql.createPool({
host: process.env.MYSQL_HOST,
user: process.env.MYSQL_USER,
password: process.env.MYSQL_PASSWORD,
database: process.env.MYSQL_DB,
waitForConnections: true,
connectionLimit: Number(process.env.MYSQL_CONN_LIMIT || 1000),
queueLimit: 0,
charset: 'utf8mb4_unicode_ci',

  // 👇 clave para que no vengan en ISO/Z
  dateStrings: true,          // DATE/TIMESTAMP/DATETIME como strings
  supportBigNumbers: true,
  bigNumberStrings: true,
});


export { pool };