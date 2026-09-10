const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool with correct configuration
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'user_management_db', 
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 60000,     
    
});

// Test connection with better error handling
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log(' Database connected successfully to:', process.env.DB_NAME || 'iik_learner_portal2');
        connection.release();
        return true;
    } catch (error) {
        console.error('   Database connection failed:');
        console.error('   Error:', error.message);
        console.error('   Host:', process.env.DB_HOST || 'localhost');
        console.error('   Database:', process.env.DB_NAME || 'iik_learner_portal1');
        console.error('   User:', process.env.DB_USER || 'root');
        console.error('   Please check your .env file and MySQL server');
        return false;
    }
};

// Helper function to execute queries with error handling
const executeQuery = async (query, params = []) => {
    try {
        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('  Query execution error:', error.message);
        console.error('   Query:', query);
        console.error('   Params:', params);
        throw error;
    }
};

// Helper function to get a single row
const getOne = async (query, params = []) => {
    const rows = await executeQuery(query, params);
    return rows[0] || null;
};

// Helper function to insert and get ID
const insertAndGetId = async (query, params = []) => {
    const [result] = await pool.execute(query, params);
    return result.insertId;
};

// Helper function to get multiple rows
const getMany = async (query, params = []) => {
    return await executeQuery(query, params);
};

// Helper function to update and get affected rows
const updateAndGetCount = async (query, params = []) => {
    const [result] = await pool.execute(query, params);
    return result.affectedRows;
};

// Helper function to delete and get affected rows
const deleteAndGetCount = async (query, params = []) => {
    const [result] = await pool.execute(query, params);
    return result.affectedRows;
};

module.exports = { 
    pool, 
    testConnection, 
    executeQuery, 
    getOne, 
    getMany,
    insertAndGetId,
    updateAndGetCount,
    deleteAndGetCount
};