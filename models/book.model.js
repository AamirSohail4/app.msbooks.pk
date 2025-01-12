const db = require("../db/connection"); // MySQL connection pool
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

let Books = {};

// Method to handle login logic
Books.login = (email, password, callback) => {
  const query = "SELECT * FROM users WHERE email = ?";

  // Query the database to find the user by email
  db.query(query, [email], (error, results) => {
    if (error) {
      return callback(error, null);
    }

    if (results.length > 0) {
      const user = results[0];

      // Check if the provided password matches the stored password
      if (user.password === password) {
        // Generate a JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email }, // Payload
          "mySuperSecretKey12345", // Static secret key (replace with your own key)
          { expiresIn: "1h" } // Token expiration time
        );

        // Return the token and user details via the callback
        callback(null, {
          success: true,
          message: "Successfully logged in",
          token,
          userId: user.id,
        });
      } else {
        callback(null, { success: false, error: "Invalid password" });
      }
    } else {
      callback(null, { success: false, error: "Invalid email" });
    }
  });
};
//End Point No:1

Books.findAll = (result) => {
  db.query("SELECT * FROM books", (err, res) => {
    if (err) {
      console.error("Error", err);
      result(null, err);
      return;
    }
    console.log("Books: ", res);
    result(null, res);
  });
};

//End Point No:2
Books.getBookDetailsByCode = (book_code, callback) => {
  const query = `
    SELECT bd.srno, b.book_code, b.book_name, bd.chaptername, bd.chapterpath
    FROM books b
    JOIN bookdetails bd ON b.id = bd.bookid
    WHERE b.book_code = ?
  `;

  // Use the connection pool to query the database
  db.query(query, [book_code], (error, results) => {
    if (error) {
      return callback(error, null);
    }
    callback(null, results);
  });
};
//End Point No: 3
// Fetch chapters by book ID
Books.getChaptersByBookId = (bookid, callback) => {
  const query = `
    SELECT bd.id AS chapterId, bd.chaptername
    FROM books b
    JOIN bookdetails bd ON b.id = bd.bookid
    WHERE b.id = ?
  `;

  db.query(query, [bookid], (error, results) => {
    if (error) {
      return callback(error, null);
    }
    callback(null, results);
  });
};
//End Point No 4

// Fetch chapter path by chapter ID
// Fetch chapter path by chapter ID
Books.getChapterPathById = (chapter_id, callback) => {
  const query = `
    SELECT chapterpath 
    FROM bookdetails 
    WHERE id = ?
  `;

  // Use the connection pool to query the database
  db.query(query, [chapter_id], (error, results) => {
    if (error) {
      return callback(error, null);
    }

    callback(null, results);
  });
};

// Convert file to Base64 format
Books.readFileAsBase64 = (chapterPath, callback) => {
  const absolutePath = path.resolve(chapterPath);

  // Read the file asynchronously
  fs.readFile(absolutePath, (err, data) => {
    if (err) {
      return callback(err, null);
    }

    // Convert the file data to Base64
    const base64Data = Buffer.from(data).toString("base64");
    callback(null, base64Data);
  });
};
// End Point 5

Books.getBookDetailsByCode = (book_code, callback) => {
  const query = `
    SELECT bd.id AS chapterid, srno, b.book_code, b.book_name, bd.chaptername, bd.chapterpath
    FROM books b
    JOIN bookdetails bd ON b.id = bd.bookid
    WHERE b.book_code = ?
  `; // Properly format the query string with backticks

  // Use db.query() directly
  db.query(query, [book_code], (error, results) => {
    if (error) {
      return callback(error, null);
    }
    callback(null, results);
  });
};
module.exports = Books;
