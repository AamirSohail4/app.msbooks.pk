const Counter = require("../models/counter.model"); // Import the Counter model

// Controller method to get all counters
exports.getAllCounters = async (req, res) => {
  try {
    const counters = await Counter.getAllCounters(); // Fetch all counters from the Counter model

    // Map through the counters to format the response
    const formattedCounters = counters.map((counter) => ({
      intID: counter.id,
      intUserID: counter.user_id,
      strCounter: counter.counter,
      dtCreatedAt: counter.created_at,
      dtUpdatedAt: counter.updated_at,
    }));

    res.status(200).json({
      success: true,
      message: "success",
      data: formattedCounters, // Return the formatted array
    });
  } catch (error) {
    console.error("Error fetching counters:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching counters",
      error: error.message,
    });
  }
};

exports.getSingleCounter = async (req, res) => {
  const { intUserID } = req.params;

  // Validate if intUser_id is provided
  if (!intUserID) {
    return res.status(200).json({
      success: false,
      message: "User ID is required.",
    });
  }

  try {
    // Call the model to get the counter by user ID
    const counter = await Counter.getCounterByUserID(intUserID);

    const counters = parseInt(counter.counter, 10);

    if (counter) {
      return res.status(200).json({
        success: true,
        message: "success",
        data: {
          intCounter: counters,
        },
      });
    } else {
      // No counter data found for the user
      return res.status(404).json({
        success: false,
        message: `No counter found for user ${intUserID}.`,
      });
    }
  } catch (error) {
    console.error("Error in getSingleCounter controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve counter due to server error.",
      error: error.message,
    });
  }
};

exports.createNewCounter = async (req, res) => {
  console.log("Request Body:", req.body);

  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "user_id is required.",
    });
  }

  try {
    const data = { user_id };

    const userRecord = await Counter.creatingCounter(data);

    return res.status(200).json({
      success: true,
      message: "Counter updated successfully.",
      data: {
        intID: userRecord.id,
        intUserID: userRecord.user_id,
        strCounter: userRecord.counter,
        dtCreatedAt: userRecord.created_at,
        dtUpdatedAt: userRecord.updated_at,
      },
    });
  } catch (error) {
    console.error("Error while creating/updating user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create or update counter due to a server error.",
      error: error.message,
    });
  }
};

exports.getValueByKey = async (req, res) => {
  const { strKey } = req.params;
  if (!strKey) {
    return res.status(400).json({
      success: false,
      message: "strKey is required.",
    });
  }

  try {
    // Call the model method to get the value for the given str_key
    const value = await Counter.getValueByKey(strKey);

    if (value) {
      return res.status(200).json({
        success: true,
        message: "success",
        data: { strKey, strValue: value },
      });
    } else {
      return res.status(404).json({
        success: false,
        message: `No value found for key: ${strKey}`,
      });
    }
  } catch (error) {
    console.error("Error fetching value by key:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch value due to server error.",
      error: error.message,
    });
  }
};
// Controller method to get all Logs
exports.getAllLogs = async (req, res) => {
  try {
    const counters = await Counter.getAllUserLogs(); // Fetch all logs from the Counter model

    // Map over the data to transform it into the desired format
    const formattedData = counters.map((counter) => ({
      intID: counter.id,
      intUserID: counter.user_id,
      dtTimeStapm: counter.timestamp,
    }));

    // Return the formatted data
    res.status(200).json({
      success: true,
      message: "success",
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching counters:", error);
    res.status(500).json({
      message: "Error fetching counters",
      error: error.message,
    });
  }
};

//Get Log User _id
exports.getSingleLogUser = async (req, res) => {
  const { intUserID } = req.params;

  // Validate if intUser_id is provided
  if (!intUserID) {
    return res.status(400).json({
      success: false,
      message: "User ID is required.",
    });
  }

  try {
    // Call the model to get counter by user ID
    const counter = await Counter.getLogUserID(intUserID);

    if (counter.length > 0) {
      return res.status(200).json({
        success: true,
        message: "success",
        data: {
          intID: counter[0]?.id,
          dtTimeStamp: counter[0]?.timestamp,
        },
      });
    } else {
      return res.status(404).json({
        success: false,
        message: `No Logs found for user ${intUserID}.`,
      });
    }
  } catch (error) {
    console.error("Error in get Logs controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve Logs due to server error.",
      error: error.message, // Optionally include for debugging
    });
  }
};

exports.createKeyValue = async (req, res) => {
  console.log("Request Body:", req.body);

  try {
    const { strKey, strValue } = req.body;

    if (!strKey || !strValue) {
      return res.status(400).json({
        success: false,
        message: "strKey and strValue are required.",
      });
    }

    // Check if the key already exists
    const existingKeyQuery = await Counter.existingKey(strKey);

    if (existingKeyQuery) {
      return res.status(409).json({
        success: false,
        message: "strKey already exists. Please use a unique key.",
      });
    }

    // Create the key-value pair
    const newRecord = await Counter.creatingKeyValue({
      strKey,
      strValue,
    });
    console.log("That is  newRecord", newRecord);
    return res.status(201).json({
      success: true,
      message: "success",
      data: {
        intID: newRecord.id,
        strKey: newRecord.strKey,
        strValue: newRecord.strValue,
      },
    });
  } catch (error) {
    console.error("Error in createKeyValue controller:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the key-value pair.",
      error: error.message,
    });
  }
};

//Rest Counter
exports.ResetCounter = async (req, res) => {
  try {
    const { intUserID } = req.params;

    // Validate input
    if (!intUserID) {
      return res.status(400).json({
        success: false,
        message: "intUserID is required.",
      });
    }

    // Check if the user exists
    const existingCounter = await Counter.getCounterByUserID(intUserID);
    if (!existingCounter) {
      return res.status(404).json({
        success: false,
        message: `No counter found for user ${intUserID}.`,
      });
    }

    // Reset the counter for the user
    await Counter.resetCounterByUserID(intUserID);

    return res.status(200).json({
      success: true,
      message: `Counter for user ${intUserID} has been reset to 0.`,
    });
  } catch (error) {
    console.error("Error in ResetCounter:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while resetting the counter.",
      error: error.message,
    });
  }
};
