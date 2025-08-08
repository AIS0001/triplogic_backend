const express = require("express");
const router = express.Router();
const publicController = require('../controllers/publicController');
const multer = require('multer');

// Configure Multer storage for review images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '-');
    cb(null, `review-${timestamp}-${originalName}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Maximum 5 files per review
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    return res.status(400).json({
      status: 'error',
      message: err.message,
      error: 'MULTER_ERROR'
    });
  } else if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({
      status: 'error',
      message: err.message,
      error: 'UPLOAD_ERROR'
    });
  }
  next();
};

// Middleware for logging public API access
router.use((req, res, next) => {
  console.log('>>> Public API accessed:', req.method, req.originalUrl, 'IP:', req.ip);
  
  // Enable CORS for public API
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, multipart/form-data');
  
  next();
});

// Handle preflight requests
router.options('*', (req, res) => {
  res.status(200).end();
});

// Public API routes - no authentication required

// Get all data from a table with optional filters
// Usage: /public/data/activities
// Usage: /public/data/activities/name (with ordering)
// Usage: /public/data/activities/name/status=active (with WHERE clause)
router.get('/data/:tablename/:orderby?/:where?', publicController.publicFetchData);

// Get single item by ID
// Usage: /public/item/activities/123
router.get('/item/:tablename/:id', publicController.publicFetchById);

// Search functionality
// Usage: /public/search/activities?q=beach&field=name&orderby=created_at
router.get('/search/:tablename', publicController.publicSearch);

// Get featured/highlighted content
// Usage: /public/featured/activities?limit=5
router.get('/featured/:tablename', publicController.publicFeatured);

// Count records from a table with optional WHERE clause
// Usage: /public/count/activities (count all records)
// Usage: /public/count/activities/status=active (count with WHERE clause)
// Usage: /public/count/activities/status=active&category=adventure (multiple conditions)
// Usage: /public/count/activities/price>100 (with comparison operators)
// Usage: /public/count/activities/status=IN(active,featured) (with IN clause)
router.get('/count/:tablename/:where?', publicController.publicCountRecords);

// Post review with multiple images (no authentication required)
// Usage: POST /public/reviews/submit
// Form data: user_name, email, rating, review_text, entity_type, entity_id, images[]
router.post('/reviews/submit', upload.array('images', 5), handleMulterError, publicController.postReviewWithImages);

// Public User Registration APIs (no authentication required)

// User Registration with optional profile picture
// Usage: POST /public/auth/register
// Form data: email, password, first_name, last_name, phone (optional), date_of_birth (optional), profile_picture (optional)
router.post('/auth/register', upload.single('profile_picture'), handleMulterError, publicController.publicRegisterUser);

// Password Reset Request
// Usage: POST /public/auth/password-reset-request
// JSON body: { email }
router.post('/auth/password-reset-request', publicController.publicRequestPasswordReset);

// Password Reset
// Usage: POST /public/auth/password-reset
// JSON body: { token, new_password }
router.post('/auth/password-reset', publicController.publicResetPassword);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Public API is running',
    timestamp: new Date().toISOString()
  });
});

// API info endpoint
router.get('/info', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'TripLogic Public API',
    version: '1.0.0',
    endpoints: {
      data: '/public/data/:tablename/:orderby?/:where?',
      item: '/public/item/:tablename/:id',
      search: '/public/search/:tablename?q=searchterm&field=fieldname&orderby=orderfield',
      featured: '/public/featured/:tablename?limit=number',
      count: '/public/count/:tablename/:where? (supports operators: =, !=, >, <, >=, <=, LIKE, IN)',
      reviews: 'POST /public/reviews/submit (multipart/form-data)',
      register: 'POST /public/auth/register (multipart/form-data)',
      passwordResetRequest: 'POST /public/auth/password-reset-request (JSON)',
      passwordReset: 'POST /public/auth/password-reset (JSON)',
      health: '/public/health',
      info: '/public/info'
    },
    allowedTables: [
      'activities',
      'categories',
      'packages',
      'destinations',
      'cms_activities',
      'cms_packages',
      'cms_destinations',
      'cms_content',
      'testimonials',
      'galleries',
      'activity_reviews'
    ],
    countEndpoint: {
      endpoint: '/public/count/:tablename/:where?',
      method: 'GET',
      description: 'Count records in a table with optional WHERE conditions',
      examples: {
        basic: '/public/count/activities (count all records)',
        simple_where: '/public/count/activities/status=active',
        multiple_conditions: '/public/count/activities/status=active&category=adventure',
        comparison_operators: {
          greater_than: '/public/count/activities/price>100',
          less_than: '/public/count/packages/duration<7',
          not_equal: '/public/count/testimonials/status!=pending',
          like: '/public/count/destinations/name=LIKEbali'
        },
        in_clause: '/public/count/activities/status=IN(active,featured)',
        date_range: '/public/count/bookings/created_date>=2025-01-01&created_date<=2025-12-31'
      },
      supported_operators: ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN'],
      response_format: {
        status: 'success',
        message: 'Record count retrieved successfully',
        data: {
          table: 'tablename',
          where_clause: 'conditions or none',
          total_count: 'number',
          query_time: 'ISO timestamp'
        }
      }
    },
    authEndpoints: {
      registration: {
        endpoint: '/public/auth/register',
        method: 'POST',
        contentType: 'multipart/form-data',
        fields: {
          required: ['email', 'password', 'first_name', 'last_name'],
          optional: ['phone', 'date_of_birth', 'profile_picture']
        },
        description: 'Register a new public user account with optional profile picture'
      },
      passwordReset: {
        request: {
          endpoint: '/public/auth/password-reset-request',
          method: 'POST',
          contentType: 'application/json',
          fields: { required: ['email'] },
          description: 'Request password reset token via email'
        },
        reset: {
          endpoint: '/public/auth/password-reset',
          method: 'POST',
          contentType: 'application/json',
          fields: { required: ['token', 'new_password'] },
          description: 'Reset password using valid token'
        }
      }
    },
    note: 'All endpoints return only active/published content. User registration endpoints require no authentication.'
  });
});

module.exports = router;


