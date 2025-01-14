const db = require("../db/connection"); // MySQL connection pool

class Counter {
  // Static async method to get all counters from the database
  static async getAllCounters() {
    const query = "SELECT * FROM screen_captchar_counter";
    try {
      const [rows, fields] = await db.promise().query(query);
      return rows;
    } catch (error) {
      console.error("Error:", error); // Log the error
      throw error;
    }
  }

  static async getCounterByUserID(user_id) {
    const query = "SELECT counter FROM screen_captchar_counter WHERE user_id=?";
    try {
      const [rows, fields] = await db.promise().query(query, [user_id]);
      // Directly return the first row (if exists) or null
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Error:", error); // Log the error
      throw error;
    }
  }

  static async getValueByKey(strKey) {
    const query = `SELECT strValue FROM key_values WHERE strKey = ?`;

    try {
      const [rows] = await db.promise().query(query, [strKey]);

      // Check if the key exists
      if (rows.length > 0) {
        return rows[0].strValue;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching value by key:", error);
      throw error;
    }
  }

  static async checkIfUserExists(user_id) {
    try {
      const query = `SELECT id FROM users WHERE id = ?`;
      const [rows] = await db.promise().query(query, [user_id]);

      // Return true if user exists, otherwise false
      return rows.length > 0;
    } catch (error) {
      console.error("Error in checkIfUserExists:", error);
      throw error;
    }
  }
  static async creatingCounter(data) {
    try {
      // Query to check if the user_id already exists in screen_captchar_counter
      const checkQuery = `SELECT * FROM screen_captchar_counter WHERE user_id = ?`;
      const [checkResult] = await db
        .promise()
        .query(checkQuery, [data.user_id]);

      let result;

      if (checkResult.length > 0) {
        // If user_id exists, increment the counter
        const updateQuery = `
          UPDATE screen_captchar_counter
          SET counter = counter + 1
          WHERE user_id = ?`;
        await db.promise().query(updateQuery, [data.user_id]);

        // Return the updated record
        const updatedRecordQuery = `SELECT * FROM screen_captchar_counter WHERE user_id = ?`;
        const [updatedRecord] = await db
          .promise()
          .query(updatedRecordQuery, [data.user_id]);
        result = updatedRecord[0]; // Updated record after counter increment
      } else {
        // If user_id does not exist, insert a new record with counter = 1
        const insertQuery = `
          INSERT INTO screen_captchar_counter (user_id, counter)
          VALUES (?, 1)`; // Set counter to 1 for new user_id
        const [insertResult] = await db
          .promise()
          .query(insertQuery, [data.user_id]);

        // Fetch the newly inserted record
        const selectNewRecordQuery = `SELECT * FROM screen_captchar_counter WHERE id = ?`;
        const [newRecord] = await db
          .promise()
          .query(selectNewRecordQuery, [insertResult.insertId]);
        result = newRecord[0]; // Newly created record with counter set to 1
      }

      // Log the counter update (you can implement your logging logic here)
      await this.createLog(data.user_id);

      return result; // Return the counter record (either updated or newly created)
    } catch (error) {
      console.error("Error in creatingCounter:", error);
      throw error;
    }
  }

  // static async creatingCounter(data) {
  //   try {
  //     // Query to check if the intUser_id already exists
  //     const checkQuery = `SELECT counter FROM screen_captchar_counter WHERE user_id= ?`;
  //     const [checkResult] = await db
  //       .promise()
  //       .query(checkQuery, [data.user_id]);

  //     let result;

  //     if (checkResult.length > 0) {
  //       // If intUser_id exists, increment the counter
  //       const updateQuery = `
  //         UPDATE screen_captchar_counter
  //         SET counter = counter + 1
  //         WHERE user_id = ?`;
  //       await db.promise().query(updateQuery, [data.user_id]);

  //       // Return the updated record
  //       const updatedRecordQuery = `SELECT * FROM screen_captchar_counter WHERE user_id = ?`;
  //       const [updatedRecord] = await db
  //         .promise()
  //         .query(updatedRecordQuery, [data.user_id]);
  //       result = updatedRecord[0];
  //     } else {
  //       // If intUser_id does not exist, insert a new record with counter = 1
  //       const insertQuery = `
  //         INSERT INTO screen_captchar_counter (user_id, counter)
  //         VALUES (?, ?)`;
  //       const [insertResult] = await db
  //         .promise()
  //         .query(insertQuery, [data.user_id, 1]);

  //       // Return the newly inserted record
  //       result = {
  //         //   id: insertResult.insertId,
  //         user_id: data.user_id,
  //         counter: 1,
  //       };
  //     }

  //     // Log the counter update
  //     await this.createLog(data.user_id);

  //     return result; // Return the counter record
  //   } catch (error) {
  //     console.error("Error in creatingCounter:", error);
  //     throw error;
  //   }
  // }

  //Get All Logs
  static async getAllUserLogs() {
    const query = "SELECT * FROM logs";
    try {
      const [rows, fields] = await db.promise().query(query);
      return rows;
    } catch (error) {
      console.error("Error:", error); // Log the error
      throw error;
    }
  }
  //Get User Logs aganist intUser_id
  static async getLogUserID(user_id) {
    const query = "SELECT id, timestamp FROM logs WHERE user_id = ?";
    try {
      const [rows, fields] = await db.promise().query(query, [user_id]);
      return rows;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }
  static async getAllLogs() {
    const query = "SELECT * FROM screen_captchar_counter";
    try {
      const [rows, fields] = await db.promise().query(query);
      return rows;
    } catch (error) {
      console.error("Error:", error); // Log the error
      throw error;
    }
  }

  static async existingKey(strKey) {
    const query = `SELECT strValue FROM key_values WHERE strKey = ?`;

    try {
      const [rows] = await db.promise().query(query, [strKey]);

      // Return the value if the key exists, otherwise return null
      return rows.length > 0 ? rows[0].strValue : null;
    } catch (error) {
      console.error("Error fetching value by key:", error);
      throw error;
    }
  }

  static async creatingKeyValue({ strKey, strValue }) {
    try {
      const insertQuery = `
      INSERT INTO key_values (strKey, strValue)
      VALUES (?, ?)
    `;
      const [insertResult] = await db
        .promise()
        .query(insertQuery, [strKey, strValue]);

      // Fetch the newly inserted record
      const selectQuery = `
      SELECT id, strKey, strValue
      FROM key_values
      WHERE id = ?
    `;
      const [newRecord] = await db
        .promise()
        .query(selectQuery, [insertResult.insertId]);

      return newRecord[0];
    } catch (error) {
      console.error("Error in creatingKeyValue:", error);
      throw error;
    }
  }

  static async createLog(user_id) {
    const query = `INSERT INTO logs (user_id, timestamp) VALUES (?, NOW())`;

    try {
      const [result] = await db.promise().query(query, [user_id]);
      return result; // Return the result of the insert query
    } catch (error) {
      console.error("Error creating log:", error);
      throw error;
    }
  }

  //Rest Counter Value
  static async resetCounterByUserID(user_id) {
    try {
      const query = `
      UPDATE screen_captchar_counter
      SET counter = 0
      WHERE user_id = ?`;
      const [result] = await db.promise().query(query, [user_id]);
      return result;
    } catch (error) {
      console.error("Error in resetCounterByUserID:", error);
      throw error;
    }
  }
}

module.exports = Counter;
