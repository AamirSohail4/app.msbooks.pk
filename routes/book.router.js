const express = require("express");
const router = express.Router();
const bookController = require("../controllers/book.controller");

router.get("/getAllbooksDetails", bookController.getAllBooks);
router.get(
  "/singleBookDetail/:book_code",
  bookController.getSingleBookDetailsByCode
);
router.get("/chapterList/:bookid", bookController.getChapterList);

router.get("/getBase64/:chapter_id", bookController.getBase64ChapterById);
router.post("/login", bookController.login);
module.exports = router;
