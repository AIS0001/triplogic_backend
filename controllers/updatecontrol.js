const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const db = require('../config/dbconnection')
const jwt = require('jsonwebtoken')
const path = require('path')
const fs = require('fs')
const csv = require('csv-parser')
const updateDataPara1 = (req, res) => {
  const authToken = req.headers.authorization.split(' ')[1]
  const table = [req.params.tablename]
  const pass = [req.body.pass]
  const col1 = [req.params.col1]
  const val1 = [req.params.val1]

  bcrypt.hash(req.body.pass, 10, (err, hash) => {
    if (err) {
      return res.status(400).send({
        msg: hash
      })
    } else {
      //insert data into database
      console.log(
        `UPDATE ${table} SET pass= '${hash}' where ${col1}= '${val1}'`
      )
      db.query(
        `UPDATE ${table} SET pass= '${hash}' where ${col1}= '${val1}'`,
        (err, result) => {
          if (err) {
            return res.status(400).send({
              msg: err
            })
          }
          return res.status(200).send({
            msg: 'Data updated'
          })
        }
      )
    }
  })
}
const updateStatus = (req, res) => {
  const authToken = req.headers.authorization.split(' ')[1]
  const table = [req.params.tablename]
  //const inv = [req.body.inv]
  const col1 = [req.params.col1]
  const val1 = [req.params.val1]
  console.log(`UPDATE ${table} SET status= 'paid' where ${col1}= ${val1}`)
  db.query(
    `UPDATE ${table} SET status= 'paid'  where ${col1}= ${val1}`,
    (err, result) => {
      if (err) {
        return res.status(400).send({
          msg: err
        })
      }
      return res.status(200).send({
        msg: 'Data updated'
      })
    }
  )
}
const updateSubscription = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ msg: "Authorization token missing" });
  }
  const authToken = authHeader.split(' ')[1];

  const id = req.params.id; // get subscription id from URL param
  const updateData = req.body; // expected to contain fields to update, e.g. { status: 'hold', customer_name: 'New Name' }
console.log(id);
console.log(updateData);
  if (!id) {
    return res.status(400).send({ msg: "Subscription ID is required" });
  }

  // Basic validation or sanitize here if needed

  // Build SET clause dynamically and use parameterized query to avoid SQL injection
  const fields = Object.keys(updateData);
  if (fields.length === 0) {
    return res.status(400).send({ msg: "No fields to update" });
  }

  const setClause = fields.map((field, idx) => `${field} = ?`).join(", ");
  const values = fields.map(field => updateData[field]);
  values.push(id); // for WHERE clause

  const sql = `UPDATE coresetting SET ${setClause} WHERE id = ?`;

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("DB update error:", err);
      return res.status(500).send({ msg: "Database error", error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ msg: "Subscription not found" });
    }

    res.status(200).send({ msg: "Subscription updated successfully" });
  });
};


const updateStatus1 = (req, res) => {
  const authToken = req.headers.authorization.split(' ')[1]
  const table = [req.params.tablename]
  const mode = [req.body.payment_mode]
  const col1 = [req.params.col1]
  const val1 = [req.params.val1]
  console.log(`UPDATE ${table} SET status= 'paid' where ${col1}= ${val1}`)
  db.query(
    `UPDATE ${table} SET payment_mode= '${mode}'  where ${col1}= ${val1}`,
    (err, result) => {
      if (err) {
        return res.status(400).send({
          msg: err
        })
      }
      return res.status(200).send({
        msg: 'Data updated'
      })
    }
  )
}
const updateCompanyInfo = (req, res) => {
  const authToken = req.headers.authorization.split(' ')[1]
  const table = [req.params.tablename]
  const cname = [req.body.cname]
  const address = [req.body.address]
  const pincode = [req.body.pincode]
  const gst = [req.body.gst]
  const contact = [req.body.contact]
  const state = [req.body.state]
  const bank = [req.body.bank]
  const t1 = [req.body.t1]
  const t2 = [req.body.t2]
  const t3 = [req.body.t3]

  const col1 = [req.params.col1]
  const val1 = [req.params.val1]
  console.log(`UPDATE ${table} SET status= 'paid' where ${col1}= ${val1}`)
  db.query(
    `UPDATE ${table} SET 
      cname= ${cname},
      address= ${address},
      pincode= ${pincode},
      contact= ${contact},
      gst= ${gst},
      state= ${state},
      bank= ${bank},
      t1= ${t1},
      t2= ${t2},
      t3= ${t3},
      
      where ${col1}= ${val1}`,
    (err, result) => {
      if (err) {
        return res.status(400).send({
          msg: err
        })
      }
      return res.status(200).send({
        msg: 'Data updated'
      })
    }
  )
}


const updatedata = (req, res) => {
  const table = req.params.tablename;
  const col1 = req.params.col1;  // WHERE column from URL
  const val1 = req.params.val1;  // WHERE value from URL
  const { updatedFields, where } = req.body;

  //console.log("Table:", table);
  //console.log("Updated Fields:", updatedFields);
  //console.log("URL WHERE - Column:", col1, "Value:", val1);
  //console.log("Body WHERE:", where);

  let whereClause = '';
  let whereValues = [];

  // Priority: Use URL parameters first, then body WHERE clause
  if (col1 && val1) {
    // Use URL parameters for WHERE clause
    whereClause = `${col1} = ?`;
    whereValues = [val1];
  } else if (where) {
    // Fallback to body WHERE clause
    if (typeof where === 'string') {
      // Custom WHERE clause as string
      whereClause = where;
      whereValues = req.body.whereValues || [];
    } else if (typeof where === 'object' && Object.keys(where).length > 0) {
      // Simple key-value WHERE conditions
      const whereConditions = Object.keys(where)
          .map(key => `${key} = ?`)
          .join(' AND ');
      whereClause = whereConditions;
      whereValues = Object.values(where);
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid WHERE clause in request body.' 
      });
    }
  } else {
    return res.status(400).json({ 
      success: false, 
      message: 'WHERE clause is required. Provide col1/val1 in URL or where clause in body.' 
    });
  }

  if (!updatedFields || Object.keys(updatedFields).length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'updatedFields is required and cannot be empty.' 
    });
  }

  // Construct the final SQL query
  const updateQuery = `UPDATE ?? SET ? WHERE ${whereClause}`;

  db.query(updateQuery, [table, updatedFields, ...whereValues], (error, result) => {
      if (error) {
          console.error("Error updating data:", error); // Check this log for any SQL or query errors
          return res.status(500).json({ success: false, message: 'Error updating data', error });
      }

      if (result.affectedRows > 0) {
          res.status(200).json({ success: true, message: 'Data updated successfully', affectedRows: result.affectedRows });
      } else {
          res.status(404).json({ success: false, message: 'Data not found' });
      }
  });
};



module.exports = {
  updateDataPara1,
  updateStatus,
  updateStatus1,
  updateCompanyInfo,
  updatedata,
  updateSubscription
}
