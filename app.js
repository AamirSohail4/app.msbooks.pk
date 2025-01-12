const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");
const cors = require("cors");
const pool = require("./db/db");
const util = require("util");
const crypto = require("crypto");
const db = require("./db/connection"); // MySQL connection pool
const bookRoutes = require("./routes/book.router");
const counterRoutes = require("./routes/counter.router");
const getConnection = util.promisify(pool.getConnection).bind(pool);
// Create a connection to the database

const app = express();
const port = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files to 'uploads/' directory
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use original file name
  },
});

// Adjust the limits for multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Set limit to 50 MB
  },
});

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve files from 'uploads/' directory
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from 'public'

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

// Adjust body-parser limits
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" })); // Limit URL-encoded data to 50 MB
app.use(bodyParser.json({ limit: "50mb" })); // Limit JSON data to 50 MB

// CORS configuration
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type, Authorization",
  credentials: true,
};

app.use(cors(corsOptions));

// Set view engine
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Register partials
const hbs = require("hbs");
hbs.registerPartials(path.join(__dirname, "views/partials"));

// Routes

app.post("/upload", upload.single("pdf"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res
    .status(200)
    .send({ message: "File uploaded successfully", url: req.file.path });
});
app.get("/", (req, res) => {
  res.redirect("/books");
});
app.get("/login", (req, res) => {
  res.render("login"); // This assumes you have a login.hbs file in your views folder
});

//   const { email, password } = req.body;
//   console.log("Email received:", email);
//   // MySQL query to find a user by email
//   const query = "SELECT * FROM users WHERE email = ?";
//   pool.getConnection((err, connection) => {
//     if (err) {
//       console.error("Error geting Connection building", err);
//       res.status(500).json({ error: "Database Connection Error" });
//     }
//     connection.query(query, [email], (error, results) => {
//       if (error) {
//         console.error("Error during login:", error);
//         return res
//           .status(500)
//           .json({ success: false, error: "Internal Server Error" });
//       }

//       if (results.length > 0) {
//         const user = results[0];

//         // Check if the provided password matches the stored password
//         if (user.password === password) {
//           // Generate JWT token with a static secret key
//           const token = jwt.sign(
//             { userId: user.id, email: user.email }, // Payload
//             "mySuperSecretKey12345", // Static secret key (replace with your key)
//             { expiresIn: "1h" } // Token expiration time
//           );

//           // Send the token and user ID in the response
//           res.status(200).json({
//             success: true,
//             message: "Successfully logged in",
//             token,
//             userId: user.id, // Include the user ID in the response
//           });
//         } else {
//           res.status(401).json({ success: false, error: "Invalid password" });
//         }
//       } else {
//         res.status(401).json({ success: false, error: "Invalid email" });
//       }
//     });
//   });
// });

//books adding  Query
app.get("/books", (req, res) => {
  const query = "SELECT * FROM books"; // Adjust this query if you need specific ordering or conditions

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching books:", err);
      return res.status(500).send("Error retrieving books");
    }

    // Mapping results to include an index value
    const booksWithIndex = results.map((book, index) => ({
      ...book,
      indexPlusOne: index + 1, // Create an index starting from 1
    }));

    // Render the books view and pass the book data
    res.render("books", { books: booksWithIndex });
  });
});
// app.get("/api/books", (req, res) => {
//   const query = "SELECT * FROM books";
//   pool.getConnection((err, connection) => {
//     if (err) {
//       console.error("Error getting connection from pool:", err);
//       return res.status(500).json({ error: "Database connection error" });
//     }
//     connection.query(query, (error, results) => {
//       if (error) {
//         console.error("Error retrieving data:", error);
//         return res.status(500).json({ error: "Error retrieving data" });
//       }

//       // Send the response as JSON

//       res.json(results);
//     });
//   });
// });

//books details Fetchings

app.get("/add-book", (req, res) => {
  res.render("add-book");
});
//end point add chepter

app.get("/update-book/:bookid", (req, res) => {
  const bookid = req.params.bookid;

  const query = `
    SELECT books.*, bookdetails.srno, bookdetails.chapterpath, bookdetails.chaptername
    FROM books
    LEFT JOIN bookdetails ON books.id = bookdetails.bookid
    WHERE books.id = ?
  `;
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection from pool:", err);
      return res.status(500).json({ error: "Database connection error" });
    }
    connection.query(query, [bookid], (err, results) => {
      if (err) {
        console.error("Error fetching book details:", err);
        return res
          .status(500)
          .render("update-book", { error: "Internal Server Error" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .render("update-book", { error: "Book not found" });
      }

      // Extract book info
      const book = {
        book_code: results[0].book_code,
        book_name: results[0].book_name,
        active: results[0].active,
      };

      // Extract book details
      const chapters = results.map((row) => ({
        srno: row.srno,
        chapterpath: row.chapterpath,
        chaptername: row.chaptername,
      }));

      res.render("update-book", { book, chapters });
    });
  });
});
app.post("/update-book", upload.array("files[]"), (req, res) => {
  const { book_id, book_code, book_name, active } = req.body;
  const chapters = JSON.parse(req.body.chapters || "[]");
  const activeValue = active === "on" ? 1 : 0;

  if (!book_id || !book_code || !book_name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Ensure files are uploaded and paths are correctly set
  const files = req.files.reduce((acc, file) => {
    acc[file.originalname] = file.filename; // Map file by original name
    return acc;
  }, {});

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection from pool:", err);
      return res.status(500).json({ error: "Database connection error" });
    }
    // Start transaction
    connection.beginTransaction((err) => {
      if (err) {
        return res.status(500).json({ error: "Transaction error" });
      }

      // Step 1: Fetch existing chapter paths from the database
      const fetchExistingPathsQuery = `
      SELECT srno, chapterpath
      FROM bookdetails
      WHERE bookid = ?
    `;

      connection.query(
        fetchExistingPathsQuery,
        [book_id],
        (err, existingChapters) => {
          if (err) {
            return connection.rollback(() => {
              res.status(500).json({ error: "Error fetching existing paths" });
            });
          }

          // Map existing chapters for quick lookup
          const existingPaths = existingChapters.reduce((acc, chapter) => {
            acc[chapter.srno] = chapter.chapterpath;
            return acc;
          }, {});

          console.log("That is a Fetching ExisistingPath", existingPaths);
          // Step 2: Prepare updated chapters
          const updatedChapters = chapters.map((chapter) => {
            const fileName = files[`${chapter.chapterpath}`]; // Match file name based on original chapterpath
            return {
              srno: chapter.srno,
              chaptername: chapter.chaptername,
              chapterpath: fileName
                ? `uploads/${fileName}` // Update with the new path if file is uploaded
                : existingPaths[chapter.srno] || chapter.chapterpath, // Use existing path if no new file is uploaded
            };
          });

          // Step 3: Update books table
          const updateBookQuery = `
        UPDATE books
        SET book_code = ?, book_name = ?, active = ?
        WHERE id = ?
      `;

          connection.query(
            updateBookQuery,
            [book_code, book_name, activeValue, book_id],
            (err, result) => {
              if (err) {
                return connection.rollback(() => {
                  res.status(500).json({ error: "Error updating book" });
                });
              }

              // Step 4: Delete existing bookdetails for this book
              const deleteBookDetailsQuery = `
            DELETE FROM bookdetails
            WHERE bookid = ?
          `;

              connection.query(
                deleteBookDetailsQuery,
                [book_id],
                (err, result) => {
                  if (err) {
                    return connection.rollback(() => {
                      res
                        .status(500)
                        .json({ error: "Error deleting book details" });
                    });
                  }

                  // Step 5: Insert new bookdetails
                  const insertBookDetailsQuery = `
              INSERT INTO bookdetails (bookid, srno, chaptername, chapterpath)
              VALUES ?
            `;

                  const bookDetailsValues = updatedChapters.map((chapter) => [
                    book_id,
                    chapter.srno,
                    chapter.chaptername,
                    chapter.chapterpath || existingPaths[chapter.srno], // Use existing path if new one is not provided
                  ]);

                  connection.query(
                    insertBookDetailsQuery,
                    [bookDetailsValues],
                    (err, result) => {
                      if (err) {
                        return connection.rollback(() => {
                          res
                            .status(500)
                            .json({ error: "Error inserting book details" });
                        });
                      }

                      // Commit transaction
                      connection.commit((err) => {
                        if (err) {
                          return connection.rollback(() => {
                            res
                              .status(500)
                              .json({ error: "Transaction commit error" });
                          });
                        }

                        res.json({ message: "Book updated successfully" });
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
});

app.post("/addBook-Chapter", upload.array("files[]"), async (req, res) => {
  const files = req.files;
  const SrNos = req.body.srno || [];
  const ChapterNames = req.body.chaptername || [];
  const book_code = req.body.book_code;
  const book_name = req.body.book_name;
  const userid = req.body.user_id;
  const active = req.body.active ? 1 : 0; // Convert to integer for SQL
  // const userid = 1; // Hardcoded user ID
  let bookId;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }
  const connection = await getConnection();

  try {
    // Step 1: Insert into books table
    const bookInsertQuery =
      "INSERT INTO books (book_code, userid, book_name, active) VALUES (?, ?, ?, ?)";
    const bookInsertParams = [book_code, userid, book_name, active];
    const bookResult = await new Promise((resolve, reject) => {
      connection.query(bookInsertQuery, bookInsertParams, (err, result) => {
        if (err) {
          console.error("Error inserting into books table:", err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    bookId = bookResult.insertId; // Get the newly inserted book ID

    // Step 2: Insert into BookDetails table
    const detailsPromises = files.map((file, i) => {
      const SrNo = SrNos[i] || null;
      const ChapterName = ChapterNames[i] || null;
      const ChapterPath = path.join("uploads", file.originalname); // Save with original name
      console.log("That is SrNO", SrNo);
      console.log("That is ChapterName", ChapterName);
      console.log("That is ChapterPath", ChapterPath);
      return new Promise((resolve, reject) => {
        const detailsInsertQuery =
          "INSERT INTO bookdetails (srno, bookid, chaptername, chapterpath) VALUES (?, ?, ?, ?)";
        const detailsInsertParams = [SrNo, bookId, ChapterName, ChapterPath];
        connection.query(
          detailsInsertQuery,
          detailsInsertParams,
          (err, result) => {
            if (err) {
              console.error("Error inserting into BookDetails table:", err);
              reject(err);
            } else {
              resolve(result);
            }
          }
        );
      });
    });

    // Wait for all promises to complete
    await Promise.all(detailsPromises);

    res.json({ message: "Books and details added successfully" });
  } catch (error) {
    console.error("Error adding book:", error);
    // Handle unique constraint violation
    if (error.code === "ER_DUP_ENTRY") {
      const uniqueViolationMessage =
        error.sqlMessage || "Unique constraint violation";
      let errorMessage = "A duplicate entry was found.";
      if (uniqueViolationMessage.includes("srno")) {
        errorMessage = "The SrNo already exists for this Bookid.";
      } else if (uniqueViolationMessage.includes("chaptername")) {
        errorMessage = "The ChapterName already exists for this Bookid.";
      }
      return res.status(409).json({ error: errorMessage });
    }
    // Handle other errors
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delet Query End point
app.delete("/delete-book/:book_id", (req, res) => {
  const bookId = req.params.book_id; // Adjusted variable name to bookId for consistency

  console.log("server side bookid:", bookId);
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection from pool:", err);
      return res.status(500).json({ error: "Database connection error" });
    }
    try {
      // Begin transaction to ensure atomic operations
      connection.beginTransaction((err) => {
        if (err) {
          console.error("Error starting transaction:", err);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        // First, delete attachments from the bookdetails table
        connection.query(
          "DELETE FROM bookdetails WHERE bookid = ?",
          [bookId],
          (err) => {
            if (err) {
              return connection.rollback(() => {
                console.error("Error deleting bookdetails:", err);
                res.status(500).json({ error: "Internal Server Error" });
              });
            }

            // Now, delete the book from the books table
            connection.query(
              "DELETE FROM books WHERE id = ?",
              [bookId],
              (deleteErr, deleteResult) => {
                if (deleteErr) {
                  return connection.rollback(() => {
                    console.error("Error deleting book:", deleteErr);
                    res.status(500).json({ error: "Internal Server Error" });
                  });
                }

                // Commit the transaction if everything was successful
                connection.commit((commitErr) => {
                  if (commitErr) {
                    return connection.rollback(() => {
                      console.error("Error committing transaction:", commitErr);
                      res.status(500).json({ error: "Internal Server Error" });
                    });
                  }

                  // Send success response
                  res.json({
                    message: "Book and its attachments deleted successfully",
                  });
                });
              }
            );
          }
        );
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
});
// Encryption endpoint
app.post("/encrypt/", (req, res) => {
  const { string } = req.body;
  const saltKey = req.headers["salt-key"]; // Get salt key from headers

  if (!string || !saltKey) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { iv, encryptedData } = encrypt(string, saltKey);
    return res.json({ iv, encryptedData });
  } catch (error) {
    return res.status(500).json({ error: "Encryption failed" });
  }
});

// Encrypt function
function encrypt(text, saltKey) {
  const key = crypto.scryptSync(saltKey, "salt", 32); // Derives a key from the salt
  const iv = crypto.randomBytes(16); // Generate a random Initialization Vector

  let cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return { iv: iv.toString("hex"), encryptedData: encrypted };
}
// Decryption endpoint
app.post("/decrypt", (req, res) => {
  const { encryptedData, iv, token } = req.body; // Expecting encrypted data, iv, and token in the request body

  if (!encryptedData || !iv || !token) {
    return res.status(400).json({
      error: "Missing parameters: encryptedData, iv, and token are required.",
    });
  }

  try {
    const decryptedData = decrypt(encryptedData, iv, token);
    res.json({
      status: "success",
      message: "Data decrypted successfully",
      data: decryptedData,
    });
  } catch (error) {
    console.error("Decryption error:", error);
    return res
      .status(500)
      .json({ error: "An error occurred during decryption" });
  }
});

// Decrypt function
function decrypt(encryptedData, ivHex, saltKey) {
  const algorithm = "aes-256-cbc";
  const key = crypto.createHash("sha256").update(saltKey).digest(); // Derive the key from the salt key
  const iv = Buffer.from(ivHex, "hex"); // Convert IV from hex string to buffer

  let decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedData, "hex", "utf8"); // Decrypt the data
  decrypted += decipher.final("utf8");

  return decrypted; // Return the decrypted data
}
app.post("/convert-base64-to-pdf", (req, res) => {
  const { base64String, fileName } = req.body;

  // Check for a valid base64 string
  if (!base64String) {
    return res.status(400).json({ error: "Base64 string is required" });
  }

  // Clean the Base64 string if it contains a data URL prefix
  const base64Data = base64String.replace(/^data:.*;base64,/, "");

  const filePath = path.join(uploadsDir, `${fileName}.pdf`);

  console.log("That is a filepath", filePath); // Log the file path for debugging purposes

  // Ensure the directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Write the Base64 data to a PDF file
  fs.writeFile(filePath, base64Data, "base64", (err) => {
    if (err) {
      console.error("Error writing file:", err);
      return res
        .status(500)
        .json({ error: "Failed to write file", details: err.message });
    }

    // Send the file for download
    res.download(filePath, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).send("Failed to send file.");
      }
    });
  });
});
app.use("/api", bookRoutes);
app.use("/api/capture", counterRoutes);
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
