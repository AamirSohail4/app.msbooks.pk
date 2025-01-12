const express = require("express");
const router = express.Router();
const counterController = require("../controllers/counter.Controller");
const multer = require("multer");

const upload = multer();
// Route to get all counters
router.get("/get_capture_screen", counterController.getAllCounters);
router.post(
  "/add_capture_screen",
  upload.none(),
  counterController.createNewCounter
);
router.get(
  "/get_capture_screen/:intUserID",
  counterController.getSingleCounter
);

// solve it
router.post("/add_key-values", upload.none(), counterController.createKeyValue);
router.get("/get_key-values/:strKey", counterController.getValueByKey);
//get logs
router.get("/get_logs", counterController.getAllLogs);
//solve it
router.get("/get_log/:intUserID", counterController.getSingleLogUser);

router.patch("/reset_counter/:intUserID", counterController.ResetCounter);

module.exports = router;
