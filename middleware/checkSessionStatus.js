// auth.js

import axios from 'axios';

const checkSessionStatus = async () => {
  try {
    const response = await axios.get('/api/checkSession'); // Change the endpoint as needed
    return response.status; // Return the HTTP status code
  } catch (error) {
    return error.response.status; // Return the error status code
  }
};

export default checkSessionStatus;
