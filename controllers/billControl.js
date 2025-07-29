const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../config/dbconnection1'); // Import updated dbconnection.js
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

// ✅ Function to Save a New Bill

const savebill = async (req, res) => {
  const connection = await db.getConnection(); // Get a connection from the pool

  try {
    await connection.beginTransaction(); // Start transaction

    const { customer_id, tablenumber, subtotal, subtotal_afterdiscount, tax, discount_type, discount_value, round_off, grand_total, payment_mode, status } = req.body;

    // Calculate discount amount
    let discount_amount = discount_type === "percentage" ? (subtotal * discount_value) / 100 : discount_value;
    let net_total = subtotal + tax - discount_amount + round_off;

    // Insert Bill into `final_bill`
    const billQuery = `
        INSERT INTO final_bill (customer_id, inv_date, inv_time, table_number,subtotal, discount_type, discount_value,discount_amount,subtotal_afterdiscount, tax, roundoff, grand_total, payment_mode,status)
        VALUES (?, CURDATE(), CURTIME(), ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)
      `;

    //console.log('Executing Query:', billQuery);

    const [billResult] = await connection.execute(
      billQuery,
      [customer_id, tablenumber, subtotal, discount_type, discount_value, discount_amount, subtotal_afterdiscount, tax, round_off, grand_total, payment_mode, status]
    );

    const bill_id = billResult.insertId; // Get the final bill ID
    if (!bill_id) throw new Error("Bill ID not generated");

    // Use `bill_id` as `transaction_id`
    const transaction_id = bill_id;

    // Default account IDs (adjust as needed)
    const sales_account_id = 1; // Sales Account
    const cash_account_id = 2; // Cash Account
    const receivable_account_id = 3; // Accounts Receivable
    const discount_account_id = 4; // Discount Given
    const roundoff_account_id = 5; // Round Off Account
    const tax_account_id = 6; // Tax Account

    // Create Ledger Entries
    let ledgerEntries = [
      [transaction_id, new Date(), "Sales", sales_account_id, `Bill #${bill_id} - Sale Revenue`, 0.00, grand_total, "NULL"]
    ];

    if (payment_mode === "Cash") {
      ledgerEntries.push([transaction_id, new Date(), "Cash", "NULL", `Bill #${bill_id} - Cash Payment`, grand_total, 0.00, "NULL"]);
    }
    else if (payment_mode === "Bank Transfer") {
      ledgerEntries.push([transaction_id, new Date(), "Bank Transfer", "NULL", `Bill #${bill_id} - Bank Transfer Payment`, grand_total, 0.00, "NULL"]);
    }
    else if (payment_mode === "QR Code") {
      ledgerEntries.push([transaction_id, new Date(), "QR Code", "NULL", `Bill #${bill_id} - QR Payment`, grand_total, 0.00, "NULL"]);
    }
    else if (payment_mode === "UPI") {
      ledgerEntries.push([transaction_id, new Date(), "UPI", "NULL", `Bill #${bill_id} - UPI Payment`, grand_total, 0.00, "NULL"]);
    }
    else if (payment_mode === "Credit") {
      ledgerEntries.push([transaction_id, new Date(), "Account Recievable", customer_id, `Bill #${bill_id} - Credit Sale`, grand_total, 0.00, "NULL"]);
    }

    // if (discount_amount > 0) {
    //   ledgerEntries.push([transaction_id, new Date(), "Discount", customer_id, `Bill #${bill_id} - Discount Given`, discount_amount, 0.00, bill_id]);
    // }
    // Round-Off Adjustment

    // if (round_off !== 0) {
    //   ledgerEntries.push([
    //     transaction_id, // Ensure transaction_id is assigned
    //     new Date(),               // Timestamp
    //     "Round-Off",              // Account Type
    //     customer_id || "NULL", // Assign a default account ID if missing
    //     `Bill #${bill_id} - Round-Off Adjustment`, // Description
    //     round_off > 0 ? round_off : 0.00,         // Debit amount if positive
    //     round_off < 0 ? Math.abs(round_off) : 0.00, // Credit amount if negative
    //     bill_id               // Reference ID linking to invoice
    //   ]);
    // }


    // if (tax > 0) {
    //   ledgerEntries.push([transaction_id, new Date(), "Tax", customer_id, `Bill #${bill_id} - Tax`, tax, 0.00, bill_id]);
    // }

    // Insert into `ledger_entries`
    const ledgerQuery = `
        INSERT INTO ledger_entries (transaction_id, date, account_type, account_id, description, debit_amount, credit_amount, reference_id)
        VALUES ?
      `;

    //console.log('Executing Ledger Query:', ledgerQuery);

    await connection.query(ledgerQuery, [ledgerEntries]);

    await connection.commit(); // Commit transaction
    res.status(201).json({ success: true, message: "Bill & Ledger saved successfully!", bill_id });

  } catch (error) {
    await connection.rollback(); // Rollback on error
    console.error("Error saving bill:", error);
    res.status(500).json({ success: false, message: "Error saving bill", error });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};
const advancesavebill = async (req, res) => {
  const connection = await db.getConnection(); // Get a connection from the pool

  try {
    await connection.beginTransaction(); // Start transaction

    const {
      customer_id,
      table_number,
      subtotal,
      discount_type,
      discount_value,
      discount_amount,
      subtotal_afterdiscount,
      tax,
      roundoff,
      grand_total,
      payment_mode,
      status,
      pickup_date,
      pickup_time,
      special_note,
      order_type,
      bill_generated_by,
      final_billed,
      paid_amount,
    } = req.body;

    // Insert into `final_bill`
    const billQuery = `
      INSERT INTO advance_final_bill (
        customer_id, inv_date, inv_time, table_number,
        subtotal, discount_type, discount_value, discount_amount,
        subtotal_afterdiscount, tax, roundoff, grand_total,
        payment_mode, status, pickup_date, pickup_time,
        special_note, order_type, bill_generated_by,
        final_billed, paid_amount
      )
      VALUES (
        ?, CURDATE(), CURTIME(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `;

    const [billResult] = await connection.execute(
      billQuery,
      [
        customer_id,
        table_number,
        subtotal,
        discount_type,
        discount_value,
        discount_amount,
        subtotal_afterdiscount,
        tax,
        roundoff,
        grand_total,
        payment_mode,
        status,
        pickup_date,
        pickup_time,
        special_note,
        order_type,
        bill_generated_by,
        final_billed,
        paid_amount
      ]
    );

    const bill_id = billResult.insertId;
    if (!bill_id) throw new Error("Bill ID not generated");

    const transaction_id = bill_id;

    // Ledger Accounts
    const sales_account_id = 1;
    const cash_account_id = 2;
    const receivable_account_id = 3;

    let ledgerEntries = [
      [transaction_id, new Date(), "Sales", sales_account_id, `Bill #${bill_id} - Sale Revenue`, 0.00, grand_total, null]
    ];

    if (payment_mode === "Cash") {
      ledgerEntries.push([transaction_id, new Date(), "Cash", null, `Bill #${bill_id} - Cash Payment`, grand_total, 0.00, null]);
    } else if (payment_mode === "Bank Transfer") {
      ledgerEntries.push([transaction_id, new Date(), "Bank Transfer", null, `Bill #${bill_id} - Bank Transfer Payment`, grand_total, 0.00, null]);
    } else if (payment_mode === "QR Code") {
      ledgerEntries.push([transaction_id, new Date(), "QR Code", null, `Bill #${bill_id} - QR Payment`, grand_total, 0.00, null]);
    } else if (payment_mode === "UPI") {
      ledgerEntries.push([transaction_id, new Date(), "UPI", null, `Bill #${bill_id} - UPI Payment`, grand_total, 0.00, null]);
    } else if (payment_mode === "Credit") {
      ledgerEntries.push([transaction_id, new Date(), "Account Receivable", customer_id, `Bill #${bill_id} - Credit Sale`, grand_total, 0.00, null]);
    }

    // Insert ledger entries
    const ledgerQuery = `
      INSERT INTO ledger_entries (
        transaction_id, date, account_type, account_id,
        description, debit_amount, credit_amount, reference_id
      )
      VALUES ?
    `;

    await connection.query(ledgerQuery, [ledgerEntries]);

    await connection.commit();
    res.status(201).json({ success: true, message: "Bill & Ledger saved successfully!", bill_id });

  } catch (error) {
    await connection.rollback();
    console.error("Error saving bill:", error);
    res.status(500).json({ success: false, message: "Error saving bill", error });
  } finally {
    connection.release();
  }
};



// ✅ Function to Retrieve All Bills
const getBills = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM final_bill ORDER BY inv_date DESC");
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching bills:", error);
    res.status(500).json({ success: false, message: "Error fetching bills", error });
  }
};

// ✅ Function to Get a Single Bill by ID
const getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute("SELECT * FROM final_bill WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Bill not found" });
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error fetching bill:", error);
    res.status(500).json({ success: false, message: "Error fetching bill", error });
  }
};

// ✅ Function to Delete a Bill
const deleteBill = async (req, res) => {
  const connection = await db.getConnection(); // Get a connection from the pool
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Delete Ledger Entries First
    await connection.execute("DELETE FROM ledger_entries WHERE reference_id = ?", [id]);

    // Then Delete Bill
    const [result] = await connection.execute("DELETE FROM final_bill WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Bill not found" });
    }

    await connection.commit();
    res.status(200).json({ success: true, message: "Bill deleted successfully" });

  } catch (error) {
    await connection.rollback();
    console.error("Error deleting bill:", error);
    res.status(500).json({ success: false, message: "Error deleting bill", error });
  } finally {
    connection.release();
  }
};

// ✅ Function to Update a Bill
const updateBill = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { subtotal, tax, discount_type, discount_value, roundoff, payment_mode } = req.body;

    let discount_amount = discount_type === "percentage" ? (subtotal * discount_value) / 100 : discount_value;
    let grand_total = subtotal + tax - discount_amount + round_off;

    // Update Bill
    const updateQuery = `
      UPDATE final_bill 
      SET subtotal = ?, tax = ?, discount_type = ?, discount_value = ?, discount_amount = ?, round_off = ?, grand_total = ?, payment_mode = ? 
      WHERE id = ?
    `;
    const [result] = await connection.execute(updateQuery, [
      subtotal, tax, discount_type, discount_value, discount_amount, round_off, grand_total, payment_mode, id
    ]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Bill not found" });
    }

    await connection.commit();
    res.status(200).json({ success: true, message: "Bill updated successfully" });

  } catch (error) {
    await connection.rollback();
    console.error("Error updating bill:", error);
    res.status(500).json({ success: false, message: "Error updating bill", error });
  } finally {
    connection.release();
  }
};

const savePayment = async (req, res) => {

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { customer_id, amount_paid, payment_mode, reference_number } = req.body;
    if (!customer_id || amount_paid === undefined || !payment_mode) {
      return res.status(400).json({ success: false, message: "Invalid payment data." });
    }
    let remaining_amount = amount_paid;
    console.log(customer_id);
    // Fetch unpaid invoices
    const [invoices] = await connection.execute(`
      SELECT id, grand_total, paid_amount FROM final_bill 
      WHERE customer_id = ? AND payment_mode = 'Credit' AND status != 'Paid'
      ORDER BY inv_date ASC;
    `, [customer_id]);

    if (!invoices || invoices.length === 0) {
      return res.status(400).json({ success: false, message: "No outstanding invoices." });
    }

    console.log("Received Payment Data:", req.body);


    let payments = [];

    for (let invoice of invoices) {
      if (remaining_amount <= 0) break;

      let due_amount = invoice.grand_total - invoice.paid_amount;
      let payment_to_apply = Math.min(due_amount, remaining_amount);
      remaining_amount -= payment_to_apply;

      let new_status = (invoice.paid_amount + payment_to_apply) >= invoice.grand_total ? "Paid" : "Partially Paid";

      // ✅ Update `paid_amount` in `final_bill`
      await connection.execute(`
        UPDATE final_bill 
        SET paid_amount = paid_amount + ?, status = ? 
        WHERE id = ?;
      `, [payment_to_apply, new_status, invoice.id]);

      // ✅ Insert Ledger Entries
      payments.push([invoice.id, new Date(), payment_mode, null, "Customer Payment Received", payment_to_apply, 0.00]);
      payments.push([invoice.id, new Date(), "Account Recievable", customer_id, "Credit Paid", 0.00, payment_to_apply]);
      //console.log("Generated Payments Data:", payments);
      // ✅ Insert record into `receipt_vouchers`
      await connection.execute(`
        INSERT INTO receipt_vouchers (customer_id, transaction_id, amount_paid, payment_mode, reference_id, created_at)
        VALUES (?, ?, ?, ?, ?, NOW());
      `, [customer_id, "RECPT_" + invoice.id, payment_to_apply, payment_mode, reference_number]);
    }

    // Insert into `ledger_entries`
    await connection.query(`
      INSERT INTO ledger_entries (reference_id, date, account_type, account_id, description, debit_amount, credit_amount) VALUES ?
    `, [payments]);

    await connection.commit();
    res.status(201).json({ success: true, message: "Payment recorded successfully!" });

  } catch (error) {
    await connection.rollback();
    console.error("Error processing payment:", error);
    res.status(500).json({ success: false, message: "Payment processing failed", error });
  } finally {
    connection.release();
  }
};


const saveSupplierPayment = async (req, res) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { supplier_id, amount_paid, payment_mode, reference_number, remarks } = req.body;
    if (!supplier_id || amount_paid === undefined || !payment_mode) {
      return res.status(400).json({ success: false, message: "Invalid payment data." });
    }

    // Determine account_type based on payment_mode
    // Example logic: if payment_mode is 'Cash', account_type = 'Cash Account'
    // You can adjust this mapping as needed
    let account_type = "";
    switch (payment_mode.toLowerCase()) {
      case "cash":
        account_type = "Cash Account";
        break;
      case "bank":
      case "cheque":
        account_type = "Bank Account";
        break;
      case "card":
        account_type = "Card Account";
        break;
      default:
        account_type = "Other Account";
    }

    const paymentDate = new Date();

    // Insert ledger entries for the payment
    // 1. Debit entry for the payment account (e.g., Cash/Bank)
    // 2. Credit entry for the supplier account (supplier_id)
    const ledgerEntries = [
      [reference_number, paymentDate, account_type, null, "Supplier Payment - Debit", amount_paid, 0.00],
      [reference_number, paymentDate, "Accounts Payable", supplier_id, "Supplier Payment - Credit", 0.00, amount_paid]
    ];
    // const { supplier_id, amount_paid, payment_mode, reference_number,remarks } = req.body;
    await connection.query(`
      INSERT INTO ledger_entries (reference_id, date, account_type, account_id, description, debit_amount, credit_amount) VALUES ?
    `, [ledgerEntries]);

    // Insert into payment_voucher table
    await connection.execute(`
      INSERT INTO payment_vouchers (supplier_id, amount_paid, payment_mode, reference_id,remarks, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [supplier_id, amount_paid, payment_mode, reference_number, remarks]);

    await connection.commit();
    res.status(201).json({ success: true, message: "Supplier payment recorded successfully!" });

  } catch (error) {
    await connection.rollback();
    console.error("Error processing supplier payment:", error);
    res.status(500).json({ success: false, message: "Supplier payment processing failed", error });
  } finally {
    connection.release();
  }
};


const getOutstandingBalance = async (req, res) => {
  try {
    const { ac_type, customer_id } = req.params;
    //console.log("Params received:", req.params);

    const query = `
      SELECT 
        SUM(debit_amount) - SUM(credit_amount) AS outstanding_balance
      FROM ledger_entries
      WHERE account_type = ? 
      AND account_id = ?;
    `;
    //console.log(query);

    const [result] = await db.execute(query, [ac_type, customer_id]);
    const outstanding_balance = result[0]?.outstanding_balance || 0;
    //console.log(outstanding_balance);
    res.status(200).json({ success: true, outstanding_balance });

  } catch (error) {
    console.error("Error fetching outstanding balance:", error);
    res.status(500).json({ success: false, message: "Error fetching balance", error });
  }
};




const getCustomerInvoices = async (req, res) => {
  try {
    const { customer_id } = req.params;

    // Fetch all unpaid invoices for the customer
    const query = `
          SELECT id,  net_total, status
          FROM final_bill
          WHERE customer_id = ? AND status = '1'
          ORDER BY inv_date DESC;
      `;

    const [invoices] = await db.execute(query, [customer_id]);

    res.status(200).json({ success: true, invoices });

  } catch (error) {
    console.error("Error fetching customer invoices:", error);
    res.status(500).json({ success: false, message: "Error fetching invoices", error });
  }
};
module.exports = { savebill, advancesavebill, getBills, getBillById, deleteBill, updateBill, savePayment, getOutstandingBalance, getCustomerInvoices, saveSupplierPayment };
