const express = require("express");
const router = express.Router();
const {signupvalidation,loginValidation}  = require('../helpers/validation');
const usercontroller = require('../controllers/userControl');
const auth = require('../middleware/auth');
const  insertcontroller = require("../controllers/insertcontrol");
const  viewcontroller = require("../controllers/viewcontrol");

//View Reports-Collection
// router.get('/pendingbill/:balance',auth.isAuthorize,viewcontroller.pendingbill); //View Pending Bill
// router.get('/pendingbillsummary/:balance',auth.isAuthorize,viewcontroller.pendingbillsummary); //View Pending Bill Summary
// router.get('/paidbillbyuserid/:uid',auth.isAuthorize,viewcontroller.paidbillbyuserid); //View Paid Bill

module.exports=router