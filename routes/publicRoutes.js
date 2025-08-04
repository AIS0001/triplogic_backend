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

// Post review with multiple images (no authentication required)
// Usage: POST /public/reviews/submit
// Form data: user_name, email, rating, review_text, entity_type, entity_id, images[]
router.post('/reviews/submit', upload.array('images', 5), handleMulterError, publicController.postReviewWithImages);

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
      reviews: 'POST /public/reviews/submit (multipart/form-data)',
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
    note: 'All endpoints return only active/published content. No authentication required.'
  });
});

module.exports = router;
