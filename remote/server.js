require("dotenv").config();

const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const userRouters = require('./routes/userRoutes');
const cashierRouters = require('./routes/cashierRoutes');
const accountRouters = require('./routes/accountRoutes');


require('./config/dbconnection');

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use('/api', userRouters);
app.use('/api/cashier', cashierRouters);
app.use('/api/accounts', accountRouters);

//error handling
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.mesaage = err.message || "Internal Server Error";
    res.status(err.statusCode).json({
        message: err.message,
    })
});
app.listen(50015, () => console.log(' server connected at port 50015'))