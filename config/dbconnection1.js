
DB_PASSWORD='Realforce@123';
const mysql = require('mysql2'); // Use mysql2 for async/await support
const { DB_HOST, DB_USERNAME, DB_NAME } = process.env;

// Create a connection pool
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // Allows up to 10 simultaneous connections
  queueLimit: 0,
  dateStrings: true, // Ensures dates are returned as strings
});

// Export a promise-based connection pool
const db = pool.promise();

// Optional: Test the connection to ensure it's working
db.getConnection()
  .then(() => {
    console.log('Database connected successfully!');
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1); // Exit process with failure code
  });

module.exports = db;
