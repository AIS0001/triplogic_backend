// Updated frontend API service for travel agent application
// This file shows how your existing frontend API will work with the new backend routes

import axios from 'axios';
import { getHeaders } from '../utility/getHeader';

// Base API URL - update this to match your backend
const API_BASE_URL = '/api'; // or 'http://localhost:4402/api' for absolute URL

// Generic insert function (unchanged - works with existing backend)
export const insertData = async (tablename, data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/insertdata/${tablename}`, data, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Insert error:', error);
    throw error;
  }
};

// Generic fetch function (unchanged - works with existing backend)
export const fetchData = async (tablename, orderby = null, where = null) => {
  try {
    let url = `${API_BASE_URL}/fetchdata/${tablename}`;
    if (orderby) {
      url += `/${orderby}`;
    }
    if (where) {
      const whereParams = new URLSearchParams(where).toString();
      url += `/${whereParams}`;
    }
    
    const response = await axios.get(url, getHeaders());
    return response.data.data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

// Generic update function (unchanged - works with existing backend)
export const updateData = async (tablename, updatedFields, where) => {
  try {
    const url = `${API_BASE_URL}/updatedata/${tablename}`;
    const data = { updatedFields, where };
    const response = await axios.put(url, data, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Update error:', error);
    throw error;
  }
};

// Generic delete function (unchanged - works with existing backend)
export const deleteData = async (tablename, where) => {
  try {
    const url = `${API_BASE_URL}/deletedata/${tablename}`;
    const response = await axios.delete(url, { 
      data: { where },
      ...getHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};

// Users API (enhanced with new specific endpoints)
export const usersAPI = {
  // Using generic endpoints
  getAll: (userType = null) => {
    const where = userType ? { user_type: userType } : null;
    return fetchData('users', 'created_at DESC', where);
  },
  
  create: (userData) => insertData('users', userData),
  
  update: (id, userData) => updateData('users', userData, { id }),
  
  delete: (id) => deleteData('users', { id }),
  
  getById: (id) => fetchData('users', null, { id }),

  // Using specific endpoints for better performance
  getAllSpecific: async (userType = null) => {
    try {
      const url = `${API_BASE_URL}/users${userType ? `?user_type=${userType}` : ''}`;
      const response = await axios.get(url, getHeaders());
      return response.data.data;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  },

  createSpecific: async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/users`, userData, getHeaders());
      return response.data;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  },

  updateSpecific: async (id, userData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/users/${id}`, userData, getHeaders());
      return response.data;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },

  deleteSpecific: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/users/${id}`, getHeaders());
      return response.data;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  },

  getByIdSpecific: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${id}`, getHeaders());
      return response.data.data;
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  }
};

// Itineraries API (enhanced with new specific endpoints)
export const itinerariesAPI = {
  // Using generic endpoints
  getAll: (userId = null) => {
    const where = userId ? { user_id: userId } : null;
    return fetchData('itineraries', 'created_at DESC', where);
  },
  
  create: (itineraryData) => insertData('itineraries', itineraryData),
  
  update: (id, itineraryData) => updateData('itineraries', itineraryData, { id }),
  
  delete: (id) => deleteData('itineraries', { id }),
  
  getById: (id) => fetchData('itineraries', null, { id }),
  
  getByStatus: (status) => fetchData('itineraries', 'created_at DESC', { status }),

  // Using specific endpoints
  getAllSpecific: async (userId = null) => {
    try {
      const url = `${API_BASE_URL}/itineraries${userId ? `?user_id=${userId}` : ''}`;
      const response = await axios.get(url, getHeaders());
      return response.data.data;
    } catch (error) {
      console.error('Get itineraries error:', error);
      throw error;
    }
  },

  getByStatusSpecific: async (status) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/itineraries/status/${status}`, getHeaders());
      return response.data.data;
    } catch (error) {
      console.error('Get itineraries by status error:', error);
      throw error;
    }
  }
};

// Itinerary Days API (enhanced with new specific endpoints)
export const itineraryDaysAPI = {
  // Using generic endpoints
  getByItinerary: (itineraryId) => fetchData('itinerary_days', 'day_number ASC', { itinerary_id: itineraryId }),
  
  create: (dayData) => insertData('itinerary_days', dayData),
  
  update: (id, dayData) => updateData('itinerary_days', dayData, { id }),
  
  delete: (id) => deleteData('itinerary_days', { id }),

  // Using specific endpoints
  getByItinerarySpecific: async (itineraryId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/itinerary-days/itinerary/${itineraryId}`, getHeaders());
      return response.data.data;
    } catch (error) {
      console.error('Get itinerary days error:', error);
      throw error;
    }
  }
};

// Itinerary Activities API (enhanced with new specific endpoints)
export const itineraryActivitiesAPI = {
  // Using generic endpoints
  getByDay: (dayId) => fetchData('itinerary_activities', 'time ASC', { itinerary_day_id: dayId }),
  
  create: (activityData) => insertData('itinerary_activities', activityData),
  
  update: (id, activityData) => updateData('itinerary_activities', activityData, { id }),
  
  delete: (id) => deleteData('itinerary_activities', { id }),

  // Using specific endpoints
  getByDaySpecific: async (dayId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/itinerary-activities/day/${dayId}`, getHeaders());
      return response.data.data;
    } catch (error) {
      console.error('Get itinerary activities error:', error);
      throw error;
    }
  }
};

// Packages API (enhanced with new specific endpoints)
export const packagesAPI = {
  // Using generic endpoints
  getAll: (userId = null) => {
    const where = userId ? { user_id: userId } : null;
    return fetchData('packages', 'created_at DESC', where);
  },
  
  create: (packageData) => insertData('packages', packageData),
  
  update: (id, packageData) => updateData('packages', packageData, { id }),
  
  delete: (id) => deleteData('packages', { id }),
  
  getById: (id) => fetchData('packages', null, { id }),
  
  getActive: () => fetchData('packages', 'created_at DESC', { status: 'active' }),

  // Using specific endpoints
  getActiveSpecific: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/packages/active`, getHeaders());
      return response.data.data;
    } catch (error) {
      console.error('Get active packages error:', error);
      throw error;
    }
  }
};

// Inquiries API (enhanced with new specific endpoints)
export const inquiriesAPI = {
  // Using generic endpoints
  getAll: (assignedTo = null) => {
    const where = assignedTo ? { assigned_to: assignedTo } : null;
    return fetchData('inquiries', 'created_at DESC', where);
  },
  
  create: (inquiryData) => insertData('inquiries', inquiryData),
  
  update: (id, inquiryData) => updateData('inquiries', inquiryData, { id }),
  
  delete: (id) => deleteData('inquiries', { id }),
  
  getByStatus: (status) => fetchData('inquiries', 'created_at DESC', { status }),

  // Using specific endpoints
  getByStatusSpecific: async (status) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/inquiries/status/${status}`, getHeaders());
      return response.data.data;
    } catch (error) {
      console.error('Get inquiries by status error:', error);
      throw error;
    }
  }
};

// Bookings API (enhanced with new specific endpoints)
export const bookingsAPI = {
  // Using generic endpoints
  getAll: (userId = null) => {
    const where = userId ? { user_id: userId } : null;
    return fetchData('bookings', 'created_at DESC', where);
  },
  
  create: (bookingData) => insertData('bookings', bookingData),
  
  update: (id, bookingData) => updateData('bookings', bookingData, { id }),
  
  delete: (id) => deleteData('bookings', { id }),
  
  getByStatus: (status) => fetchData('bookings', 'created_at DESC', { status }),

  // Using specific endpoints
  getByStatusSpecific: async (status) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bookings/status/${status}`, getHeaders());
      return response.data.data;
    } catch (error) {
      console.error('Get bookings by status error:', error);
      throw error;
    }
  }
};

// Payments API (enhanced with new specific endpoints)
export const paymentsAPI = {
  // Using generic endpoints
  getByBooking: (bookingId) => fetchData('payments', 'date DESC', { booking_id: bookingId }),
  
  create: (paymentData) => insertData('payments', paymentData),
  
  update: (id, paymentData) => updateData('payments', paymentData, { id }),
  
  delete: (id) => deleteData('payments', { id }),

  // Using specific endpoints
  getByBookingSpecific: async (bookingId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/booking/${bookingId}`, getHeaders());
      return response.data.data;
    } catch (error) {
      console.error('Get payments by booking error:', error);
      throw error;
    }
  }
};

// Agent Wallets API (enhanced with new specific endpoints)
export const agentWalletsAPI = {
  // Using generic endpoints
  getByUser: (userId) => fetchData('agent_wallets', 'created_at DESC', { user_id: userId }),
  
  create: (walletData) => insertData('agent_wallets', walletData),
  
  getBalance: async (userId) => {
    const transactions = await fetchData('agent_wallets', 'created_at DESC', { user_id: userId });
    return transactions.length > 0 ? transactions[0].balance_after : 0;
  },

  // Using specific endpoints
  getByUserSpecific: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/agent-wallets/user/${userId}`, getHeaders());
      return response.data.data;
    } catch (error) {
      console.error('Get agent wallets error:', error);
      throw error;
    }
  },

  getBalanceSpecific: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/agent-wallets/balance/${userId}`, getHeaders());
      return response.data.balance;
    } catch (error) {
      console.error('Get agent wallet balance error:', error);
      throw error;
    }
  }
};

// Utility functions for common operations
export const utilityAPI = {
  // Health check
  healthCheck: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  },

  // Bulk operations
  bulkInsert: async (tablename, dataArray) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/bulk/${tablename}`, dataArray, getHeaders());
      return response.data;
    } catch (error) {
      console.error('Bulk insert error:', error);
      throw error;
    }
  },

  // Export data
  exportData: async (tablename, format = 'json') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/export/${tablename}?format=${format}`, getHeaders());
      return response.data;
    } catch (error) {
      console.error('Export data error:', error);
      throw error;
    }
  }
};

// Migration helper - use this to gradually switch from generic to specific endpoints
export const migrationHelper = {
  // Example: Switch users API from generic to specific
  switchUsersToSpecific: () => {
    console.log('Switching users API to use specific endpoints for better performance...');
    // You can gradually replace usersAPI methods with usersAPI.methodSpecific
  },
  
  // Test both generic and specific endpoints
  testEndpoint: async (entityName, id = null) => {
    try {
      console.log(`Testing ${entityName} endpoints...`);
      
      // Test generic endpoint
      const genericResult = await fetchData(entityName, 'id DESC');
      console.log(`Generic endpoint result:`, genericResult);
      
      // Test specific endpoint if available
      const specificUrl = `${API_BASE_URL}/${entityName.replace('_', '-')}`;
      const specificResult = await axios.get(specificUrl, getHeaders());
      console.log(`Specific endpoint result:`, specificResult.data);
      
      return { generic: genericResult, specific: specificResult.data };
    } catch (error) {
      console.error(`Test endpoint error for ${entityName}:`, error);
      throw error;
    }
  }
};

export default {
  insertData,
  fetchData,
  updateData,
  deleteData,
  usersAPI,
  itinerariesAPI,
  itineraryDaysAPI,
  itineraryActivitiesAPI,
  packagesAPI,
  inquiriesAPI,
  bookingsAPI,
  paymentsAPI,
  agentWalletsAPI,
  utilityAPI,
  migrationHelper
};
