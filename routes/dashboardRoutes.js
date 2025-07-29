const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const  dashcontroller = require("../controllers/dashboardcontrol");



router.get("/report/purchase", auth.isAuthorize, dashcontroller.getPurchase);
router.get("/report/sale", auth.isAuthorize, dashcontroller.getSales);
router.get("/report/summary", auth.isAuthorize, dashcontroller.getSummary);
router.get("/report/todaysummary", auth.isAuthorize, dashcontroller.todaysalepurchase);
router.get("/report/getlowstockalert", auth.isAuthorize, dashcontroller.getLowStockAlerts);
router.get("/report/gettopproducts", auth.isAuthorize, dashcontroller.getTopProducts);


module.exports=router