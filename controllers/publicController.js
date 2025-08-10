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

  // Handle ORDER BY clause properly
  let orderByClause = '';
  if (orderby) {
    // Check if orderby contains direction (ASC/DESC)
    const orderParts = orderby.trim().split(' ');
    if (orderParts.length === 2 && (orderParts[1].toUpperCase() === 'ASC' || orderParts[1].toUpperCase() === 'DESC')) {
      // Field with direction: e.g., "created_at DESC"
      orderByClause = `ORDER BY ?? ${orderParts[1].toUpperCase()}`;
    } else {
      // Just field name: e.g., "created_at"
      orderByClause = `ORDER BY ??`;
    }
  } else {
    orderByClause = `ORDER BY ??`;
  }

  // Construct the SQL query
  let query = `SELECT * FROM ?? ${whereClause} ${orderByClause}`;
  let queryParams;
  
  if (orderby && orderby.includes(' ')) {
    // Extract just the field name for parameterization
    const fieldName = orderby.trim().split(' ')[0];
    queryParams = [tablename, fieldName];
  } else {
    queryParams = [tablename, orderby || 'id'];
  }

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

  // Handle ORDER BY clause properly
  if (orderby) {
    const orderParts = orderby.trim().split(' ');
    if (orderParts.length === 2 && (orderParts[1].toUpperCase() === 'ASC' || orderParts[1].toUpperCase() === 'DESC')) {
      // Field with direction: e.g., "created_at DESC"
      query += ` ORDER BY ?? ${orderParts[1].toUpperCase()}`;
      queryParams.push(orderParts[0]);
    } else {
      // Just field name: e.g., "created_at"
      query += ` ORDER BY ??`;
      queryParams.push(orderby);
    }
  } else {
    query += ` ORDER BY ??`;
    queryParams.push('id');
  }

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
  const query = `SELECT * FROM ?? WHERE status = 'active' AND is_featured = 1 ORDER BY id DESC LIMIT ?`;
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
        review_images: reviewImages ? (() => {
          try {
            return JSON.parse(reviewImages);
          } catch (e) {
            console.warn('[postReviewWithImages] Error parsing review_images JSON:', e);
            return null;
          }
        })() : null,
        status: 'pending'
      }
    });
  });
};

// Public user registration function - no authentication required
const publicRegisterUser = async (req, res) => {
  const bcrypt = require('bcryptjs');
  
  try {
    console.log('[publicRegisterUser] Registration attempt:', req.body);
    
    const { email, password, first_name, last_name, phone, date_of_birth } = req.body;

    // Validate required fields
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: email, password, first_name, last_name',
        data: null
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format',
        data: null
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long',
        data: null
      });
    }

    // Check if user already exists
    const checkQuery = 'SELECT id FROM public_users WHERE email = ?';
    db.query(checkQuery, [email], async (err, existingUser) => {
      if (err) {
        console.error('[publicRegisterUser] Database error checking existing user:', err);
        return res.status(500).json({
          status: 'error',
          message: 'Database error occurred',
          data: null
        });
      }

      if (existingUser && existingUser.length > 0) {
        return res.status(409).json({
          status: 'error',
          message: 'User with this email already exists',
          data: null
        });
      }

      try {
        // Hash password
        const saltRounds = 12;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Handle profile picture if uploaded
        let profile_picture_url = null;
        if (req.file) {
          // File is already saved by multer in the profile_photo directory
          profile_picture_url = `/uploads/profile_photo/${req.file.filename}`;
          console.log('[publicRegisterUser] Profile picture saved:', profile_picture_url);
        }

        // Insert user into public_users table
        const insertUserQuery = `
          INSERT INTO public_users 
          (email, password_hash, first_name, last_name, phone, date_of_birth, profile_picture_url, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        db.query(insertUserQuery, [
          email, 
          password_hash, 
          first_name, 
          last_name, 
          phone || null, 
          date_of_birth || null, 
          profile_picture_url
        ], (insertErr, result) => {
          if (insertErr) {
            console.error('[publicRegisterUser] Error inserting user:', insertErr);
            return res.status(500).json({
              status: 'error',
              message: 'Failed to create user account',
              data: null
            });
          }

          const userId = result.insertId;
          console.log('[publicRegisterUser] User created with ID:', userId);

          // Insert default user preferences
          const insertPreferencesQuery = `
            INSERT INTO user_preferences 
            (user_id, language, currency, timezone, newsletter_subscription, marketing_emails, sms_notifications, created_at, updated_at) 
            VALUES (?, 'EN', 'USD', 'UTC', 1, 1, 0, NOW(), NOW())
          `;

          db.query(insertPreferencesQuery, [userId], (prefErr, prefResult) => {
            if (prefErr) {
              console.error('[publicRegisterUser] Error creating user preferences:', prefErr);
              // Don't fail the registration if preferences creation fails
            } else {
              console.log('[publicRegisterUser] User preferences created for user:', userId);
            }

            // Return success response
            res.status(201).json({
              status: 'success',
              message: 'User registered successfully',
              data: {
                user_id: userId,
                email: email,
                first_name: first_name,
                last_name: last_name,
                phone: phone,
                profile_picture_url: profile_picture_url,
                email_verified: false,
                is_active: true,
                created_at: new Date().toISOString()
              }
            });
          });
        });

      } catch (hashError) {
        console.error('[publicRegisterUser] Error hashing password:', hashError);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to process password',
          data: null
        });
      }
    });

  } catch (error) {
    console.error('[publicRegisterUser] Unexpected error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred during registration',
      data: null
    });
  }
};

// Public password reset request function
const publicRequestPasswordReset = (req, res) => {
  const crypto = require('crypto');
  
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required',
        data: null
      });
    }

    // Check if user exists
    const checkUserQuery = 'SELECT id FROM public_users WHERE email = ? AND is_active = 1';
    db.query(checkUserQuery, [email], (err, user) => {
      if (err) {
        console.error('[publicRequestPasswordReset] Database error:', err);
        return res.status(500).json({
          status: 'error',
          message: 'Database error occurred',
          data: null
        });
      }

      if (!user || user.length === 0) {
        // Don't reveal if user exists or not for security
        return res.status(200).json({
          status: 'success',
          message: 'If the email exists, a password reset link has been sent',
          data: null
        });
      }

      const userId = user[0].id;
      
      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      // Insert password reset token
      const insertTokenQuery = `
        INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) 
        VALUES (?, ?, ?, NOW())
      `;

      db.query(insertTokenQuery, [userId, token, expiresAt], (tokenErr, result) => {
        if (tokenErr) {
          console.error('[publicRequestPasswordReset] Error creating reset token:', tokenErr);
          return res.status(500).json({
            status: 'error',
            message: 'Failed to create password reset request',
            data: null
          });
        }

        console.log('[publicRequestPasswordReset] Password reset token created for user:', userId);
        
        // In a real application, you would send an email here
        // For now, we'll just return the token (remove this in production)
        res.status(200).json({
          status: 'success',
          message: 'Password reset instructions have been sent to your email',
          data: {
            reset_token: token, // Remove this in production
            expires_at: expiresAt
          }
        });
      });
    });

  } catch (error) {
    console.error('[publicRequestPasswordReset] Unexpected error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred',
      data: null
    });
  }
};

// Public password reset function
const publicResetPassword = (req, res) => {
  const bcrypt = require('bcryptjs');
  
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({
        status: 'error',
        message: 'Reset token and new password are required',
        data: null
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long',
        data: null
      });
    }

    // Check if token is valid and not expired
    const checkTokenQuery = `
      SELECT user_id FROM password_reset_tokens 
      WHERE token = ? AND expires_at > NOW() AND used_at IS NULL
    `;

    db.query(checkTokenQuery, [token], async (err, tokenResult) => {
      if (err) {
        console.error('[publicResetPassword] Database error:', err);
        return res.status(500).json({
          status: 'error',
          message: 'Database error occurred',
          data: null
        });
      }

      if (!tokenResult || tokenResult.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid or expired reset token',
          data: null
        });
      }

      const userId = tokenResult[0].user_id;

      try {
        // Hash new password
        const saltRounds = 12;
        const password_hash = await bcrypt.hash(new_password, saltRounds);

        // Update user password
        const updatePasswordQuery = `
          UPDATE public_users 
          SET password_hash = ?, updated_at = NOW() 
          WHERE id = ?
        `;

        db.query(updatePasswordQuery, [password_hash, userId], (updateErr, updateResult) => {
          if (updateErr) {
            console.error('[publicResetPassword] Error updating password:', updateErr);
            return res.status(500).json({
              status: 'error',
              message: 'Failed to update password',
              data: null
            });
          }

          // Mark token as used
          const markTokenUsedQuery = `
            UPDATE password_reset_tokens 
            SET used_at = NOW() 
            WHERE token = ?
          `;

          db.query(markTokenUsedQuery, [token], (markErr, markResult) => {
            if (markErr) {
              console.error('[publicResetPassword] Error marking token as used:', markErr);
            }

            console.log('[publicResetPassword] Password reset successful for user:', userId);
            
            res.status(200).json({
              status: 'success',
              message: 'Password has been reset successfully',
              data: null
            });
          });
        });

      } catch (hashError) {
        console.error('[publicResetPassword] Error hashing password:', hashError);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to process password',
          data: null
        });
      }
    });

  } catch (error) {
    console.error('[publicResetPassword] Unexpected error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred',
      data: null
    });
  }
};

// Public count records function - no authentication required
const publicCountRecords = (req, res) => {
  const tablename = req.params.tablename;
  const where = req.params.where ? decodeURIComponent(req.params.where) : '';

  // Debug: log incoming parameters
  console.log('[publicCountRecords] tablename:', tablename);
  console.log('[publicCountRecords] where:', where);

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
    'activity_reviews',
    'public_users'
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
    
    for (const [key, value] of params) {
      // Escape single quotes to prevent SQL injection
      const escapedValue = value.replace(/'/g, "''");
      
      // Handle different comparison operators
      if (value.includes('>=')) {
        const [, compValue] = value.split('>=');
        conditions.push(`${key} >= '${compValue.replace(/'/g, "''")}'`);
      } else if (value.includes('<=')) {
        const [, compValue] = value.split('<=');
        conditions.push(`${key} <= '${compValue.replace(/'/g, "''")}'`);
      } else if (value.includes('>')) {
        const [, compValue] = value.split('>');
        conditions.push(`${key} > '${compValue.replace(/'/g, "''")}'`);
      } else if (value.includes('<')) {
        const [, compValue] = value.split('<');
        conditions.push(`${key} < '${compValue.replace(/'/g, "''")}'`);
      } else if (value.includes('!=')) {
        const [, compValue] = value.split('!=');
        conditions.push(`${key} != '${compValue.replace(/'/g, "''")}'`);
      } else if (value.includes('LIKE')) {
        const [, compValue] = value.split('LIKE');
        conditions.push(`${key} LIKE '%${compValue.replace(/'/g, "''")}%'`);
      } else if (value.includes('IN')) {
        // Handle IN clause: status=IN(active,inactive)
        const inValues = value.match(/IN\(([^)]+)\)/);
        if (inValues) {
          const values = inValues[1].split(',').map(v => `'${v.trim().replace(/'/g, "''")}'`).join(',');
          conditions.push(`${key} IN (${values})`);
        }
      } else {
        // Default equality comparison
        conditions.push(`${key} = '${escapedValue}'`);
      }
    }
    
    if (conditions.length > 0) {
      whereClause = ` WHERE ${conditions.join(' AND ')}`;
    }
  }

  // Build count query
  const countQuery = `SELECT COUNT(*) as total_count FROM ${tablename}${whereClause}`;
  
  console.log('[publicCountRecords] SQL Query:', countQuery);

  // Execute query
  db.query(countQuery, (err, result) => {
    if (err) {
      console.error('[publicCountRecords] Database error:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Database error occurred',
        data: null,
        error: err.message
      });
    }

    const totalCount = result[0]?.total_count || 0;

    console.log('[publicCountRecords] Count result:', totalCount);

    res.status(200).json({
      status: 'success',
      message: 'Record count retrieved successfully',
      data: {
        table: tablename,
        where_clause: where || 'none',
        total_count: totalCount,
        query_time: new Date().toISOString()
      }
    });
  });
};

// Public get cities with activities function - no authentication required
const publicGetCitiesWithActivities = (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : null;
  const orderBy = req.query.orderby || 'activity_count DESC';
  
  console.log('[publicGetCitiesWithActivities] limit:', limit);
  console.log('[publicGetCitiesWithActivities] orderBy:', orderBy);

  // Build the query to get cities grouped by location_id with activity counts
  let query = `
    SELECT 
      d.id as destination_id,
      d.name as destination_name,
      d.name as city,
      d.state,
      d.country,
      d.type as destination_type,
      d.description as destination_description,
      d.images as destination_images,
      d.best_time_to_visit,
      d.popular_attractions,
      d.climate,
      d.is_featured as destination_featured,
      COUNT(ca.id) as activity_count,
      GROUP_CONCAT(DISTINCT ca.name ORDER BY ca.name SEPARATOR ', ') as sample_activities,
      GROUP_CONCAT(DISTINCT ca.category ORDER BY ca.category SEPARATOR ', ') as activity_categories
    FROM destinations d
    LEFT JOIN cms_activities ca ON d.id = ca.location_id 
      AND (ca.status = 'active' OR ca.status = 'published')
    WHERE (d.status = 'Active' OR d.status = 'active')
    GROUP BY d.id, d.name, d.state, d.country, d.type, d.description, d.images, d.best_time_to_visit, d.popular_attractions, d.climate, d.is_featured
    HAVING activity_count > 0
  `;

  // Handle ORDER BY clause properly
  if (orderBy) {
    const orderParts = orderBy.trim().split(' ');
    const allowedOrderFields = [
      'destination_name', 'city', 'state', 'country', 'activity_count', 
      'destination_type', 'best_time_to_visit'
    ];
    
    if (allowedOrderFields.includes(orderParts[0])) {
      if (orderParts.length === 2 && (orderParts[1].toUpperCase() === 'ASC' || orderParts[1].toUpperCase() === 'DESC')) {
        query += ` ORDER BY ${orderParts[0]} ${orderParts[1].toUpperCase()}`;
      } else {
        query += ` ORDER BY ${orderParts[0]}`;
      }
    } else {
      // Default ordering
      query += ` ORDER BY activity_count DESC`;
    }
  }

  // Add limit if specified
  if (limit && limit > 0) {
    query += ` LIMIT ${parseInt(limit)}`;
  }

  console.log('[publicGetCitiesWithActivities] SQL Query:', query);

  // Execute query
  db.query(query, (err, result) => {
    if (err) {
      console.error('[publicGetCitiesWithActivities] Database error:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Database error occurred',
        data: null,
        error: err.message
      });
    }

    // Helper function to safely parse JSON or return fallback
    const safeJsonParse = (jsonString, fallback = null) => {
      if (!jsonString) return fallback;
      
      try {
        // Check if it's already a valid JSON string
        return JSON.parse(jsonString);
      } catch (e) {
        console.warn('[publicGetCitiesWithActivities] Invalid JSON, using fallback:', jsonString);
        
        // If it's a simple string, return it as is
        if (typeof jsonString === 'string') {
          // If it looks like a comma-separated list, split it
          if (jsonString.includes(',')) {
            return jsonString.split(',').map(item => item.trim());
          }
          // Otherwise return as single item array or plain string
          return fallback === null ? jsonString : [jsonString];
        }
        
        return fallback;
      }
    };

    // Process the results to format data and add additional info
    const processedResults = result.map(row => ({
      destination_id: row.destination_id,
      destination_name: row.destination_name,
      city: row.city,
      state: row.state,
      country: row.country,
      destination_type: row.destination_type,
      full_location: `${row.city}${row.state ? ', ' + row.state : ''}${row.country ? ', ' + row.country : ''}`,
      destination_description: row.destination_description,
      destination_images: safeJsonParse(row.destination_images, []),
      best_time_to_visit: row.best_time_to_visit,
      popular_attractions: safeJsonParse(row.popular_attractions, []),
      climate: row.climate,
      is_featured: Boolean(row.destination_featured),
      activity_statistics: {
        total_activities: row.activity_count,
        categories: row.activity_categories ? row.activity_categories.split(', ').filter((item, index, arr) => arr.indexOf(item) === index) : []
      },
      sample_activities: row.sample_activities ? row.sample_activities.split(', ').slice(0, 5) : [],
      query_time: new Date().toISOString()
    }));

    console.log('[publicGetCitiesWithActivities] Results count:', processedResults.length);

    res.status(200).json({
      status: 'success',
      message: 'Cities with activities retrieved successfully',
      data: processedResults,
      count: processedResults.length,
      summary: {
        total_destinations: processedResults.length,
        total_activities: processedResults.reduce((sum, city) => sum + city.activity_statistics.total_activities, 0),
        query_params: {
          limit: limit,
          order_by: orderBy
        }
      }
    });
  });
};

// Public user login function - no authentication required
const publicLoginUser = async (req, res) => {
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  
  try {
    console.log('[publicLoginUser] Login attempt:', { email: req.body.email });
    
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
        data: null
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format',
        data: null
      });
    }

    // Find user by email
    const userQuery = `
      SELECT 
        id, email, password_hash, first_name, last_name, phone, 
        date_of_birth, profile_picture_url, email_verified, is_active, 
        created_at, updated_at, last_login
      FROM public_users 
      WHERE email = ? AND is_active = 1
    `;

    db.query(userQuery, [email], async (err, userResult) => {
      if (err) {
        console.error('[publicLoginUser] Database error:', err);
        return res.status(500).json({
          status: 'error',
          message: 'Database error occurred',
          data: null
        });
      }

      if (!userResult || userResult.length === 0) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password',
          data: null
        });
      }

      const user = userResult[0];

      try {
        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatch) {
          return res.status(401).json({
            status: 'error',
            message: 'Invalid email or password',
            data: null
          });
        }

        // Update last login time
        const updateLoginQuery = 'UPDATE public_users SET last_login = NOW() WHERE id = ?';
        db.query(updateLoginQuery, [user.id], (updateErr) => {
          if (updateErr) {
            console.error('[publicLoginUser] Error updating last login:', updateErr);
          }
        });

        // Generate JWT token (you can adjust the secret and expiration)
        const tokenPayload = {
          user_id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          type: 'public_user'
        };

        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-here';
        const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });

        // Get user preferences
        const preferencesQuery = 'SELECT * FROM user_preferences WHERE user_id = ?';
        db.query(preferencesQuery, [user.id], (prefErr, prefResult) => {
          let userPreferences = null;
          if (!prefErr && prefResult && prefResult.length > 0) {
            userPreferences = prefResult[0];
          }

          console.log('[publicLoginUser] Login successful for user:', user.id);

          // Return success response with user data and token
          res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
              user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                date_of_birth: user.date_of_birth,
                profile_picture_url: user.profile_picture_url,
                email_verified: Boolean(user.email_verified),
                is_active: Boolean(user.is_active),
                created_at: user.created_at,
                last_login: new Date().toISOString()
              },
              preferences: userPreferences,
              token: token,
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
            }
          });
        });

      } catch (compareError) {
        console.error('[publicLoginUser] Error comparing password:', compareError);
        return res.status(500).json({
          status: 'error',
          message: 'Authentication error occurred',
          data: null
        });
      }
    });

  } catch (error) {
    console.error('[publicLoginUser] Unexpected error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred during login',
      data: null
    });
  }
};

module.exports = {
  publicFetchData,
  publicFetchById,
  publicSearch,
  publicFeatured,
  postReviewWithImages,
  publicRegisterUser,
  publicRequestPasswordReset,
  publicResetPassword,
  publicCountRecords,
  publicGetCitiesWithActivities,
  publicLoginUser
};
