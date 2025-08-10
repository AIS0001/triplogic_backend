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

// Configure Multer storage specifically for profile pictures
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const fs = require('fs');
    const path = require('path');
    
    // Create profile_photo directory if it doesn't exist
    const profilePhotoDir = path.join(__dirname, '../uploads/profile_photo');
    if (!fs.existsSync(profilePhotoDir)) {
      fs.mkdirSync(profilePhotoDir, { recursive: true });
    }
    
    cb(null, 'uploads/profile_photo/');
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const fileExtension = require('path').extname(file.originalname);
    cb(null, `profile-${timestamp}${fileExtension}`);
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

const profileUpload = multer({ 
  storage: profileStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for profile pictures
    files: 1 // Only one profile picture
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures!'), false);
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

// Get cities with activities (joined data from destinations and cms_activities)
// Usage: /public/cities-with-activities (get all cities with activities)
// Usage: /public/cities-with-activities?limit=10 (limit results)
// Usage: /public/cities-with-activities?orderby=activity_count DESC (custom ordering)
// Usage: /public/cities-with-activities?orderby=destination_name ASC&limit=5
router.get('/cities-with-activities', publicController.publicGetCitiesWithActivities);

// Post review with multiple images (no authentication required)
// Usage: POST /public/reviews/submit
// Form data: user_name, email, rating, review_text, entity_type, entity_id, images[]
router.post('/reviews/submit', upload.array('images', 5), handleMulterError, publicController.postReviewWithImages);

// Public User Registration APIs (no authentication required)

// User Registration with optional profile picture
// Usage: POST /public/auth/register
// Form data: email, password, first_name, last_name, phone (optional), date_of_birth (optional), profile_picture (optional)
router.post('/auth/register', profileUpload.single('profile_picture'), handleMulterError, publicController.publicRegisterUser);

// User Login
// Usage: POST /public/auth/login
// JSON body: { email, password }
router.post('/auth/login', publicController.publicLoginUser);

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
      citiesWithActivities: '/public/cities-with-activities?limit=number&orderby=field',
      reviews: 'POST /public/reviews/submit (multipart/form-data)',
      register: 'POST /public/auth/register (multipart/form-data)',
      login: 'POST /public/auth/login (JSON)',
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
    citiesEndpoint: {
      endpoint: '/public/cities-with-activities',
      method: 'GET',
      description: 'Get cities/destinations with their activities count and statistics',
      query_parameters: {
        limit: 'number (optional) - Limit the number of results',
        orderby: 'string (optional) - Order by field with optional direction'
      },
      supported_order_fields: [
        'destination_name', 'city', 'state', 'country', 'activity_count', 
        'destination_type', 'best_time_to_visit'
      ],
      examples: {
        all_cities: '/public/cities-with-activities',
        limited_results: '/public/cities-with-activities?limit=10',
        ordered_by_activities: '/public/cities-with-activities?orderby=activity_count DESC',
        ordered_by_name: '/public/cities-with-activities?orderby=destination_name ASC&limit=5',
        ordered_by_type: '/public/cities-with-activities?orderby=destination_type ASC',
        ordered_by_state: '/public/cities-with-activities?orderby=state ASC'
      },
      response_format: {
        status: 'success',
        message: 'Cities with activities retrieved successfully',
        data: [
          {
            destination_id: 'number',
            destination_name: 'string',
            city: 'string',
            state: 'string',
            country: 'string',
            destination_type: 'string',
            full_location: 'string',
            destination_description: 'string',
            destination_images: 'array or null',
            best_time_to_visit: 'string',
            popular_attractions: 'array or null',
            climate: 'string',
            is_featured: 'boolean',
            activity_statistics: {
              total_activities: 'number',
              categories: ['array of unique category names']
            },
            sample_activities: ['array of activity names'],
            query_time: 'ISO timestamp'
          }
        ],
        count: 'number',
        summary: {
          total_destinations: 'number',
          total_activities: 'number',
          query_params: { limit: 'number', order_by: 'string' }
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
      login: {
        endpoint: '/public/auth/login',
        method: 'POST',
        contentType: 'application/json',
        fields: {
          required: ['email', 'password']
        },
        description: 'Login with email and password to get JWT token',
        response: {
          user: 'object with user details',
          preferences: 'object with user preferences',
          token: 'JWT token for authentication',
          expires_at: 'token expiration timestamp'
        }
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


