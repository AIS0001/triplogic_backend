const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const db = require('../config/dbconnection')
const jwt = require('jsonwebtoken')
const path = require('path')
const fs = require('fs')
const csv = require('csv-parser')

const insertdata = (req, res) => {
  console.log('=== INSERT DATA DEBUG ===');
  console.log('Table name:', req.params.tablename);
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);

  // Validate request body
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send({
      msg: 'Request body is empty. Please provide data to insert.',
      error: 'EMPTY_BODY'
    });
  }

  const table = [req.params.tablename]
  const val3 = req.body
  const val = Object.values(val3)
  const keyval = Object.keys(val3)
  const val2 = val.length ? "'" + val.join("', '") + "'" : ''


  let setty = `INSERT INTO ${table} (${keyval}) values (${val2})`
  console.log('Generated SQL:', setty);

  db.query(
    `INSERT INTO ${table} (${keyval}) values (${val2})`,
    (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(400).send({
          msg: err.message || err,
          error: 'DATABASE_ERROR',
          sql: setty
        })
      }
      else{
         // Retrieve the last inserted ID correctly
    const insertedId = result.insertId; // Use result.insertId to get the inserted record's ID
//console.log(insertedId);
        return res.status(200).send({
            msg: 'Data saved successfully',
            id: insertedId,  // Return the newly inserted ID or any relevant data
          })

      }
     
    }
  )
}
const savebill = async (req, res) => {
  // Get DB connection
  const connection = await db.getConnection(); // Get DB connection

  // Start transaction
  await connection.beginTransaction();

  try {
    const { customer_id, subtotal, tax, discount_type, discount_value,discount_amount, roundoff, payment_mode } = req.body;

    // Calculate discount amount
    let discount_amounts = discount_type === "percentage" ? (subtotal * discount_value) / 100 : discount_value;
    let net_total = subtotal + tax - discount_amounts + roundoff;

    // 1️⃣ Insert Bill into `final_bill`
    const billQuery = `
      INSERT INTO final_bill (customer_id, inv_date, inv_time, subtotal, tax, discount_type, discount_value, discount_amount, roundoff, net_total, payment_mode)
      VALUES (?, CURDATE(), CURTIME(), ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    //console.log('Executing Query:', billQuery); // Log the query
    const [billResult] = await connection.execute(
      billQuery,
      [customer_id, subtotal, tax, discount_type, discount_value, discount_amount, roundoff, net_total, payment_mode]
    );
    console.log(discount_amounts);
    console.log(discount_amount);
    const bill_id = billResult.insertId; // Get new bill ID

    // 2️⃣ Create Ledger Entries
    let ledgerEntries = [];

    // Sales Entry (Credit)
    ledgerEntries.push(["Sales Account", "credit", net_total, bill_id]);

    // Payment Entries Based on Payment Mode
    if (payment_mode === "Cash") {
      ledgerEntries.push(["Cash Account", "debit", net_total, bill_id]);
    } else if (payment_mode === "Credit") {
      ledgerEntries.push(["Accounts Receivable", "debit", net_total, bill_id]);
    }

    // Discount Entry (Debit)
    if (discount_amount > 0) {
      ledgerEntries.push(["Discount Given", "debit", discount_amount, bill_id]);
    }

    // Round-Off Entry
    if (roundoff !== 0) {
      ledgerEntries.push(["Round Off", roundoff > 0 ? "debit" : "credit", Math.abs(roundoff), bill_id]);
    }

    // Insert into `ledger_entries`
    const ledgerQuery = `
      INSERT INTO ledger_entries (account_name, entry_type, amount, reference_id) VALUES ?
    `;
    console.log('Executing Ledger Query:', ledgerQuery); // Log the ledger query
    console.log('Ledger Data:', ledgerEntries); // Log the data being inserted
    await connection.query(ledgerQuery, [ledgerEntries]);

    // Commit transaction
    await connection.commit(); // Commit transaction
    res.status(201).json({ success: true, message: "Bill & Ledger saved successfully!", bill_id });

  } catch (error) {
    // Rollback transaction on error
    await connection.rollback();
    console.error("Error saving bill:", error);
    res.status(500).json({ success: false, message: "Error saving bill", error });
  } finally {
    // Release connection
    connection.release(); // Release connection
  }
};





const insertdatabulk = (req, res) => {
  // Check if the table name is provided and is a valid string
  const tableName = req.params.tablename;
  const validTableNames = ['order_items','advance_order_items']; // Add valid table names to this array
  
  if (!validTableNames.includes(tableName)) {
    return res.status(400).send({ success: false, message: 'Invalid table name' });
  }

  const items = req.body.items; // Get the items array

  // Check if items is provided and is an array with at least one item
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).send({ success: false, message: 'No items provided' });
  }

  const values = items.map(item => [
    item.order_number,
    item.table_number,
    item.item_name,
    item.quantity,
    item.total_amount,
    item.status,
  ]);

  // Bulk insert query
  const query = `INSERT INTO ${tableName} (order_id, table_number, item_name, quantity, total_price,status) VALUES ?`;

  // Log the query and its values for debugging
  //console.log('Executing query:', query);
  //console.log('With values:', values);

  db.query(query, [values], (err, results) => {
    if (err) {
      console.error('Error saving order items:', err); // Log the error
      return res.status(500).send({ success: false, message: 'Error saving order items' });
    }

    res.send({ success: true, message: 'Order items saved successfully' });
  });
};
const insertdatabulkgst = (req, res) => {
  const tableName = req.params.tablename;
  const validTableNames = ['order_items_gst', 'advance_order_items_gst']; // Allow both

  if (!validTableNames.includes(tableName)) {
    return res.status(400).send({ success: false, message: 'Invalid table name' });
  }

  const items = req.body.items;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).send({ success: false, message: 'No items provided' });
  }

  // Build insert fields and values depending on table
  let query, values;

  if (tableName === 'order_items_gst' || tableName === 'advance_order_items_gst' ) {
    values = items.map(item => [
      item.order_id,
      item.table_number,
      item.item_name,
      item.quantity,
      item.uom || '',
      item.rate || 0,
      item.cgst || 0,
      item.sgst || 0,
      item.igst || 0,
      item.tax_amount || 0,
      item.total_price,
      item.status,
    ]);

    query = `INSERT INTO ${tableName} 
      (order_id, table_number, item_name, quantity, uom, rate, cgst, sgst, igst, tax_amount, total_price, status) 
      VALUES ?`;
  } else {
    // Fallback for original order_items table
    values = items.map(item => [
      item.order_number,
      item.table_number,
      item.item_name,
      item.quantity,
      item.total_amount,
      item.status,
    ]);

    query = `INSERT INTO ${tableName} 
      (order_id, table_number, item_name, quantity, total_price, status) 
      VALUES ?`;
  }
console.log(query);
  db.query(query, [values], (err, results) => {
    if (err) {
      console.error('Error saving order items:', err);
      return res.status(500).send({ success: false, message: 'Error saving order items' });
    }

    res.send({ success: true, message: 'Order items saved successfully' });
  });
};



const addNewProduct = (req, res) => {
  const product_id = req.body.product_id;
  //const tbl = req.params.tablename;
  const tbl = [req.params.tablename]
  
  const files = req.files.map(file => [
    product_id,
    file.filename,
    file.path,
    file.mimetype,
    file.size,
    
  ]);
  const query = `INSERT INTO ${tbl} (product_id,filename, path, mimetype, size) VALUES ?`;
  //console.log(query);
  db.query(query, [files], (err, results) => {
    if (err) {
      console.error('Failed to insert images into database:', err);
      return res.status(500).json({ message: 'Failed to upload images', error: err });
    }
    res.status(200).json({ message: 'Images uploaded and saved to database successfully!', images: results });
  });

 
}
//Upload multiple images
const uploadcsv = (req, res) => {
  // Read the CSV file and insert data into MySQL
  const csvFile = req.files.csvFile
  const results = []
  fs.createReadStream(csvFile.tempFilePath)
    .pipe(csv())
    .on('data', row => {
      const sql =
        'INSERT INTO brands (id, brand_name, description) VALUES (?, ?, ?)'
      const values = [row.id, row.brand_name, row.description]

      db.query(sql, values, (err, result) => {
        if (err) throw err
        console.log('Data inserted:', result.affectedRows)
      })
    })
    .on('end', () => {
      console.log('CSV file imported into MySQL')
      // db.end(); // Close the database connection
    })
}

// Function to fetch and increment the alphanumeric code




module.exports = {
  
  insertdata,
  savebill,
  insertdatabulk,
  insertdatabulkgst,
  addNewProduct,
  uploadcsv,
}
