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
    return res.status(400).json({
      success: false,
      msg: 'Request body is empty. Please provide data to insert.',
      error: 'EMPTY_BODY'
    });
  }

  const table = req.params.tablename;
  const columns = Object.keys(req.body);
  const values = Object.values(req.body);
  const placeholders = columns.map(() => '?').join(', ');
  
  let setty = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  console.log('Generated SQL:', setty);
  console.log('Values:', values);

  db.query(setty, values, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(400).json({
        success: false,
        msg: err.message || err,
        error: 'DATABASE_ERROR',
        sql: setty
      });
    } else {
      // Retrieve the last inserted ID correctly
      const insertedId = result.insertId; // Use result.insertId to get the inserted record's ID
      console.log('Data inserted with ID:', insertedId);
      
      return res.status(200).json({
        success: true,
        msg: 'Data saved successfully',
        id: insertedId,  // Return the newly inserted ID or any relevant data
      });
    }
  });
};
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

const insertdatawithimages = (req, res) => {
  console.log('=== INSERT DATA WITH IMAGES DEBUG ===');
  console.log('Table name:', req.params.tablename);
  console.log('Request body:', req.body);
  console.log('Files:', req.files);

  // Validate request body
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      msg: 'Request body is empty. Please provide data to insert.',
      error: 'EMPTY_BODY'
    });
  }

  const table = req.params.tablename;
  
  // Handle special case for activities with categories
  if (table === 'activities' || table === 'cms_activities') {
    return insertActivityWithCategories(req, res);
  }
  
  // Regular insert for other tables
  const columns = Object.keys(req.body);
  const values = Object.values(req.body);
  const placeholders = columns.map(() => '?').join(', ');
  
  let setty = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  console.log('Generated SQL:', setty);
  console.log('Values:', values);

  // Insert data first
  db.query(setty, values, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(400).json({
        success: false,
        msg: err.message || err,
        error: 'DATABASE_ERROR',
        sql: setty
      });
    }

    const insertedId = result.insertId;
    console.log('Data inserted with ID:', insertedId);

    // Handle image uploads if files are present
    if (req.files && req.files.length > 0) {
      console.log('Processing uploaded files...');
      
      const uploadedFiles = req.files.map(file => ({
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        size: file.size,
        mimetype: file.mimetype
      }));

      console.log('Uploaded files info:', uploadedFiles);

      return res.status(200).json({
        success: true,
        msg: 'Data and images saved successfully',
        id: insertedId,
        uploadedFiles: uploadedFiles
      });
    } else {
      // No files to upload, just return success for data insertion
      return res.status(200).json({
        success: true,
        msg: 'Data saved successfully (no images provided)',
        id: insertedId
      });
    }
  });
};

// Special function to handle activity insertion with categories
const insertActivityWithCategories = (req, res) => {
  console.log('=== INSERT ACTIVITY WITH CATEGORIES ===');
  
  const table = req.params.tablename; // Get the actual table name from params
  const { categories, image_metadata, ...activityData } = req.body;
  let categoryIds = [];
  let imageMetadata = [];
  
  // Parse categories if it's a JSON string
  try {
    if (typeof categories === 'string') {
      categoryIds = JSON.parse(categories);
    } else if (Array.isArray(categories)) {
      categoryIds = categories;
    }
  } catch (error) {
    console.error('Error parsing categories:', error);
    return res.status(400).json({
      success: false,
      msg: 'Invalid categories format',
      error: 'INVALID_CATEGORIES'
    });
  }

  // Parse image metadata if provided
  try {
    if (typeof image_metadata === 'string') {
      imageMetadata = JSON.parse(image_metadata);
    } else if (Array.isArray(image_metadata)) {
      imageMetadata = image_metadata;
    }
  } catch (error) {
    console.error('Error parsing image metadata:', error);
    imageMetadata = [];
  }

  // Process uploaded images and combine with metadata
  let imagesData = [];
  if (req.files && req.files.length > 0) {
    imagesData = req.files.map((file, index) => ({
      filename: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      title: imageMetadata[index]?.title || '',
      alt: imageMetadata[index]?.alt || activityData.name || '',
      size: file.size,
      mimetype: file.mimetype
    }));
  }

  // Add the images JSON to activityData
  if (imagesData.length > 0) {
    activityData.images = JSON.stringify(imagesData); // Convert to JSON string for MySQL
  }

  // Handle other JSON fields that need stringification
  if (activityData.highlight_details && typeof activityData.highlight_details === 'string') {
    // Already a string, leave as is
  } else if (activityData.highlight_details) {
    activityData.highlight_details = JSON.stringify(activityData.highlight_details);
  }

  if (activityData.packages && typeof activityData.packages === 'string') {
    // Already a string, leave as is
  } else if (activityData.packages) {
    activityData.packages = JSON.stringify(activityData.packages);
  }

  // Prepare for parameterized query
  const columns = Object.keys(activityData);
  const values = Object.values(activityData);
  const placeholders = columns.map(() => '?').join(', ');
  
  let activitySql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  console.log('Activity SQL:', activitySql);
  console.log('Columns:', columns);
  console.log('Values:', values);
  console.log('Number of columns:', columns.length);
  console.log('Number of values:', values.length);

  // Insert activity using parameterized query
  db.query(activitySql, values, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(400).json({
        success: false,
        msg: err.message || err,
        error: 'DATABASE_ERROR',
        sql: activitySql
      });
    }

    const activityId = result.insertId;
    console.log('Activity inserted with ID:', activityId);

    // Insert category associations if categories are provided
    if (categoryIds && categoryIds.length > 0) {
      const categoryValues = categoryIds.map(catId => `(${activityId}, ${catId})`).join(', ');
      const categorySql = `INSERT INTO activity_categories (activity_id, category_id) VALUES ${categoryValues}`;
      console.log('Categories SQL:', categorySql);
      
      db.query(categorySql, (catErr, catResult) => {
        if (catErr) {
          console.error('Category insertion error:', catErr);
          // Don't fail the whole operation, just log the error
          console.log('Activity created but categories not associated');
        } else {
          console.log('Categories associated successfully');
        }
        
        handleFileUploads(req, res, activityId);
      });
    } else {
      handleFileUploads(req, res, activityId);
    }
  });
};

// Helper function to handle file uploads
const handleFileUploads = (req, res, activityId) => {
  if (req.files && req.files.length > 0) {
    console.log('Processing uploaded files...');
    
    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      size: file.size,
      mimetype: file.mimetype
    }));

    console.log('Uploaded files info:', uploadedFiles);

    return res.status(200).json({
      success: true,
      msg: 'Activity and images saved successfully',
      id: activityId,
      uploadedFiles: uploadedFiles
    });
  } else {
    return res.status(200).json({
      success: true,
      msg: 'Activity saved successfully (no images provided)',
      id: activityId
    });
  }
};

module.exports = {
  
  insertdata,
  savebill,
  insertdatabulk,
  insertdatabulkgst,
  addNewProduct,
  uploadcsv,
  insertdatawithimages,
}
