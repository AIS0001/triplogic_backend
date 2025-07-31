const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const db = require('../config/dbconnection')
const jwt = require('jsonwebtoken')
const { jwt_secret } = process.env




// Generic fetchData function for table, orderby, and where (object or string)
const newfetchData = (req, res, tableArg, orderbyArg, whereArg) => {
  let table = tableArg || req.params.tblname || req.body.tablename || req.query.tablename || 'users';
  let orderby = orderbyArg || req.params.orderby || req.body.orderby || req.query.orderby || '';
  let where = whereArg || req.params.where || req.query.where || null;

  // Debug: log incoming parameters
  console.log('[newfetchData] table:', table);
  console.log('[newfetchData] orderby:', orderby);
  console.log('[newfetchData] where:', where);

  // Build WHERE clause and values
  let whereClause = '';
  let whereValues = [];
  if (where && typeof where === 'object' && Object.keys(where).length > 0) {
    const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    whereClause = `WHERE ${conditions}`;
    whereValues = Object.values(where);
  } else if (where && typeof where === 'string') {
    whereClause = `WHERE ${where}`;
  }

  // Build SQL
  let sql = `SELECT * FROM ??`;
  let params = [table];
  if (whereClause) {
    sql += ` ${whereClause}`;
    if (whereValues.length > 0) params = params.concat(whereValues);
  }
  if (orderby && orderby.trim() !== '') {
    sql += ` ORDER BY ${orderby}`;
  }

  const formattedQuery = db.format(sql, params);
  // Debug: log the final SQL query
  console.log('[newfetchData] SQL:', formattedQuery);
  db.query(formattedQuery, (err, results) => {
    if (err) {
      console.error('SQL Error:', err);
      return res.status(500).json({ status: 'error', message: 'An error occurred while fetching data', data: null });
    }
    res.status(200).json({ status: 'success', message: 'Data fetched successfully', data: results });
  });
};

// Generic updateData function matching frontend pattern: /updatedata/:tablename/:col1/:val1/
const updateData = (req, res) => {
  const tablename = req.params.tablename;
  const col1 = req.params.col1;
  const val1 = req.params.val1;
  const { updatedFields } = req.body;

  // Debug: log incoming parameters
  console.log('[updateData] tablename:', tablename);
  console.log('[updateData] col1:', col1);
  console.log('[updateData] val1:', val1);
  console.log('[updateData] updatedFields:', updatedFields);

  // Validate inputs
  if (!tablename || !col1 || !val1 || !updatedFields || Object.keys(updatedFields).length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Table name, column, value, and updated fields are required',
      data: null
    });
  }

  // Build SET clause
  const setClause = Object.keys(updatedFields).map(key => `${key} = ?`).join(', ');
  const setValues = Object.values(updatedFields);

  // Build SQL query
  const sql = `UPDATE ?? SET ${setClause} WHERE ?? = ?`;
  const params = [tablename, ...setValues, col1, val1];

  const formattedQuery = db.format(sql, params);
  console.log('[updateData] SQL:', formattedQuery);

  db.query(formattedQuery, (err, results) => {
    if (err) {
      console.error('SQL Error:', err);
      return res.status(500).json({ 
        status: 'error', 
        message: 'An error occurred while updating data', 
        data: null 
      });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'No records found to update', 
        data: null 
      });
    }

    res.status(200).json({ 
      status: 'success', 
      message: 'Data updated successfully', 
      data: { affectedRows: results.affectedRows } 
    });
  });
};

// Generic deleteData function matching frontend pattern: /deletebyid/:tablename/:colname/:colval
const deleteData = (req, res) => {
  const tablename = req.params.tablename;
  const colname = req.params.colname;
  const colval = req.params.colval;

  // Debug: log incoming parameters
  console.log('[deleteData] tablename:', tablename);
  console.log('[deleteData] colname:', colname);
  console.log('[deleteData] colval:', colval);

  // Validate inputs
  if (!tablename || !colname || !colval) {
    return res.status(400).json({
      status: 'error',
      message: 'Table name, column name, and column value are required',
      data: null
    });
  }

  // Build SQL query
  const sql = `DELETE FROM ?? WHERE ?? = ?`;
  const params = [tablename, colname, colval];

  const formattedQuery = db.format(sql, params);
  console.log('[deleteData] SQL:', formattedQuery);

  db.query(formattedQuery, (err, results) => {
    if (err) {
      console.error('SQL Error:', err);
      return res.status(500).json({ 
        status: 'error', 
        message: 'An error occurred while deleting data', 
        data: null 
      });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'No records found to delete', 
        data: null 
      });
    }

    res.status(200).json({ 
      status: 'success', 
      message: 'Data deleted successfully', 
      data: { affectedRows: results.affectedRows } 
    });
  });
};
module.exports = {
  newfetchData,
  updateData,
  deleteData,
}