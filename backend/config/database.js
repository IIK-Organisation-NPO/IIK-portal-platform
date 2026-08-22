// backend/config/database.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'learner_portal',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4'
});

/**
 * Test database connection
 * @returns {Promise<boolean>} - True if connected successfully
 */
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        console.log(`📊 Database: ${process.env.DB_NAME || 'learner_portal'}`);
        console.log(`🔗 Host: ${process.env.DB_HOST || 'localhost'}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Please check your .env file and make sure MySQL is running`);
        return false;
    }
};

/**
 * Execute a query with parameters
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Query results
 */
const query = async (sql, params = []) => {
    try {
        const [rows] = await pool.query(sql, params);
        return rows;
    } catch (error) {
        console.error('❌ Query error:', error.message);
        throw error;
    }
};

/**
 * Get a single row from query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} - First row or null
 */
const getOne = async (sql, params = []) => {
    const rows = await query(sql, params);
    return rows[0] || null;
};

/**
 * Insert a row and return the insert ID
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<number>} - Insert ID
 */
const insert = async (sql, params = []) => {
    try {
        const [result] = await pool.query(sql, params);
        return result.insertId;
    } catch (error) {
        console.error('❌ Insert error:', error.message);
        throw error;
    }
};

/**
 * Update rows and return affected count
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<number>} - Affected rows
 */
const update = async (sql, params = []) => {
    try {
        const [result] = await pool.query(sql, params);
        return result.affectedRows;
    } catch (error) {
        console.error('❌ Update error:', error.message);
        throw error;
    }
};

/**
 * Delete rows and return affected count
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<number>} - Affected rows
 */
const deleteRows = async (sql, params = []) => {
    try {
        const [result] = await pool.query(sql, params);
        return result.affectedRows;
    } catch (error) {
        console.error('❌ Delete error:', error.message);
        throw error;
    }
};

/**
 * Begin a transaction
 * @returns {Promise<void>}
 */
const beginTransaction = async () => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    return connection;
};

/**
 * Commit a transaction
 * @param {Object} connection - MySQL connection
 * @returns {Promise<void>}
 */
const commitTransaction = async (connection) => {
    await connection.commit();
    connection.release();
};

/**
 * Rollback a transaction
 * @param {Object} connection - MySQL connection
 * @returns {Promise<void>}
 */
const rollbackTransaction = async (connection) => {
    await connection.rollback();
    connection.release();
};

// Export all functions
module.exports = {
    pool,
    testConnection,
    query,
    getOne,
    insert,
    update,
    deleteRows,
    beginTransaction,
    commitTransaction,
    rollbackTransaction
};