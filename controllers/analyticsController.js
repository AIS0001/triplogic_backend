const db = require('../config/dbconnection');

// Store user activity for analytics
const storeUserActivity = (req, res) => {
  console.log('=== STORE USER ACTIVITY DEBUG ===');
  console.log('Request body:', req.body);
  console.log('User from token:', req.user);

  const {
    user_id,
    activity_type,
    page_url,
    action_performed,
    element_clicked,
    time_spent,
    device_info,
    browser_info,
    ip_address,
    session_id,
    referrer,
    search_query,
    filters_applied,
    additional_data
  } = req.body;

  // Validate required fields
  if (!activity_type) {
    return res.status(400).json({
      success: false,
      message: 'activity_type is required'
    });
  }

  // Get user_id from token if not provided in body
  const actualUserId = user_id || (req.user ? req.user.id : null);

  // Prepare data for insertion
  const activityData = {
    user_id: actualUserId,
    activity_type: activity_type,
    page_url: page_url || req.headers.referer || null,
    action_performed: action_performed || null,
    element_clicked: element_clicked || null,
    time_spent: time_spent || null,
    device_info: device_info || req.headers['user-agent'] || null,
    browser_info: browser_info || null,
    ip_address: ip_address || req.ip || req.connection.remoteAddress || null,
    session_id: session_id || null,
    referrer: referrer || req.headers.referer || null,
    search_query: search_query || null,
    filters_applied: filters_applied ? JSON.stringify(filters_applied) : null,
    additional_data: additional_data ? JSON.stringify(additional_data) : null,
    timestamp: new Date(),
    created_at: new Date()
  };

  console.log('Activity data to insert:', activityData);

  // Insert into user_activities table
  const insertQuery = `
    INSERT INTO user_activities (
      user_id, 
      activity_type, 
      page_url, 
      action_performed, 
      element_clicked, 
      time_spent, 
      device_info, 
      browser_info, 
      ip_address, 
      session_id, 
      referrer, 
      search_query, 
      filters_applied, 
      additional_data, 
      timestamp, 
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    activityData.user_id,
    activityData.activity_type,
    activityData.page_url,
    activityData.action_performed,
    activityData.element_clicked,
    activityData.time_spent,
    activityData.device_info,
    activityData.browser_info,
    activityData.ip_address,
    activityData.session_id,
    activityData.referrer,
    activityData.search_query,
    activityData.filters_applied,
    activityData.additional_data,
    activityData.timestamp,
    activityData.created_at
  ];

  console.log('Insert query:', insertQuery);
  console.log('Insert values:', values);

  db.query(insertQuery, values, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error storing user activity',
        error: err.message
      });
    }

    console.log('Activity stored with ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: 'User activity stored successfully',
      activity_id: result.insertId,
      timestamp: activityData.timestamp
    });
  });
};

// Batch store multiple activities
const storeBatchActivities = (req, res) => {
  console.log('=== STORE BATCH ACTIVITIES DEBUG ===');
  console.log('Request body:', req.body);

  const { activities } = req.body;

  if (!activities || !Array.isArray(activities) || activities.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'activities array is required and cannot be empty'
    });
  }

  if (activities.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 100 activities allowed per batch'
    });
  }

  const actualUserId = req.user ? req.user.id : null;
  const currentTime = new Date();

  // Prepare batch insert data
  const insertQuery = `
    INSERT INTO user_activities (
      user_id, 
      activity_type, 
      page_url, 
      action_performed, 
      element_clicked, 
      time_spent, 
      device_info, 
      browser_info, 
      ip_address, 
      session_id, 
      referrer, 
      search_query, 
      filters_applied, 
      additional_data, 
      timestamp, 
      created_at
    ) VALUES ?
  `;

  const values = activities.map(activity => [
    activity.user_id || actualUserId,
    activity.activity_type,
    activity.page_url || req.headers.referer || null,
    activity.action_performed || null,
    activity.element_clicked || null,
    activity.time_spent || null,
    activity.device_info || req.headers['user-agent'] || null,
    activity.browser_info || null,
    activity.ip_address || req.ip || null,
    activity.session_id || null,
    activity.referrer || req.headers.referer || null,
    activity.search_query || null,
    activity.filters_applied ? JSON.stringify(activity.filters_applied) : null,
    activity.additional_data ? JSON.stringify(activity.additional_data) : null,
    activity.timestamp ? new Date(activity.timestamp) : currentTime,
    currentTime
  ]);

  console.log('Batch insert values:', values);

  db.query(insertQuery, [values], (err, result) => {
    if (err) {
      console.error('Batch insert error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error storing batch activities',
        error: err.message
      });
    }

    console.log('Batch activities stored, affected rows:', result.affectedRows);

    res.status(201).json({
      success: true,
      message: 'Batch activities stored successfully',
      activities_stored: result.affectedRows,
      timestamp: currentTime
    });
  });
};

// Get user activity analytics (for admin/analytics dashboard)
const getUserActivityAnalytics = (req, res) => {
  console.log('=== GET USER ACTIVITY ANALYTICS DEBUG ===');
  
  const { 
    user_id, 
    activity_type, 
    start_date, 
    end_date, 
    limit = 100,
    offset = 0
  } = req.query;

  let whereConditions = [];
  let queryParams = [];

  // Build dynamic WHERE clause
  if (user_id) {
    whereConditions.push('user_id = ?');
    queryParams.push(user_id);
  }

  if (activity_type) {
    whereConditions.push('activity_type = ?');
    queryParams.push(activity_type);
  }

  if (start_date) {
    whereConditions.push('created_at >= ?');
    queryParams.push(start_date);
  }

  if (end_date) {
    whereConditions.push('created_at <= ?');
    queryParams.push(end_date);
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : '';

  const query = `
    SELECT 
      id,
      user_id,
      activity_type,
      page_url,
      action_performed,
      element_clicked,
      time_spent,
      device_info,
      browser_info,
      ip_address,
      session_id,
      referrer,
      search_query,
      filters_applied,
      additional_data,
      timestamp,
      created_at
    FROM user_activities 
    ${whereClause}
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `;

  queryParams.push(parseInt(limit), parseInt(offset));

  console.log('Analytics query:', query);
  console.log('Query params:', queryParams);

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Analytics query error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching analytics data',
        error: err.message
      });
    }

    // Also get count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM user_activities 
      ${whereClause}
    `;

    db.query(countQuery, queryParams.slice(0, -2), (countErr, countResults) => {
      if (countErr) {
        console.error('Count query error:', countErr);
        return res.status(500).json({
          success: false,
          message: 'Error getting total count',
          error: countErr.message
        });
      }

      const total = countResults[0].total;

      res.status(200).json({
        success: true,
        message: 'Analytics data fetched successfully',
        data: results,
        pagination: {
          total: total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + results.length) < total
        }
      });
    });
  });
};

// Get activity summary/statistics
const getActivitySummary = (req, res) => {
  const { start_date, end_date, user_id } = req.query;
  
  let whereConditions = [];
  let queryParams = [];

  if (user_id) {
    whereConditions.push('user_id = ?');
    queryParams.push(user_id);
  }

  if (start_date) {
    whereConditions.push('created_at >= ?');
    queryParams.push(start_date);
  }

  if (end_date) {
    whereConditions.push('created_at <= ?');
    queryParams.push(end_date);
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : '';

  const summaryQuery = `
    SELECT 
      activity_type,
      COUNT(*) as count,
      AVG(time_spent) as avg_time_spent,
      DATE(created_at) as activity_date
    FROM user_activities 
    ${whereClause}
    GROUP BY activity_type, DATE(created_at)
    ORDER BY activity_date DESC, count DESC
  `;

  console.log('Summary query:', summaryQuery);
  console.log('Query params:', queryParams);

  db.query(summaryQuery, queryParams, (err, results) => {
    if (err) {
      console.error('Summary query error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching activity summary',
        error: err.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Activity summary fetched successfully',
      data: results
    });
  });
};

module.exports = {
  storeUserActivity,
  storeBatchActivities,
  getUserActivityAnalytics,
  getActivitySummary
};
