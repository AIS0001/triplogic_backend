const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const db = require('../config/dbconnection')
const jwt = require('jsonwebtoken')
const { jwt_secret } = process.env


const allUsers = (req, res) => {
  const authToken = req.headers.authorization.split(' ')[1]
  const decode = jwt.verify(authToken, jwt_secret)
  db.query(
    `SELECT * FROM user order by id ASC `,
    function (err, result, fields) {
      if (err) throw err
      var value = JSON.parse(JSON.stringify(result))
      return res
        .status(200)
        .send({
          success: true,
          data: result,
          message: 'Fetch Data Sucessfully'
        })
    }
  )
}
const combolistwithWhere = (req, res) => {
  const { where } = req.query;
  const table = [req.params.tablename]
  const id = [req.params.groupby]
  // console.log(`SELECT * 
  //   FROM ${table} 
  //   ${where ? `WHERE ${where}` : ""}
  //   group by ${id}`);
  db.query(
    `SELECT * 
    FROM ${table} 
    ${where ? `WHERE ${where}` : ""}
    group by ${id}`,
    
    function (err, results, fields) {
      if (err) {
        res.status(500).send('Error fetching data from the database');
        return;
      }
      res.json(results);

    }
  )
}
const viewAllData = (req, res) => {
  const authToken = req.headers.authorization.split(' ')[1]
  const decode = jwt.verify(authToken, jwt_secret)
  const table = [req.params.tablename]
  const id = [req.params.orderby]
  // console.log(`SELECT * FROM ${table} order by ${id}  DESC`);
  db.query(
    `SELECT * FROM ${table} order by ${id}  DESC`,
    function (err, result, fields) {
      if (err) {
        console.log('Invalid field ' + err)
        return
      } else {
        var value = JSON.parse(JSON.stringify(result))
        return res
          .status(200)
          .send({ success: true, data: value, message: 'Data Saved !!' })
      }
    }
  )
}
const combolist = (req, res) => {

  const table = [req.params.tablename]
  const id = [req.params.groupby]
 // console.log(`SELECT * FROM ${table} group by ${id} `);
  db.query(
    `SELECT * FROM ${table} group by ${id}  `,
    function (err, results, fields) {
      if (err) {
        res.status(500).send('Error fetching data from the database');
        return;
      }
      res.json(results);

    }
  )
}
const viewAllDataLimit = (req, res) => {
  const authToken = req.headers.authorization.split(' ')[1]
  const decode = jwt.verify(authToken, jwt_secret)
  const table = [req.params.tablename]
  const lmt = [req.params.limit]
  db.query(
    `SELECT * FROM ${table} order by id DESC limit ${lmt}`,
    function (err, result, fields) {
      if (err) {
        console.log('Invalid field' + err)
        return
      } else {
        var value = JSON.parse(JSON.stringify(result))
        return res
          .status(200)
          .send({ success: true, data: value, message: 'Data Saved !!' })
      }
    }
  )
}

const fetchData = (req, res) => {
  const tblname = req.params.tblname;
  const orderby = req.params.orderby;
  const where = req.params[0] ? decodeURIComponent(req.params[0]) : '';

  // Validate inputs
  if (!tblname || !orderby) {
    return res.status(400).json({
      status: 'error',
      message: 'Table name and order by fields are required',
      data: null
    });
  }

  // Create URLSearchParams object
  const params = new URLSearchParams(where);

  // Build WHERE clause with quoted values
  const conditions = [];
  for (const [key, value] of params.entries()) {
    conditions.push(`${key}="${value}"`);
  }
  const whereClause = conditions.length > 0 ? conditions.join(' AND ') : null;

  // Construct the SQL query
  let query;
  const queryParams = [tblname, orderby];

  if (whereClause) {
    query = `SELECT * FROM ?? WHERE ${whereClause} ORDER BY ??`;
  } else {
    query = `SELECT * FROM ?? ORDER BY ??`;
  }

  // Log the query for debugging
  //console.log('Constructed Query:', query);

  const formattedQuery = db.format(query, queryParams);
  //console.log('Formatted Query:', formattedQuery);

  // Execute the query
  db.query(formattedQuery, (error, results) => {
    if (error) {
      console.error('SQL Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred while fetching data',
        data: null
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Data fetched successfully',
      data: results
    });
  });
};

const fetchDatanotequal = (req, res) => {
  const tblname = req.params.tblname;
  const orderby = req.params.orderby;
  const where = req.params[0] ? decodeURIComponent(req.params[0]) : '';

  // Validate inputs
  if (!tblname || !orderby) {
    return res.status(400).json({
      status: 'error',
      message: 'Table name and order by fields are required',
      data: null
    });
  }

  // Create URLSearchParams object
  const params = new URLSearchParams(where);

  // Build WHERE clause with quoted values
  const conditions = [];
  for (const [key, value] of params.entries()) {
    conditions.push(`${key}!="${value}"`);
  }
  const whereClause = conditions.length > 0 ? conditions.join(' AND ') : null;

  // Construct the SQL query
  let query;
  const queryParams = [tblname, orderby];

  if (whereClause) {
    query = `SELECT * FROM ?? WHERE ${whereClause} ORDER BY ??`;
  } else {
    query = `SELECT * FROM ?? ORDER BY ??`;
  }

  // Log the query for debugging
  console.log('Constructed Query:', query);

  const formattedQuery = db.format(query, queryParams);
  //console.log('Formatted Query:', formattedQuery);

  // Execute the query
  db.query(formattedQuery, (error, results) => {
    if (error) {
      console.error('SQL Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred while fetching data',
        data: null
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Data fetched successfully',
      data: results
    });
  });
};
const fetchDataFromTwoTables = (req, res) => {
  const { tbl1, tbl2, col1, col2, orderby } = req.params;
  const { where } = req.query;

  const query = `
      SELECT t1.*, t2.*
      FROM ${tbl1} t1
      INNER JOIN ${tbl2} t2 ON t1.${col1} = t2.${col2}
      ${where ? `WHERE ${where}` : ""}
      ${orderby ? `ORDER BY ${orderby}` : ""}`;
  
  console.log(query);

  db.query(query, (err, results) => {
      if (err) {
          return res.status(500).json({ error: "Database error" });
      }
      res.json({ data: results });
  });
};
const fetchDataFromTwoTables1 = (req, res) => {
  let { tbl1, tbl2, col1, col2, orderby } = req.params;
  const { where } = req.query;

  // Basic sanitization
  if (!allowedTables.includes(tbl1) || !allowedTables.includes(tbl2)) {
    return res.status(400).json({ error: "Invalid table names" });
  }

  if (!allowedColumns.includes(col1) || !allowedColumns.includes(col2)) {
    return res.status(400).json({ error: "Invalid column names" });
  }

  // Optional: sanitize orderby column
  if (orderby && !allowedColumns.includes(orderby)) {
    return res.status(400).json({ error: "Invalid orderby column" });
  }

  let query = `
    SELECT t1.*, t2.name AS supplier_name
    FROM ${tbl1} t1
    INNER JOIN ${tbl2} t2 ON t1.${col1} = t2.${col2}
    ${where ? `WHERE ${where}` : ""}
    ${orderby ? `ORDER BY ${orderby}` : ""}
  `;

  console.log("SQL Query:", query);

  db.query(query, (err, results) => {
    if (err) {
      console.error("Query Error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ data: results });
  });
};


const getMaxOrderNumber = (req,res)=>{
 const col1 = req.params.col1;
 const val1 = req.params.val1;
 const table = req.params.tbl;
 const field1 = req.params.field;
 // Query to get the maximum order number and increment it by 1
const query = `SELECT IFNULL(MAX(${field1}),1) AS maxOrderNumber FROM ${table} WHERE ${col1} = ?`;

db.query(query, [val1], (err, results) => {
  if (err) throw err;

  let newOrderNumber = 1; // Default value if no orders found

  if (results[0].maxOrderNumber !== null) {
    newOrderNumber = results[0].maxOrderNumber + 1;
  }
  res.json({ data: newOrderNumber });

 // console.log(`New order number for user ${col1} is: ${newOrderNumber}`);

});
};

const getRunningTable =(req,res)=>{
  const col1 = req.params.col1;
  const val1 = req.params.val1;
  const table = req.params.tbl;

  const query = `SELECT *
FROM ${table}
WHERE   invoice_number IS NULL;
`;
db.query(query, (err, results) => {
  if (err) throw err;

  res.json({ data: results });

  //console.log(`Running table List: `);

});
}
const getRunningTable1 =(req,res)=>{
  const col1 = req.params.col1;
  const val1 = req.params.val1;
  const table = req.params.tbl;

  const query = `SELECT *
FROM ${table}
WHERE ${col1} = ? AND invoice_number IS NULL;
`;
db.query(query, [val1], (err, results) => {
  if (err) throw err;

  res.json({ data: results });

  console.log(`New order number for user ${col1} is: ${newOrderNumber}`);

});
}
const getOrderDetailsWithSubtotals = (req, res) => {
  const table1 = req.params.table1 || "orders"; // Default table names
  const table2 = req.params.table2 || "order_items"; // Default table names
  const tableNumber = req.query.tableNumber;  // Filter based on table number
  const status = 1; // Filter where status is 1 (active)

  // Build the SQL query dynamically based on the table number and status
  let query = `
    SELECT 
      o.order_number,
      oi.item_name AS item_name,
      oi.quantity AS qty,
      oi.total_price AS rate,
      (oi.quantity * oi.total_price) AS subtotal
    FROM 
      ${table1} o
    JOIN 
      ${table2} oi
    ON 
      o.id = oi.order_id
    WHERE 
      o.status = ?`;

  // Add the table number filter if provided
  if (tableNumber) {
    query += ` AND o.table_number = ?`;
  }

  const queryParams = [status]; // Start with status as a query parameter
  if (tableNumber) {
    queryParams.push(tableNumber); // Add table number to parameters if it's provided
  }
  const formattedQuery = db.format(query, queryParams);
  //console.log('Formatted Query:', formattedQuery);
  // Execute the query with dynamic parameters
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error fetching order details:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    res.json({ data: results });

    //console.log("Order Details with Subtotals:", results);
  });
};
const getInventoryClosingStock = (req, res) => {
  const { item_id } = req.params;
  const query = `SELECT closing_stock FROM inventory WHERE item_id = ? ORDER BY id DESC LIMIT 1`;
  //console.log("Running SQL:", query.replace("?", `'${item_id}'`));

  db.query(query, [item_id], (err, rows) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ error: "Failed to fetch closing stock" });
    }

    //console.log("Query result:", rows);
    res.json(rows[0] || { closing_stock: 0 });
  });
};


// viewcontroller.js
const getInventoryWithItems = (req, res) => {
  const query = `
    SELECT 
      inventory.*, 
      items.iname AS item_name
    FROM 
      inventory 
    JOIN 
      items ON inventory.item_id = items.id
    ORDER BY inventory.id DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("JOIN query error:", err);
      return res.status(500).json({ error: "Failed to fetch joined inventory data" });
    }
    res.json(results); // ✅ Directly return results from callback
  });
};

const getinvoiceitems = (req, res) => {
  const { refno } = req.params;
  const query = `SELECT * FROM inventory WHERE refno = ?`;

  db.query(query, [refno], (err, rows) => {
    if (err) {
      console.error('Get invoice items error:', err);
      return res.status(500).json({ error: 'Error fetching items' });
    }

    res.json(rows);
  });
};


const checkledgerentry = (req, res) => {
  const { refno } = req.params;
  const query = 'SELECT * FROM ledger_entries WHERE transaction_id = ?';

  db.query(query, [refno], (err, rows) => {
    if (err) {
      console.error('Ledger check error:', err);
      return res.status(500).json({ error: 'Ledger lookup failed' });
    }

    res.json({
      exists: rows.length > 0,
      data: rows
    });
  });
};
const checklLineDiscount = (req, res) => {
 const { phone } = req.body;
  const user =  db.query("SELECT * FROM line_discount_customers WHERE phone = ?", [phone]);

  if (user.length > 0) {
    return res.json({ eligible: false });
  }

  return res.json({ eligible: true });
};

const getOrderItemsGstJoined = (req, res) => {
  const query = `
  SELECT 
  o.*, 
  i.iname, 
  i.catid, 
  i.subcatid,
  c.name AS category_name, 
  s.subcat AS subcategory_name
FROM 
  order_items_gst o
JOIN 
  items i ON TRIM(LOWER(o.item_name)) = TRIM(LOWER(i.iname))
LEFT JOIN 
  categories c ON i.catid = c.id
LEFT JOIN 
  subcategory s ON i.subcatid = s.id
ORDER BY 
  o.id DESC;

  `;
console.log(query);
  db.query(query, (err, results) => {
    if (err) {
      console.error("JOIN query error:", err);
      return res.status(500).json({ error: "Failed to fetch joined order items GST data" });
    }
    res.json(results);
  });
};


// Generic fetchData function for table, orderby, and where (object or string)
const newfetchData = (req, res, tableArg, orderbyArg, whereArg) => {
  let table = tableArg || req.params.tblname || req.body.tablename || req.query.tablename || 'users';
  let orderby = orderbyArg || req.params.orderby || req.body.orderby || req.query.orderby || '';
  let where = whereArg || req.body.where || req.query.where || null;
  
  // If no where provided from arguments, check URL parameters
  if (!where && req.params.where) {
    where = decodeURIComponent(req.params.where);
  }
  // Fallback to wildcard parameter if using /* route
  if (!where && req.params[0]) {
    where = decodeURIComponent(req.params[0]);
  }

  // Debug: log incoming parameters
  console.log('[newfetchData] table:', table);
  console.log('[newfetchData] orderby:', orderby);
  console.log('[newfetchData] where:', where);
  console.log('[newfetchData] req.params:', req.params);

  // Build WHERE clause and values
  let whereClause = '';
  let whereValues = [];
  if (where && typeof where === 'object' && Object.keys(where).length > 0) {
    const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    whereClause = `WHERE ${conditions}`;
    whereValues = Object.values(where);
  } else if (where && typeof where === 'string') {
    // Handle URL-encoded where clauses like fetchData does
    const params = new URLSearchParams(where);
    const conditions = [];
    for (const [key, value] of params.entries()) {
      conditions.push(`${key}="${value}"`);
    }
    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }
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
  getMaxOrderNumber,
  allUsers,
  combolist,
  viewAllData,
  viewAllDataLimit,
  fetchData,
  combolistwithWhere,
  fetchDataFromTwoTables,
  getRunningTable,
  getOrderDetailsWithSubtotals,
  getInventoryClosingStock,
  getInventoryWithItems,
  checkledgerentry,
  getinvoiceitems,
  checklLineDiscount,
  getOrderItemsGstJoined,
  fetchDatanotequal,
  newfetchData,

}