# Team Invitation System Documentation

This document outlines the API endpoints and workflows for managing team invitations and members within the task management system.

## Authentication

All endpoints require authentication using a JWT token in the Authorization header.

## API Endpoints

### 1. Get Company Employees

```http
GET /companies/:companyId/employees
```

Retrieve all employees for a specific company.

#### Authorization
- Company owner
- Company members

#### Response
```json
[
  {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "admin"
  }
]
```

### 2. Get Company Invitations

```http
GET /companies/:companyId/invitations
```

Retrieve all pending invitations for a company.

#### Authorization
- Company owner only

#### Response
```json
[
  {
    "_id": "invitation_id",
    "company": "company_id",
    "email": "invite@example.com",
    "role": "member",
    "status": "pending",
    "invitedBy": {
      "_id": "user_id",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com"
    }
  }
]
```

### 3. Create Invitation

```http
POST /invitations
```

Create a new invitation to join a company.

#### Authorization
- Company owner only

#### Request Body
```json
{
  "companyId": "company_id",
  "email": "invite@example.com",
  "role": "member"
}
```

#### Response
```json
{
  "_id": "invitation_id",
  "company": "company_id",
  "email": "invite@example.com",
  "role": "member",
  "status": "pending",
  "invitedBy": {
    "_id": "user_id",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com"
  }
}
```

### 4. Accept Invitation

```http
POST /invitations/:id/accept
```

Accept a pending invitation to join a company.

#### Authorization
- Invited user only (matching email)

#### Response
```json
{
  "message": "Invitation accepted successfully"
}
```

### 5. Reject Invitation

```http
POST /invitations/:id/reject
```

Reject a pending invitation to join a company.

#### Authorization
- Invited user only (matching email)

#### Response
```json
{
  "message": "Invitation rejected successfully"
}
```

### 6. Cancel Invitation

```http
DELETE /invitations/:id
```

Cancel a pending invitation.

#### Authorization
- Company owner only

#### Response
```json
{
  "message": "Invitation cancelled successfully"
}
```

### 7. Update Team Member Role

```http
PATCH /companies/:companyId/members/:userId/role
```

Update the role of an existing team member.

#### Authorization
- Company owner only

#### Request Body
```json
{
  "role": "admin"
}
```

#### Response
```json
{
  "message": "Team member role updated successfully"
}
```

### 8. Remove Team Member

```http
DELETE /companies/:companyId/members/:userId
```

Remove a team member from the company.

#### Authorization
- Company owner only

#### Response
```json
{
  "message": "Team member removed successfully"
}
```

## Workflow

1. **Inviting a Team Member**
   - Company owner creates an invitation using the Create Invitation endpoint
   - System saves the invitation with "pending" status
   - Invited email receives notification (if email service is configured)

2. **Viewing Invitations**
   - Users can see their pending invitations upon login
   - Pending invitations include company name and offered role
   - Users can also check invitations through the Get Invitations endpoint

3. **Accepting/Rejecting an Invitation**
   - Invited user accepts or rejects the invitation using respective endpoints
   - On acceptance:
     - User is added to company members
     - User's companies list is updated
     - User gains immediate access to company resources
     - Invitation status changes to "accepted"
   - On rejection:
     - Invitation status changes to "rejected"
     - Company owner is notified of rejection

4. **Managing Team Members**
   - Company owner can:
     - View all employees
     - Update member roles
     - Remove members (except company owner)
     - View invitation history
   - Team members can:
     - View other team members
     - Access company resources based on their role

## Error Handling

The API returns appropriate HTTP status codes:

- 200: Success
- 201: Resource created
- 400: Bad request
- 403: Unauthorized access
- 404: Resource not found
- 500: Server error

## Notes

- All endpoints require authentication
- Company owners have full access to manage team members and invitations
- Team members can only view other team members
- Invitations can only be accepted by users with matching email addresses
- Company owners cannot be removed from their companies
- Users can view their pending invitations upon login
- Invitation status can be: 'pending', 'accepted', or 'rejected'
- Users automatically gain access to company resources upon accepting an invitation