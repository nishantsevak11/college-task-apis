# Task Management API Documentation

## Base URL
`http://localhost:3000/api`

## Authentication
All endpoints (except authentication endpoints) require JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Authentication Endpoints

### Register User
**POST** `/auth/register`

**Description:** Register a new user account.

**Request Body:**
```json
{
  "email": "string (valid email)",
  "password": "string (min 6 characters)",
  "firstName": "string (required)",
  "lastName": "string (required)"
}
```

### Login
**POST** `/auth/login`

**Description:** Authenticate user and get JWT token. Also returns any pending company invitations and current company memberships.

**Request Body:**
```json
{
  "email": "string (valid email)",
  "password": "string (required)"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "string"
  },
  "pendingInvitations": [
    {
      "id": "string",
      "companyId": "string",
      "companyName": "string",
      "role": "string"
    }
  ],
  "companies": [
    {
      "id": "string",
      "name": "string"
    }
  ]
}
```

### Reset Password
**POST** `/auth/reset-password`

**Description:** Request password reset for an account.

**Request Body:**
```json
{
  "email": "string (valid email)"
}
```

## User Endpoints

### Get Current User
**GET** `/users/current`

**Description:** Get the profile and companies of the currently authenticated user.

**Response:**
```json
{
  "id": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "string",
  "companies": [
    {
      "company": {
        "_id": "string",
        "name": "string",
        "description": "string"
      },
      "role": "string"
    }
  ]
}
```

## Company Endpoints

### Get All Companies
**GET** `/companies`

**Description:** Get all companies where the authenticated user is a member.

**Response:**
```json
[
  {
    "_id": "string",
    "name": "string",
    "description": "string",
    "owner": {
      "_id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string"
    },
    "members": [
      {
        "user": {
          "_id": "string",
          "firstName": "string",
          "lastName": "string",
          "email": "string"
        },
        "role": "string"
      }
    ]
  }
]
```

### Get Company by ID
**GET** `/companies/:id`

**Description:** Get details of a specific company. Only accessible by company owner and members.

**Response:** Same as above but for a single company object.

### Create Company
**POST** `/companies`

**Description:** Create a new company. The authenticated user becomes the owner.

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string"
}
```

**Response:** Returns the created company object.

### Update Company
**PUT** `/companies/:id`

**Description:** Update company details. Only accessible by company owner.

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string"
}
```

**Response:** Returns the updated company object.

### Delete Company
**DELETE** `/companies/:id`

**Description:** Delete a company. Only accessible by company owner.

**Response:**
```json
{
  "message": "Company deleted successfully"
}
```

## Task Endpoints

### Get Tasks for a Company
**GET** `/tasks/company/:companyId`

**Description:** Retrieves all tasks for a specific company. Only accessible by company owner and members.

**Response:**
```json
[
  {
    "_id": "string",
    "title": "string",
    "description": "string",
    "status": "todo" | "in_progress" | "completed",
    "company": "string",
    "assignedTo": {
      "_id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string"
    },
    "createdBy": {
      "_id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string"
    },
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

### Get Single Task
**GET** `/tasks/:id`

**Description:** Retrieves details of a specific task. Only accessible by company owner and members.

**Response:** Same as above but for a single task object.

### Create Task
**POST** `/tasks`

**Description:** Creates a new task in a company. Only accessible by company owner and members.

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string",
  "companyId": "string (required)",
  "assignedTo": "string (user ID)"
}
```

**Response:** Returns the created task object.

### Update Task
**PUT** `/tasks/:id`

**Description:** Updates an existing task. Only accessible by company owner and members.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "status": "todo" | "in_progress" | "completed",
  "assignedTo": "string (user ID)"
}
```

**Response:** Returns the updated task object.

### Update Task Status
**PATCH** `/tasks/:id/status`

**Description:** Updates only the status of a task. Only accessible by company owner and members.

**Request Body:**
```json
{
  "status": "todo" | "in_progress" | "completed"
}
```

**Response:** Returns the updated task object.

### Delete Task
**DELETE** `/tasks/:id`

**Description:** Deletes a task. Only accessible by company owner and members.

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

## Comment Endpoints

### Get Comments for a Task
**GET** `/comments/task/:taskId`

**Description:** Retrieves all comments for a specific task. Only accessible by company owner and members.

**Response:**
```json
[
  {
    "_id": "string",
    "content": "string",
    "task": "string",
    "author": {
      "_id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string"
    },
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

### Create Comment
**POST** `/comments`

**Description:** Creates a new comment on a task. Only accessible by company owner and members.

**Request Body:**
```json
{
  "content": "string (required)",
  "taskId": "string (required)"
}
```

**Response:** Returns the created comment object.

### Update Comment
**PUT** `/comments/:id`

**Description:** Updates an existing comment. Only accessible by the comment author.

**Request Body:**
```json
{
  "content": "string (required)"
}
```

**Response:** Returns the updated comment object.

### Delete Comment
**DELETE** `/comments/:id`

**Description:** Deletes a comment. Only accessible by the comment author.

**Response:**
```json
{
  "message": "Comment deleted successfully"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Error message describing the validation error"
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "Unauthorized access"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found message"
}
```

### 500 Internal Server Error
```json
{
  "message": "Error message describing the server error"
}
```