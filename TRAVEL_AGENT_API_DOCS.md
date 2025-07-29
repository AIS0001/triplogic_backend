# Travel Agent API Documentation

## Overview
This document describes the backend API routes that match your frontend travel agent application structure. All routes follow the existing patterns and use the same controllers and middleware.

## Base URL
```
http://localhost:4402/api
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Generic API Functions

### Insert Data
**POST** `/insertdata/:tablename`
- **Description**: Generic insert function for any table
- **Parameters**: 
  - `tablename` (URL parameter): Name of the database table
- **Body**: Object containing the data to insert
- **Example**:
```javascript
POST /api/insertdata/users
{
  "name": "John Doe",
  "email": "john@example.com",
  "user_type": "agent"
}
```

### Fetch Data
**GET** `/fetchdata/:tablename/:orderby?/*?`
- **Description**: Generic fetch function with optional ordering and where conditions
- **Parameters**: 
  - `tablename` (URL parameter): Name of the database table
  - `orderby` (optional): Order by clause
  - `where` (optional): Where conditions as URL parameters
- **Example**:
```javascript
GET /api/fetchdata/users/created_at DESC/user_type=agent
```

### Update Data
**PUT** `/updatedata/:tablename`
- **Description**: Generic update function
- **Parameters**: 
  - `tablename` (URL parameter): Name of the database table
- **Body**:
```javascript
{
  "updatedFields": { "name": "Updated Name" },
  "where": { "id": 1 }
}
```

### Delete Data
**DELETE** `/deletedata/:tablename`
- **Description**: Generic delete function
- **Parameters**: 
  - `tablename` (URL parameter): Name of the database table
- **Body**:
```javascript
{
  "where": { "id": 1 }
}
```

## Specific API Endpoints

### Users API

#### Get All Users
**GET** `/users`
- **Query Parameters**:
  - `user_type` (optional): Filter by user type
- **Example**: `GET /api/users?user_type=agent`

#### Create User
**POST** `/users`
- **Body**: User data object

#### Update User
**PUT** `/users/:id`
- **Parameters**: `id` - User ID
- **Body**: Updated user data

#### Delete User
**DELETE** `/users/:id`
- **Parameters**: `id` - User ID

#### Get User by ID
**GET** `/users/:id`
- **Parameters**: `id` - User ID

---

### Itineraries API

#### Get All Itineraries
**GET** `/itineraries`
- **Query Parameters**:
  - `user_id` (optional): Filter by user ID
- **Example**: `GET /api/itineraries?user_id=123`

#### Create Itinerary
**POST** `/itineraries`
- **Body**: Itinerary data object

#### Update Itinerary
**PUT** `/itineraries/:id`
- **Parameters**: `id` - Itinerary ID
- **Body**: Updated itinerary data

#### Delete Itinerary
**DELETE** `/itineraries/:id`
- **Parameters**: `id` - Itinerary ID

#### Get Itinerary by ID
**GET** `/itineraries/:id`
- **Parameters**: `id` - Itinerary ID

#### Get Itineraries by Status
**GET** `/itineraries/status/:status`
- **Parameters**: `status` - Itinerary status (e.g., 'draft', 'confirmed', 'completed')

---

### Itinerary Days API

#### Get Days by Itinerary
**GET** `/itinerary-days/itinerary/:itineraryId`
- **Parameters**: `itineraryId` - Itinerary ID
- **Returns**: Days ordered by day_number ASC

#### Create Itinerary Day
**POST** `/itinerary-days`
- **Body**: Day data object

#### Update Itinerary Day
**PUT** `/itinerary-days/:id`
- **Parameters**: `id` - Day ID
- **Body**: Updated day data

#### Delete Itinerary Day
**DELETE** `/itinerary-days/:id`
- **Parameters**: `id` - Day ID

---

### Itinerary Activities API

#### Get Activities by Day
**GET** `/itinerary-activities/day/:dayId`
- **Parameters**: `dayId` - Day ID
- **Returns**: Activities ordered by time ASC

#### Create Activity
**POST** `/itinerary-activities`
- **Body**: Activity data object

#### Update Activity
**PUT** `/itinerary-activities/:id`
- **Parameters**: `id` - Activity ID
- **Body**: Updated activity data

#### Delete Activity
**DELETE** `/itinerary-activities/:id`
- **Parameters**: `id` - Activity ID

---

### Packages API

#### Get All Packages
**GET** `/packages`
- **Query Parameters**:
  - `user_id` (optional): Filter by user ID
- **Example**: `GET /api/packages?user_id=123`

#### Create Package
**POST** `/packages`
- **Body**: Package data object

#### Update Package
**PUT** `/packages/:id`
- **Parameters**: `id` - Package ID
- **Body**: Updated package data

#### Delete Package
**DELETE** `/packages/:id`
- **Parameters**: `id` - Package ID

#### Get Package by ID
**GET** `/packages/:id`
- **Parameters**: `id` - Package ID

#### Get Active Packages
**GET** `/packages/active`
- **Returns**: Packages with status = 'active'

---

### Inquiries API

#### Get All Inquiries
**GET** `/inquiries`
- **Query Parameters**:
  - `assigned_to` (optional): Filter by assigned user ID
- **Example**: `GET /api/inquiries?assigned_to=123`

#### Create Inquiry
**POST** `/inquiries`
- **Body**: Inquiry data object

#### Update Inquiry
**PUT** `/inquiries/:id`
- **Parameters**: `id` - Inquiry ID
- **Body**: Updated inquiry data

#### Delete Inquiry
**DELETE** `/inquiries/:id`
- **Parameters**: `id` - Inquiry ID

#### Get Inquiries by Status
**GET** `/inquiries/status/:status`
- **Parameters**: `status` - Inquiry status

---

### Bookings API

#### Get All Bookings
**GET** `/bookings`
- **Query Parameters**:
  - `user_id` (optional): Filter by user ID
- **Example**: `GET /api/bookings?user_id=123`

#### Create Booking
**POST** `/bookings`
- **Body**: Booking data object

#### Update Booking
**PUT** `/bookings/:id`
- **Parameters**: `id` - Booking ID
- **Body**: Updated booking data

#### Delete Booking
**DELETE** `/bookings/:id`
- **Parameters**: `id` - Booking ID

#### Get Bookings by Status
**GET** `/bookings/status/:status`
- **Parameters**: `status` - Booking status

---

### Payments API

#### Get Payments by Booking
**GET** `/payments/booking/:bookingId`
- **Parameters**: `bookingId` - Booking ID
- **Returns**: Payments ordered by date DESC

#### Create Payment
**POST** `/payments`
- **Body**: Payment data object

#### Update Payment
**PUT** `/payments/:id`
- **Parameters**: `id` - Payment ID
- **Body**: Updated payment data

#### Delete Payment
**DELETE** `/payments/:id`
- **Parameters**: `id` - Payment ID

---

### Agent Wallets API

#### Get Wallet Transactions by User
**GET** `/agent-wallets/user/:userId`
- **Parameters**: `userId` - User ID
- **Returns**: Wallet transactions ordered by created_at DESC

#### Create Wallet Transaction
**POST** `/agent-wallets`
- **Body**: Wallet transaction data object

#### Get User Wallet Balance
**GET** `/agent-wallets/balance/:userId`
- **Parameters**: `userId` - User ID
- **Returns**: Current wallet balance
- **Response**:
```javascript
{
  "success": true,
  "balance": 1500.00
}
```

## Frontend Integration

Your existing frontend API functions will work seamlessly with these backend routes. Here's how the mapping works:

### Frontend to Backend Mapping

```javascript
// Frontend API call
insertData('users', userData)
// Maps to: POST /api/insertdata/users

// Frontend API call
fetchData('users', 'created_at DESC', { user_type: 'agent' })
// Maps to: GET /api/fetchdata/users/created_at DESC/user_type=agent

// Frontend API call
updateData('users', { name: 'New Name' }, { id: 1 })
// Maps to: PUT /api/updatedata/users

// Frontend API call
deleteData('users', { id: 1 })
// Maps to: DELETE /api/deletedata/users
```

### Specific API Examples

```javascript
// Users API
usersAPI.getAll('agent')
// Maps to: GET /api/users?user_type=agent

// Itineraries API
itinerariesAPI.getByStatus('confirmed')
// Maps to: GET /api/itineraries/status/confirmed

// Agent Wallets API
agentWalletsAPI.getBalance(123)
// Maps to: GET /api/agent-wallets/balance/123
```

## Error Handling

All endpoints return consistent error responses:

### Success Response
```javascript
{
  "success": true,
  "data": [...],
  "message": "Operation completed successfully"
}
```

### Error Response
```javascript
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Notes
- All endpoints use your existing middleware (`auth.isAuthorize`)
- All endpoints use your existing controllers (`insertcontroller`, `viewcontroller`, `updatecontroller`, `deletecontroller`)
- The API maintains backward compatibility with your existing routes
- Date fields should be in ISO format
- All monetary values should be stored as decimal/float values
