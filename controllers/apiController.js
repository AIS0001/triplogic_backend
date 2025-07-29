const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const db = require('../config/dbconnection')
const jwt = require('jsonwebtoken')
const { jwt_secret } = process.env




// Generic fetchData function for table, orderby, and where (object or string)
const newfetchData = (req, res, tableArg, orderbyArg, whereArg) => {
  let table = tableArg || req.params.tblname || req.body.tablename || req.query.tablename || 'users';
  let orderby = orderbyArg || req.params.orderby || req.body.orderby || req.query.orderby || '';
  let where = whereArg || req.body.where || req.query.where || null;

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
module.exports = {
  
  newfetchData,

}