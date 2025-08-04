const db = require('../config/dbconnection');

// Public fetch data function - no authentication required
const publicFetchData = (req, res) => {
  const tablename = req.params.tablename;
  const orderby = req.params.orderby || 'id';
  const where = req.params.where ? decodeURIComponent(req.params.where) : '';

  // Debug: log incoming parameters
  console.log('[publicFetchData] tablename:', tablename);
  console.log('[publicFetchData] orderby:', orderby);
  console.log('[publicFetchData] where:', where);

  // Validate inputs
  if (!tablename) {
    return res.status(400).json({
      status: 'error',
      message: 'Table name is required',
      data: null
    });
  }

  // Security: Only allow specific tables for public access
  const allowedTables = [
    'activities', 
    'categories',
    'packages', 
    'destinations', 
    'cms_activities',
    'cms_packages',
    'cms_destinations',
    'cms_content',
    'testimonials',
    'galleries'
  ];

  if (!allowedTables.includes(tablename)) {
    return res.status(403).json({
      status: 'error',
      message: 'Access to this table is not allowed',
      data: null
    });
  }

  // Build WHERE clause
  let whereClause = '';
  if (where) {
    // Parse URL parameters for WHERE conditions
    const params = new URLSearchParams(where);
    const conditions = [];
    for (const [key, value] of params.entries()) {
      conditions.push(`${key}="${value}"`);
    }
    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }
  }

  // Add default status filter for public data (only show active/published content)
  if (whereClause) {
    whereClause += ` AND (status = 'active' OR status = 'published')`;
  } else {
    whereClause = `WHERE (status = 'active' OR status = 'published')`;
  }

  // Construct the SQL query
  let query = `SELECT * FROM ?? ${whereClause} ORDER BY ??`;
  const queryParams = [tablename, orderby];

  const formattedQuery = db.format(query, queryParams);
  console.log('[publicFetchData] SQL:', formattedQuery);

  // Execute the query
  db.query(formattedQuery, (error, results) => {
    if (error) {
      console.error('SQL Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred while fetching data',
        data: null
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Data fetched successfully',
      data: results,
      count: results.length
    });
  });
};

// Public fetch single item by ID
const publicFetchById = (req, res) => {
  const tablename = req.params.tablename;
  const id = req.params.id;

  console.log('[publicFetchById] tablename:', tablename);
  console.log('[publicFetchById] id:', id);

  // Validate inputs
  if (!tablename || !id) {
    return res.status(400).json({
      status: 'error',
      message: 'Table name and ID are required',
      data: null
    });
  }

  // Security: Only allow specific tables for public access
  const allowedTables = [
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
  ];

  if (!allowedTables.includes(tablename)) {
    return res.status(403).json({
      status: 'error',
      message: 'Access to this table is not allowed',
      data: null
    });
  }

  // Query for single item with status check
  const query = `SELECT * FROM ?? WHERE id = ? AND (status = 'active' OR status = 'published')`;
  const queryParams = [tablename, id];

  const formattedQuery = db.format(query, queryParams);
  console.log('[publicFetchById] SQL:', formattedQuery);

  db.query(formattedQuery, (error, results) => {
    if (error) {
      console.error('SQL Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred while fetching data',
        data: null
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Item not found',
        data: null
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Data fetched successfully',
      data: results[0]
    });
  });
};

// Public search function
const publicSearch = (req, res) => {
  const tablename = req.params.tablename;
  const searchTerm = req.query.q || '';
  const searchField = req.query.field || 'name';
  const orderby = req.query.orderby || 'id';

  console.log('[publicSearch] tablename:', tablename);
  console.log('[publicSearch] searchTerm:', searchTerm);
  console.log('[publicSearch] searchField:', searchField);

  // Validate inputs
  if (!tablename) {
    return res.status(400).json({
      status: 'error',
      message: 'Table name is required',
      data: null
    });
  }

  // Security: Only allow specific tables for public access
  const allowedTables = [
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
  ];

  if (!allowedTables.includes(tablename)) {
    return res.status(403).json({
      status: 'error',
      message: 'Access to this table is not allowed',
      data: null
    });
  }

  // Build search query
  let query = `SELECT * FROM ?? WHERE (status = 'active' OR status = 'published')`;
  let queryParams = [tablename];

  if (searchTerm) {
    query += ` AND ?? LIKE ?`;
    queryParams.push(searchField, `%${searchTerm}%`);
  }

  query += ` ORDER BY ??`;
  queryParams.push(orderby);

  const formattedQuery = db.format(query, queryParams);
  console.log('[publicSearch] SQL:', formattedQuery);

  db.query(formattedQuery, (error, results) => {
    if (error) {
      console.error('SQL Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred while searching data',
        data: null
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Search completed successfully',
      data: results,
      count: results.length,
      searchTerm: searchTerm
    });
  });
};

// Public featured/highlight content
const publicFeatured = (req, res) => {
  const tablename = req.params.tablename;
  const limit = req.query.limit || 10;

  console.log('[publicFeatured] tablename:', tablename);
  console.log('[publicFeatured] limit:', limit);

  // Security: Only allow specific tables
  const allowedTables = [
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
  ];

  if (!allowedTables.includes(tablename)) {
    return res.status(403).json({
      status: 'error',
      message: 'Access to this table is not allowed',
      data: null
    });
  }

  // Query for featured/highlighted content
  const query = `SELECT * FROM ?? WHERE (status = 'active' OR status = 'published') AND (featured = 1 OR is_featured = 1 OR highlight = 1) ORDER BY created_at DESC LIMIT ?`;
  const queryParams = [tablename, parseInt(limit)];

  const formattedQuery = db.format(query, queryParams);
  console.log('[publicFeatured] SQL:', formattedQuery);

  db.query(formattedQuery, (error, results) => {
    if (error) {
      console.error('SQL Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred while fetching featured data',
        data: null
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Featured data fetched successfully',
      data: results,
      count: results.length
    });
  });
};

// Public post review with multiple images
const postReviewWithImages = (req, res) => {
  console.log('[postReviewWithImages] Request body:', req.body);
  console.log('[postReviewWithImages] Uploaded files:', req.files);

  // Validate required fields according to activity_reviews table
  const { 
    activity_id, 
    activity_name, 
    customer_name, 
    review_details, 
    rating, 
    customer_email, 
    customer_phone,
    review_date 
  } = req.body;
  
  if (!activity_id || !activity_name || !customer_name || !review_details || !rating) {
    return res.status(400).json({
      status: 'error',
      message: 'Required fields: activity_id, activity_name, customer_name, review_details, rating',
      data: null
    });
  }

  // Validate rating (1-5)
  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      status: 'error',
      message: 'Rating must be between 1 and 5',
      data: null
    });
  }

  // Validate email format if provided
  if (customer_email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format',
        data: null
      });
    }
  }

  // Process uploaded images with metadata
  let reviewImages = null;
  if (req.files && req.files.length > 0) {
    const imageObjects = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date().toISOString()
    }));
    reviewImages = JSON.stringify(imageObjects);
    console.log('[postReviewWithImages] Image objects:', imageObjects);
  }

  // Prepare review data according to activity_reviews table structure
  const reviewData = {
    activity_id: parseInt(activity_id),
    activity_name: activity_name,
    customer_name: customer_name,
    review_details: review_details,
    rating: parseInt(rating),
    review_images: reviewImages,
    customer_email: customer_email || null,
    customer_phone: customer_phone || null,
    is_verified: 0, // Default to not verified
    is_featured: 0, // Default to not featured
    status: 'pending', // Reviews start as pending for moderation
    review_date: review_date ? new Date(review_date) : null,
    created_at: new Date(),
    updated_at: new Date()
  };

  // Insert review into activity_reviews table
  const columns = Object.keys(reviewData);
  const values = Object.values(reviewData);
  const placeholders = columns.map(() => '?').join(', ');
  
  const query = `INSERT INTO activity_reviews (${columns.join(', ')}) VALUES (${placeholders})`;
  
  console.log('[postReviewWithImages] SQL:', query);
  console.log('[postReviewWithImages] Values:', values);

  db.query(query, values, (error, result) => {
    if (error) {
      console.error('[postReviewWithImages] SQL Error:', error);
      
      // If database error, clean up uploaded files
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          const fs = require('fs');
          const filePath = file.path;
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('[postReviewWithImages] Cleaned up file:', filePath);
          }
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'An error occurred while submitting your review',
        data: null,
        error: error.message
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Review submitted successfully! It will be published after moderation.',
      data: {
        review_id: result.insertId,
        activity_id: parseInt(activity_id),
        activity_name: activity_name,
        customer_name: customer_name,
        rating: parseInt(rating),
        images_uploaded: req.files ? req.files.length : 0,
        review_images: reviewImages ? JSON.parse(reviewImages) : null,
        status: 'pending'
      }
    });
  });
};

module.exports = {
  publicFetchData,
  publicFetchById,
  publicSearch,
  publicFeatured,
  postReviewWithImages
};
