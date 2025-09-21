// src/db/pool.js (o como se llame)
/**
 * @fileoverview Configuración del pool de conexiones MySQL
 * @description Pool de conexiones MySQL configurado con variables de entorno
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';

/**
 * Pool de conexiones MySQL
 * @constant {mysql.Pool} pool
 * @description
 * Pool de conexiones MySQL configurado con las siguientes características:
 * - Conexiones persistentes y reutilizables
 * - Límite configurable de conexiones simultáneas
 * - Manejo automático de fechas como strings
 * - Soporte para números grandes
 * - Charset UTF-8 para caracteres especiales
 * 
 * @example
 * // Uso básico del pool
 * import { pool } from './connection/db.js';
 * 
 * const [rows] = await pool.execute('SELECT * FROM tiempos WHERE id = ?', [1]);
 * 
 * @example
 * // Transacciones
 * const connection = await pool.getConnection();
 * try {
 *   await connection.beginTransaction();
 *   await connection.execute('INSERT INTO ...');
 *   await connection.commit();
 * } catch (error) {
 *   await connection.rollback();
 *   throw error;
 * } finally {
 *   connection.release();
 * }
 */
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