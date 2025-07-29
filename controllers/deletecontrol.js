const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const db = require('../config/dbconnection')
const jwt = require('jsonwebtoken')
const { jwt_secret } = process.env

const deletedatabyid = async (req, res) => {
  const authToken = req.headers.authorization.split(' ')[1]
  const decode = jwt.verify(authToken, jwt_secret)
  const colval1 = [req.params.colval]
  const colname1 = [req.params.colname]
  const table = [req.params.tablename]
try {
  await db.query(`DELETE FROM ${table} WHERE ${colname1}=?`,colval1);
  return res.status(200).json({ message: `Record with ID ${colval1} deleted from ${table}` });
}
catch(err)
{
 console.error('Error deleting record:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
 

}
 
}

module.exports = {
  deletedatabyid
}
