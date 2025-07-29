const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const db = require('../config/dbconnection')
const jwt = require('jsonwebtoken')
const { jwt_secret } = process.env

const getSales = (req, res) => {
  const authToken = req.headers.authorization.split(" ")[1];
  const query = `
    SELECT DATE(inv_date) as date, SUM(grand_total) as amount
    FROM final_bill
    GROUP BY DATE(inv_date)
    ORDER BY date
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching sales data:", err);
      return res.status(500).json({ error: "Failed to fetch sales data" });
    }
    res.json(results);
  });
};


const getPurchase  = (req, res) => {
   const query = `
    SELECT DATE(created_at) as date, SUM(netAmount) as amount
    FROM inventory
    GROUP BY DATE(created_at)
    ORDER BY date
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching purchase data:", err);
      return res.status(500).json({ error: "Failed to fetch purchase data" });
    }
    res.json(results);
  });
};
const getSummary = (req, res) => {
  const salesQuery = `SELECT SUM(grand_total) AS totalSales FROM final_bill`;
  const purchaseQuery = `SELECT SUM(netAmount) AS totalPurchase FROM inventory`;
  const topProductQuery = `
    SELECT item_name, SUM(quantity) AS totalSold
    FROM order_items
    GROUP BY item_name
    ORDER BY totalSold DESC
    LIMIT 1
  `;

  db.query(salesQuery, (err, salesResult) => {
    if (err) {
      console.error("Error fetching sales summary:", err);
      return res.status(500).json({ error: "Failed to fetch summary" });
    }

    db.query(purchaseQuery, (err, purchaseResult) => {
      if (err) {
        console.error("Error fetching purchase summary:", err);
        return res.status(500).json({ error: "Failed to fetch summary" });
      }

      db.query(topProductQuery, (err, topProductResult) => {
        if (err) {
          console.error("Error fetching top product:", err);
          return res.status(500).json({ error: "Failed to fetch summary" });
        }

        res.json({
          totalSales: salesResult[0].totalSales || 0,
          totalPurchase: purchaseResult[0].totalPurchase || 0,
          topProduct: topProductResult[0].item_name || null
        });
      });
    });
  });
};

const getTopProducts = (req, res) => {
  const topProductsQuery = `
    SELECT item_name, SUM(quantity) AS totalSold
    FROM order_items
    GROUP BY item_name
    ORDER BY totalSold DESC
    LIMIT 10
  `;

  db.query(topProductsQuery, (err, results) => {
    if (err) {
      console.error("Error fetching top products:", err);
      return res.status(500).json({ error: "Failed to fetch top products" });
    }

    res.json(results);
  });
};

const todaysalepurchase = (req, res) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayFormatted = today.toISOString().split('T')[0];
  const yesterdayFormatted = yesterday.toISOString().split('T')[0];

  const todaySalesQuery = `
    SELECT SUM(grand_total) AS todaySales 
    FROM final_bill 
    WHERE DATE(inv_date) = ?`;

  const yesterdaySalesQuery = `
    SELECT SUM(grand_total) AS yesterdaySales 
    FROM final_bill 
    WHERE DATE(inv_date) = ?`;

  const todayPurchaseQuery = `
    SELECT SUM(netAmount) AS todayPurchases 
    FROM inventory 
    WHERE DATE(pdate) = ?`;

  const yesterdayPurchaseQuery = `
    SELECT SUM(netAmount) AS yesterdayPurchases 
    FROM inventory 
    WHERE DATE(pdate) = ?`;

  const todayTransactionCountQuery = `
    SELECT COUNT(*) AS transactionCount 
    FROM final_bill 
    WHERE DATE(inv_date) = ?`;

  const queryPromise = (query, dateLabel) => {
    return new Promise((resolve, reject) => {
      db.query(query.sql, query.params, (err, result) => {
        if (err) {
          console.error(`Query failed for ${dateLabel}:`, err);
          reject(err);
        } else if (!Array.isArray(result) || result.length === 0) {
          console.warn(`Empty or invalid result for ${dateLabel}:`, result);
          resolve(0);
        } else {
          const key = Object.keys(result[0])[0];
          resolve(parseFloat(result[0][key]) || 0);
        }
      });
    });
  };

  Promise.all([
    queryPromise({ sql: todaySalesQuery, params: [todayFormatted] }, 'todaySales'),
    queryPromise({ sql: yesterdaySalesQuery, params: [yesterdayFormatted] }, 'yesterdaySales'),
    queryPromise({ sql: todayPurchaseQuery, params: [todayFormatted] }, 'todayPurchases'),
    queryPromise({ sql: yesterdayPurchaseQuery, params: [yesterdayFormatted] }, 'yesterdayPurchases'),
    queryPromise({ sql: todayTransactionCountQuery, params: [todayFormatted] }, 'transactionCount'),
  ])
    .then(([todaySales, yesterdaySales, todayPurchases, yesterdayPurchases, transactionCount]) => {
      const profitMargin =
        todaySales > 0
          ? ((todaySales - todayPurchases) / todaySales) * 100
          : 0;

      res.json({
        todaySales,
        yesterdaySales,
        todayPurchases,
        yesterdayPurchases,
        profitMargin: profitMargin.toFixed(2),
        todayTransactionCount: transactionCount
      });
    })
    .catch(err => {
      console.error("Error fetching summary:", err);
      res.status(500).json({ error: "Failed to fetch summary" });
    });
};

const getLowStockAlerts = (req, res) => {
  const query = `
    SELECT 
      i.id, 
      i.iname, 
      i.min_stock, 
      inv.closing_stock
    FROM items i
    JOIN (
      SELECT item_id, MAX(id) as latest_id
      FROM inventory
      GROUP BY item_id
    ) latest ON latest.item_id = i.id
    JOIN inventory inv ON inv.id = latest.latest_id
    WHERE inv.closing_stock <= i.min_stock
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching low stock alerts:", err);
      return res.status(500).json({ error: "Failed to fetch low stock alerts" });
    }
    res.json(results);
  });
};


module.exports = {
    getSales,
    getPurchase,
    getSummary,
    todaysalepurchase,
    getLowStockAlerts,
    getTopProducts,


}