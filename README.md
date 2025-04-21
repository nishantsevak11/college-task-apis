# Task Management API Documentation

This API provides endpoints for managing tasks, companies, teams, and user authentication. All API endpoints are prefixed with `/api`.

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register

Request Body:
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

Response: 201 Created
{
  "token": "jwt_token_here"
}
```

#### Login
```http
POST /api/auth/login

Request Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "token": "jwt_token_here"
}
```

#### Reset Password
```http
POST /api/auth/reset-password

Request Body:
{
  "email": "user@example.com"
}

Response: 200 OK
{
  "message": "Password reset instructions sent"
}
```

### User Endpoints

#### Get Current User
```http
GET /api/users/current

Response: 200 OK
{
  "id": "user_id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "companies": [
    {
      "company": {
        "id": "company_id",
        "name": "Company Name"
      },
      "role": "owner"
    }
  ]
}
```

### Company Endpoints

#### Get All Companies
```http
GET /api/companies

Response: 200 OK
[
  {
    "id": "company_id",
    "name": "Company Name",
    "description": "Company Description",
    "owner": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com"
    },
    "members": [...]
  }
]
```

#### Create Company
```http
POST /api/companies

Request Body:
{
  "name": "Company Name",
  "description": "Company Description"
}

Response: 201 Created
{
  "id": "company_id",
  "name": "Company Name",
  "description": "Company Description",
  "owner": "user_id"
}
```

#### Update Company
```http
PUT /api/companies/:id

Request Body:
{
  "name": "Updated Company Name",
  "description": "Updated Description"
}

Response: 200 OK
{
  "id": "company_id",
  "name": "Updated Company Name",
  "description": "Updated Description"
}
```

#### Delete Company
```http
DELETE /api/companies/:id

Response: 200 OK
{
  "message": "Company deleted successfully"
}
```

### Task Endpoints

#### Get Company Tasks
```http
GET /api/tasks/company/:companyId

Response: 200 OK
[
  {
    "id": "task_id",
    "title": "Task Title",
    "description": "Task Description",
    "status": "pending",
    "assignedTo": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com"
    },
    "createdBy": {
      "id": "user_id",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com"
    }
  }
]
```

#### Create Task
```http
POST /api/tasks

Request Body:
{
  "title": "Task Title",
  "description": "Task Description",
  "companyId": "company_id",
  "assignedTo": "user_id"
}

Response: 201 Created
{
  "id": "task_id",
  "title": "Task Title",
  "description": "Task Description",
  "status": "pending",
  "assignedTo": {...},
  "createdBy": {...}
}
```

#### Update Task Status
```http
PATCH /api/tasks/:id/status

Request Body:
{
  "status": "completed"
}

Response: 200 OK
{
  "id": "task_id",
  "status": "completed",
  ...
}
```

### Comment Endpoints

#### Get Task Comments
```http
GET /api/comments/task/:taskId

Response: 200 OK
[
  {
    "id": "comment_id",
    "content": "Comment content",
    "author": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com"
    },
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
]
```

#### Create Comment
```http
POST /api/comments

Request Body:
{
  "content": "Comment content",
  "taskId": "task_id"
}

Response: 201 Created
{
  "id": "comment_id",
  "content": "Comment content",
  "author": {...},
  "createdAt": "2023-01-01T00:00:00.000Z"
}
```

### Team Management

#### Get Company Employees
```http
GET /api/companies/:companyId/employees

Response: 200 OK
[
  {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "admin"
  }
]
```

#### Send Team Invitation
```http
POST /api/invitations

Request Body:
{
  "companyId": "company_id",
  "email": "newmember@example.com",
  "role": "member"
}

Response: 201 Created
{
  "id": "invitation_id",
  "email": "newmember@example.com",
  "role": "member",
  "status": "pending",
  "invitedBy": {...}
}
```

#### Accept Team Invitation
```http
POST /api/invitations/:id/accept

Response: 200 OK
{
  "message": "Invitation accepted successfully"
}
```

#### Reject Team Invitation
```http
POST /api/invitations/:id/reject

Response: 200 OK
{
  "message": "Invitation rejected successfully"
}
```

## Error Responses

The API uses conventional HTTP response codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Server Error

Error Response Format:
```json
{
  "message": "Error message here"
}
```