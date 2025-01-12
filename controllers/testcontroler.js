const { format } = require("mysql2");
const Books = require("../models/book.model");
const jwt = require("jsonwebtoken");

const validateToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return decoded;
  } catch (err) {
    return null;
  }
};

// End point No 1
const getAllBooks = (req, res) => {
  // Check for the Bearer Token
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "Bearer token is missing" });
  }

  const token = authHeader.split(" ")[1];

  // Validate the Bearer Token
  const decoded = validateToken(token);
  if (!decoded) {
    return res.status(403).json({ error: "Token is not valid" }); // 403 Forbidden
  }

  console.log("That is a deode", decoded);
  // If token is valid, fetch all books
  Books.findAll((err, books) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "An error occurred while fetching books" }); // 500 Internal Server Error
    }
    res.json({ books }); // Successful response
  });
};

//End Point No 2
const getSingleBookDetailsByCode = (req, res) => {
  const { book_code } = req.params;
  const authHeader = req.headers["authorization"];

  // Check if the authorization header is missing
  if (!authHeader) {
    return res.status(401).json({ error: "Bearer token is missing" });
  }

  // Split the Bearer token properly
  const token = authHeader.split(" ")[1];
  const decoded = validateToken(token);

  // Validate the token
  if (!decoded) {
    return res.status(403).json({
      error: "Bearer token is not valid",
    });
  }

  // Fetch the book details from the database
  Books.getBookDetailsByCode(book_code, (err, results) => {
    if (err) {
      console.error("Error retrieving data:", err.message);
      return res
        .status(500)
        .json({ error: "Internal Server Error", details: err.message });
    }

    // console.log("Results from database:", results); // This line is crucial for debugging

    const response = {
      item: null,
      chapterdetails: [],
    };

    // If results are found
    if (results.length > 0) {
      const { book_code, book_name } = results[0];
      response.item = { book_code, book_name };
      response.chapterdetails = results.map(
        ({ chapterid, srno, chaptername, chapterpath }) => ({
          chapterid,
          srno,
          chaptername,
          chapterpath,
        })
      );
    } else {
      return res.status(404).json({ error: "No book found with this code" });
    }

    console.log("Response data:", response);
    res.json(response);
  });
};
//End point No :3
// Controller for fetching chapters by book ID
const getChapterList = (req, res) => {
  const bookid = req.params.bookid;
  const authHeader = req.headers["authorization"];

  // Check if the authorization header is missing
  if (!authHeader) {
    return res.status(401).json({ error: "Bearer token is missing" });
  }

  // Split the Bearer token properly
  const token = authHeader.split(" ")[1];
  const decoded = validateToken(token);

  // Validate the token
  if (!decoded) {
    return res.status(403).json({
      error: "Bearer token is not valid",
    });
  }

  Books.getChaptersByBookId(bookid, (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "An error occurred while fetching chapters" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No chapters found" });
    }

    res.json({ chapterdetails: results });
  });
};
//End point no 4

const getBase64ChapterById = (req, res) => {
  const chapter_id = req.params.chapter_id;
  const authHeader = req.headers["authorization"];

  // Check if the authorization header is missing
  if (!authHeader) {
    return res.status(401).json({ error: "Bearer token is missing" });
  }

  // Split the Bearer token properly
  const token = authHeader.split(" ")[1];
  const decoded = validateToken(token);

  // Validate the token
  if (!decoded) {
    return res.status(403).json({
      error: "Bearer token is not valid",
    });
  }

  Books.getChapterPathById(chapter_id, (err, results) => {
    if (err) {
      console.error("Error fetching chapter details:", err);
      return res.status(500).json({ error: "Database connection error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const chapterPath = results[0].chapterpath;
    console.log("Chapter path:", chapterPath); // Log the path for debugging

    // Convert the file to Base64
    Books.readFileAsBase64(chapterPath, (err, base64Data) => {
      if (err) {
        console.error("Error reading file:", err);
        return res.status(500).json({ error: "Error reading file" });
      }

      // Send the Base64 data as the response
      res.json({
        statuse: "succsse",
        message: "chapter retrive succssefuly",
        data: {
          base64Data,
          format: "application/pdf",
        },
      });
    });
  });
};
// End point 5
const getSingleBookDetailsByBookCode = (req, res) => {
  const { book_code } = req.params;
  const authHeader = req.headers["authorization"];

  // Check if the authorization header is missing
  if (!authHeader) {
    return res.status(401).json({ error: "Bearer token is missing" });
  }

  // Split the Bearer token properly
  const token = authHeader.split(" ")[1];
  const decoded = validateToken(token);

  // Validate the token
  if (!decoded) {
    return res.status(403).json({
      error: "Bearer token is not valid",
    });
  }

  // Log the received book_code for debugging
  console.log("Received book_code:", book_code);

  Books.getBookDetailsByCode(book_code, (err, results) => {
    if (err) {
      console.error("Error retrieving data:", err.message);
      return res
        .status(500)
        .json({ error: "Internal Server Error", details: err.message });
    }

    const response = {
      item: null,
      chapterdetails: [],
    };

    if (results.length > 0) {
      const { book_code, book_name } = results[0];
      response.item = { book_code, book_name };

      response.chapterdetails = results.map(
        ({ chapterid, srno, chaptername, chapterpath }) => ({
          chapterid,
          srno,
          chaptername,
          chapterpath,
        })
      );
    }

    // Log the final response object for debugging
    console.log("Response data:", response);
    res.json(response);
  });
};

module.exports = {
  getSingleBookDetailsByCode,
  getAllBooks,
  getChapterList,
  getBase64ChapterById,
  getSingleBookDetailsByBookCode,
};
