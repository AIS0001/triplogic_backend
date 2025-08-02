const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const insertcontroller = require("../controllers/insertcontrol");
const viewcontroller = require("../controllers/viewcontrol");
const updatecontroller = require("../controllers/updatecontrol");
const deletecontroller = require("../controllers/deletecontrol");
const apicontroller = require("../controllers/apiController");
const path = require('path');
const multer = require('multer');


//const { jwt_secret } = process.env;
// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    // Create uploads directory if it doesn't exist
    if (!require('fs').existsSync(uploadPath)) {
      require('fs').mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
    console.log('Generated filename:', uniqueName);
    cb(null, uniqueName);
  },
});

// Add file filter and limits
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files
  },
  fileFilter: function (req, file, cb) {
    console.log('File upload attempt:', file.originalname, file.mimetype);
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Add multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    return res.status(400).json({
      success: false,
      msg: 'File upload error: ' + err.message,
      error: 'MULTER_ERROR'
    });
  } else if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({
      success: false,
      msg: err.message,
      error: 'UPLOAD_ERROR'
    });
  }
  next();
};
// Generic data operations matching frontend API patterns

// Test route for debugging
router.post('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    body: req.body,
    headers: req.headers
  });
});

// Generic insert route - matches insertData function
router.post('/insertdata/:tablename', auth.isAuthorize, insertcontroller.insertdata);
router.post('/insertdatawithimages/:tablename', upload.array('images', 10), handleMulterError, auth.isAuthorize, insertcontroller.insertdatawithimages);

// Activities specific routes for debugging
router.get('/activities', auth.isAuthorize, async (req, res) => {
  try {
    const { category, location } = req.query;
    let whereClause = '';
    
    if (category && location) {
      whereClause = `category = '${category}' AND location = '${location}'`;
    } else if (category) {
      whereClause = `category = '${category}'`;
    } else if (location) {
      whereClause = `location = '${location}'`;
    }
    
    req.params.tablename = 'activities';
    req.params.orderby = 'created_at DESC';
    if (whereClause) {
      req.params['0'] = whereClause;
    }
    
    viewcontroller.fetchData(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/activities', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'activities';
  insertcontroller.insertdata(req, res);
});

router.post('/activities/with-images', upload.array('images', 10), handleMulterError, auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'activities';
  insertcontroller.insertdatawithimages(req, res);
});


// Generic fetch routes - matches fetchData function
// Most specific routes first - order matters for Express routing
router.get('/fetchdata/:tblname/:orderby/*', auth.isAuthorize, viewcontroller.fetchData);
router.get('/fetchdatanotequal/:tblname/:orderby/*', auth.isAuthorize, viewcontroller.fetchDatanotequal);
router.get('/newfetchdata/:tblname/:orderby/:where', auth.isAuthorize, viewcontroller.newfetchData);
router.get('/newfetchdata/:tblname/:orderby', auth.isAuthorize, viewcontroller.newfetchData);
router.get('/newfetchdata/:tblname', auth.isAuthorize, viewcontroller.newfetchData);

// Generic update route - matches updateData function
router.put('/updatedata/:tablename/:col1/:val1', auth.isAuthorize, apicontroller.updateData);

// Generic delete route - matches deleteData function
router.delete('/deletebyid/:tablename/:colname/:colval', auth.isAuthorize, apicontroller.deleteData);

// Users API routes
router.get('/users', auth.isAuthorize, async (req, res) => {
  try {
    const { user_type } = req.query;
    let whereClause = '';
    if (user_type) {
      whereClause = `user_type = '${user_type}'`;
    }
    
    const tablename = 'users';
    const orderby = 'created_at DESC';
    req.params.tablename = tablename;
    req.params.orderby = orderby;
    if (whereClause) {
      req.params['0'] = whereClause;
    }
    
    viewcontroller.fetchData(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/users', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'users';
  insertcontroller.insertdata(req, res);
});

router.put('/users/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'users';
  req.body = { 
    updatedFields: req.body, 
    where: { id: req.params.id } 
  };
  updatecontroller.updatedata(req, res);
});

router.delete('/users/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'users';
  req.params.colname = 'id';
  req.params.colval = req.params.id;
  deletecontroller.deletedatabyid(req, res);
});

router.get('/users/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'users';
  req.params.orderby = 'id';
  req.params['0'] = `id = ${req.params.id}`;
  viewcontroller.fetchData(req, res);
});

// Itineraries API routes
router.get('/itineraries', auth.isAuthorize, async (req, res) => {
  try {
    const { user_id } = req.query;
    let whereClause = '';
    if (user_id) {
      whereClause = `user_id = '${user_id}'`;
    }
    
    req.params.tablename = 'itineraries';
    req.params.orderby = 'created_at DESC';
    if (whereClause) {
      req.params['0'] = whereClause;
    }
    
    viewcontroller.fetchData(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/itineraries', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'itineraries';
  insertcontroller.insertdata(req, res);
});

router.put('/itineraries/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'itineraries';
  req.body = { 
    updatedFields: req.body, 
    where: { id: req.params.id } 
  };
  updatecontroller.updatedata(req, res);
});

router.delete('/itineraries/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'itineraries';
  req.params.colname = 'id';
  req.params.colval = req.params.id;
  deletecontroller.deletedatabyid(req, res);
});

router.get('/itineraries/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'itineraries';
  req.params.orderby = 'id';
  req.params['0'] = `id = ${req.params.id}`;
  viewcontroller.fetchData(req, res);
});

router.get('/itineraries/status/:status', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'itineraries';
  req.params.orderby = 'created_at DESC';
  req.params['0'] = `status = '${req.params.status}'`;
  viewcontroller.fetchData(req, res);
});

// Itinerary Days API routes
router.get('/itinerary-days/itinerary/:itineraryId', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'itinerary_days';
  req.params.orderby = 'day_number ASC';
  req.params['0'] = `itinerary_id = ${req.params.itineraryId}`;
  viewcontroller.fetchData(req, res);
});

router.post('/itinerary-days', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'itinerary_days';
  insertcontroller.insertdata(req, res);
});

router.put('/itinerary-days/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'itinerary_days';
  req.body = { 
    updatedFields: req.body, 
    where: { id: req.params.id } 
  };
  updatecontroller.updatedata(req, res);
});

router.delete('/itinerary-days/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'itinerary_days';
  req.params.colname = 'id';
  req.params.colval = req.params.id;
  deletecontroller.deletedatabyid(req, res);
});

// Itinerary Activities API routes
router.get('/itinerary-activities/day/:dayId', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'itinerary_activities';
  req.params.orderby = 'time ASC';
  req.params['0'] = `itinerary_day_id = ${req.params.dayId}`;
  viewcontroller.fetchData(req, res);
});

router.post('/itinerary-activities', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'itinerary_activities';
  insertcontroller.insertdata(req, res);
});

router.put('/itinerary-activities/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'itinerary_activities';
  req.body = { 
    updatedFields: req.body, 
    where: { id: req.params.id } 
  };
  updatecontroller.updatedata(req, res);
});

router.delete('/itinerary-activities/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'itinerary_activities';
  req.params.colname = 'id';
  req.params.colval = req.params.id;
  deletecontroller.deletedatabyid(req, res);
});

// Packages API routes
router.get('/packages', auth.isAuthorize, async (req, res) => {
  try {
    const { user_id } = req.query;
    let whereClause = '';
    if (user_id) {
      whereClause = `user_id = '${user_id}'`;
    }
    
    req.params.tablename = 'packages';
    req.params.orderby = 'created_at DESC';
    if (whereClause) {
      req.params['0'] = whereClause;
    }
    
    viewcontroller.fetchData(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/packages', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'packages';
  insertcontroller.insertdata(req, res);
});

router.put('/packages/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'packages';
  req.body = { 
    updatedFields: req.body, 
    where: { id: req.params.id } 
  };
  updatecontroller.updatedata(req, res);
});

router.delete('/packages/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'packages';
  req.params.colname = 'id';
  req.params.colval = req.params.id;
  deletecontroller.deletedatabyid(req, res);
});

router.get('/packages/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'packages';
  req.params.orderby = 'id';
  req.params['0'] = `id = ${req.params.id}`;
  viewcontroller.fetchData(req, res);
});

router.get('/packages/active', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'packages';
  req.params.orderby = 'created_at DESC';
  req.params['0'] = `status = 'active'`;
  viewcontroller.fetchData(req, res);
});

// Inquiries API routes
router.get('/inquiries', auth.isAuthorize, async (req, res) => {
  try {
    const { assigned_to } = req.query;
    let whereClause = '';
    if (assigned_to) {
      whereClause = `assigned_to = '${assigned_to}'`;
    }
    
    req.params.tablename = 'inquiries';
    req.params.orderby = 'created_at DESC';
    if (whereClause) {
      req.params['0'] = whereClause;
    }
    
    viewcontroller.fetchData(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/inquiries', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'inquiries';
  insertcontroller.insertdata(req, res);
});

router.put('/inquiries/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'inquiries';
  req.body = { 
    updatedFields: req.body, 
    where: { id: req.params.id } 
  };
  updatecontroller.updatedata(req, res);
});

router.delete('/inquiries/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'inquiries';
  req.params.colname = 'id';
  req.params.colval = req.params.id;
  deletecontroller.deletedatabyid(req, res);
});

router.get('/inquiries/status/:status', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'inquiries';
  req.params.orderby = 'created_at DESC';
  req.params['0'] = `status = '${req.params.status}'`;
  viewcontroller.fetchData(req, res);
});

// Bookings API routes
router.get('/bookings', auth.isAuthorize, async (req, res) => {
  try {
    const { user_id } = req.query;
    let whereClause = '';
    if (user_id) {
      whereClause = `user_id = '${user_id}'`;
    }
    
    req.params.tablename = 'bookings';
    req.params.orderby = 'created_at DESC';
    if (whereClause) {
      req.params['0'] = whereClause;
    }
    
    viewcontroller.fetchData(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/bookings', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'bookings';
  insertcontroller.insertdata(req, res);
});

router.put('/bookings/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'bookings';
  req.body = { 
    updatedFields: req.body, 
    where: { id: req.params.id } 
  };
  updatecontroller.updatedata(req, res);
});

router.delete('/bookings/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'bookings';
  req.params.colname = 'id';
  req.params.colval = req.params.id;
  deletecontroller.deletedatabyid(req, res);
});

router.get('/bookings/status/:status', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'bookings';
  req.params.orderby = 'created_at DESC';
  req.params['0'] = `status = '${req.params.status}'`;
  viewcontroller.fetchData(req, res);
});

// Payments API routes
router.get('/payments/booking/:bookingId', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'payments';
  req.params.orderby = 'date DESC';
  req.params['0'] = `booking_id = ${req.params.bookingId}`;
  viewcontroller.fetchData(req, res);
});

router.post('/payments', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'payments';
  insertcontroller.insertdata(req, res);
});

router.put('/payments/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'payments';
  req.body = { 
    updatedFields: req.body, 
    where: { id: req.params.id } 
  };
  updatecontroller.updatedata(req, res);
});

router.delete('/payments/:id', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'payments';
  req.params.colname = 'id';
  req.params.colval = req.params.id;
  deletecontroller.deletedatabyid(req, res);
});

// Agent Wallets API routes
router.get('/agent-wallets/user/:userId', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'agent_wallets';
  req.params.orderby = 'created_at DESC';
  req.params['0'] = `user_id = ${req.params.userId}`;
  viewcontroller.fetchData(req, res);
});

router.post('/agent-wallets', auth.isAuthorize, async (req, res) => {
  req.params.tablename = 'agent_wallets';
  insertcontroller.insertdata(req, res);
});

// Get agent wallet balance
router.get('/agent-wallets/balance/:userId', auth.isAuthorize, async (req, res) => {
  try {
    req.params.tablename = 'agent_wallets';
    req.params.orderby = 'created_at DESC';
    req.params['0'] = `user_id = ${req.params.userId}`;
    
    // We'll use the existing viewcontroller but process the response
    const originalSend = res.send;
    res.send = function(data) {
      try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        if (parsedData.success && parsedData.data && parsedData.data.length > 0) {
          const balance = parsedData.data[0].balance_after || 0;
          return originalSend.call(this, JSON.stringify({ 
            success: true, 
            balance: balance 
          }));
        } else {
          return originalSend.call(this, JSON.stringify({ 
            success: true, 
            balance: 0 
          }));
        }
      } catch (error) {
        return originalSend.call(this, JSON.stringify({ 
          success: false, 
          message: 'Error processing balance', 
          balance: 0 
        }));
      }
    };
    
    viewcontroller.fetchData(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, balance: 0 });
  }
});

module.exports = router;
