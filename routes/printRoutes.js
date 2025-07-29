const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');

const  printcontroller = require("../controllers/printController");


router.post('/printkot',printcontroller.printkot );

module.exports=router