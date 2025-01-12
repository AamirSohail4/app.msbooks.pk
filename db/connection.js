const mysql = require("mysql2");

// Create a connection pool to the database
const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "knboyeul_solhutadmin",
  password: "phK*WLV1$+4~",
  database: "knboyeul_bookdb",
  // // host: "127.0.0.1",
  // // port: 3306,
  // // user: "root",
  // // password: "",
  // // database: "knboyeul_bookdb",
  // waitForConnections: true,
  // connectionLimit: 10,
  // queueLimit: 0,
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "knboyeul_bookdb",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
    return;
  }
  console.log("Database connected successfully!");

  // Release the connection back to the pool
  connection.release();
});

// Export the pool to be used in other modules
module.exports = pool;
