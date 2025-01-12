const { format } = require("mysql2");
const Books = require("../models/book.model");
const axios = require("axios");
const crypto = require("crypto");

const login = (req, res) => {
  const { email, password } = req.body;

  // Call the login method from the Books model
  Books.login(email, password, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, error: "An error occurred while logging in" });
    }

    // If login is successful, respond with a 200 status and the result
    if (result.success) {
      return res.status(200).json(result);
    }

    // If login fails (invalid password or email), respond with a 401 status
    res.status(401).json(result);
  });
};
// End point No 1
const getAllBooks = async (req, res) => {
  // Check for the Bearer Token
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Bearer token is missing" });
  }

  const token = authHeader.split(" ")[1]; // Extract the token
  const formData = new FormData();
  formData.append("strMessagingToken", token);
  try {
    // Call the token validation endpoint
    const response = await axios.post(
      "https://www.weberp.pk/app/msbooks/weberp_api.php?mask=msbooks&tag=validate_user_message_token",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Set content type for FormData
        },
      }
    );

    // Check if the response indicates successful validation
    console.log("That is a respone of ", response?.data.status);
    if (response.data.status && response.data.status == 1) {
      // Fetch all books if the token is valid
      Books.findAll((err, books) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "An error occurred while fetching books" }); // 500 Internal Server Error
        }
        res.json({
          status: 1,
          message: "success",
          data: books,
        });
      });
    } else {
      return res.status(403).json({ error: "User not authenticated" }); // Forbidden access
    }
  } catch (error) {
    console.error("Token validation error:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while validating the token" }); // 500 Internal Server Error
  }
};
// End point No 2
const getChapterList = async (req, res) => {
  const bookid = req.params.bookid;
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Bearer token is missing" });
  }

  const token = authHeader.split(" ")[1]; // Extract the token
  const formData = new FormData();
  formData.append("strMessagingToken", token);
  try {
    // Call the token validation endpoint
    const response = await axios.post(
      "https://www.weberp.pk/app/msbooks/weberp_api.php?mask=msbooks&tag=validate_user_message_token",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Set content type for FormData
        },
      }
    );

    // Check if the response indicates successful validation
    console.log("That is a respone of ", response?.data.status);
    if (response.data.status && response.data.status == 1) {
      // Fetch all books if the token is valid
      Books.getChaptersByBookId(bookid, (err, results) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "An error occurred while fetching chapters" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "No chapters found" });
        }

        res.json({
          status: 1,
          message: "success",
          data: results,
        });
      });
    } else {
      return res.status(403).json({ error: "User not authenticated" }); // Forbidden access
    }
  } catch (error) {
    console.error("Token validation error:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while validating the token" }); // 500 Internal Server Error
  }
};

const getBase64ChapterById = async (req, res) => {
  const chapter_id = req.params.chapter_id;
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "Bearer token is missing" });
  }

  const token = authHeader.split(" ")[1]; // Extract the token
  const formData = new FormData();
  formData.append("strMessagingToken", token);

  try {
    // Call the token validation endpoint
    const response = await axios.post(
      "https://www.weberp.pk/app/msbooks/weberp_api.php?mask=msbooks&tag=validate_user_message_token",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Set content type for FormData
        },
      }
    );

    // Check if the response indicates successful validation
    console.log("Response status:", response?.data.status);
    if (response.data.status && response.data.status == 1) {
      // Fetch chapter details if the token is valid
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

          // Encrypt the Base64 data using the token as the salt key
          const { iv, encryptedData } = encrypt(base64Data, token);

          // Send the encrypted data in the response
          res.json({
            status: "success",
            message: "Chapter retrieved successfully",
            data: {
              iv, // Ensure the IV is part of the response
              encryptedData, // The encrypted Base64 data
              fcmToken: token,
              format: "encriptedFile",
            },
          });
        });
      });
    } else {
      return res.status(403).json({ error: "User not authenticated" }); // Forbidden access
    }
  } catch (error) {
    console.error("Token validation error:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while validating the token" }); // 500 Internal Server Error
  }
};

// Simple encryption function using AES-256-CBC
function encrypt(data, saltKey) {
  const algorithm = "aes-256-cbc";
  const key = crypto.createHash("sha256").update(saltKey).digest(); // Create a derived key using SHA-256
  const iv = crypto.randomBytes(16); // Generate a random IV

  let cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, "utf8", "hex"); // Encrypt the data
  encrypted += cipher.final("hex");

  const ivHex = iv.toString("hex"); // Convert IV to hex string

  // Return the IV and encrypted data as an object for clarity
  return { iv: ivHex, encryptedData: encrypted };
}

//End point 4
const getSingleBookDetailsByCode = async (req, res) => {
  const { book_code } = req.params;
  // Check for the Bearer Token
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Bearer token is missing" });
  }

  const token = authHeader.split(" ")[1]; // Extract the token
  const formData = new FormData();
  formData.append("strMessagingToken", token);
  try {
    // Call the token validation endpoint
    const response = await axios.post(
      "https://www.weberp.pk/app/msbooks/weberp_api.php?mask=msbooks&tag=validate_user_message_token",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Set content type for FormData
        },
      }
    );

    // Check if the response indicates successful validation
    console.log("That is a respone of ", response?.data.status);
    if (response.data.status && response.data.status == 1) {
      // Fetch all books if the token is valid
      Books.getBookDetailsByCode(book_code, (err, results) => {
        if (err) {
          console.error("Error retrieving data:", err.message);
          return res
            .status(500)
            .json({ error: "Internal Server Error", details: err.message });
        }

        const response = {
          status: 1,
          message: "success",
          data: [],
        };

        // If results are found
        if (results.length > 0) {
          const { book_code, book_name } = results[0];
          response.data.push({
            book_code,
            book_name,
            chapterdetails: results.map(
              ({ chapterid, srno, chaptername, chapterpath }) => ({
                chapterid,
                srno,
                chaptername,
                chapterpath,
              })
            ),
          });
        } else {
          return res
            .status(404)
            .json({ error: "No book found with this code" });
        }

        console.log("Response data:", response);
        res.json(response);
      });
    } else {
      return res.status(403).json({ error: "User not authenticated" }); // Forbidden access
    }
  } catch (error) {
    console.error("Token validation error:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while validating the token" }); // 500 Internal Server Error
  }
};

module.exports = {
  getSingleBookDetailsByCode,
  getAllBooks,
  getChapterList,
  getBase64ChapterById,
  login,
};
