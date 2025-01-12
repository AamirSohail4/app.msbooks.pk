const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("sdafsdf");
    cb(null, "/uploads");
  },
  filename: (req, file, cb) => {
    // console.log(path.extname(file.originalname));
    // const uniqueName = `${Date.now()}-${Math.round(
    //   Math.random() * 1e9
    // )}${path.extname(file.originalname)}`;
    // cb(null, uniqueName);
    // console.log(uniqueName);
    cb(null, file.originalname);
  },
});

const uploads = multer({
  storage,
});

module.exports = uploads;
