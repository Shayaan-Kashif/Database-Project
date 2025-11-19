# ParkingGO – REST API Documentation

This document describes every API endpoint, including:

- JSON request structure  
- JSON responses  
- Error responses  
- Path parameters  
- Authentication rules  
- Validation logic enforced by the backend  

All code blocks are intentionally written as plain text.

---

## Base URL
```
http://localhost:8080
```

---

# 1. Health Check

## GET /api/health
Response:
```
{
    "status": "the server is running fine"
}
```

---

# 2. Test Database

## POST /api/testDB
Response:
```
{
    "message": "the test db works"
}
```

---

# 3. User Registration

## POST /api/users

Request JSON:
```
{
    "email": "example@gmail.com",
    "password": "examplepassword",
    "name": "John Doe",
    "adminCode": "optional string"
}
```

Validation:
- email, password, name must NOT be null  
- adminCode:
  - If matches ADMINCODE → admin
  - If wrong but provided → Unauthorized  

Response (201):
```
{
    "name": "John Doe",
    "email": "example@gmail.com",
    "role": "user" or "admin"
}
```

---

# 4. Login

## POST /api/login

Request:
```
{
    "email": "example@gmail.com",
    "password": "examplepassword"
}
```

Success:
```
{
    "access_token": "<jwt>",
    "name": "John Doe"
    "role": "user" or "admin"
}
```

Refresh token cookie set:
refresh_token=<token>; HttpOnly; SameSite=None; Path=/api/refresh; Max-Age=3600

---

# 5. Refresh Access Token

## POST /api/refresh

Success:
```
{
    "access_token": "<new-jwt>"
}
```

---

# 6. Get Parking Lots

## GET /api/parkingLots
```
[
    {
        "id": "uuid",
        "name": "Lot A",
        "slots": 50,
        "ocupiedSlots": 23
    }
]
```

---

# 7. Create Parking Lot (Admin Only)

## POST /api/parkingLots

Request:
```
{
    "name": "Lot A",
    "slots": 50
}
```

Response:
```
{
    "id": "uuid",
    "name": "Lot A",
    "slots": 50,
    "occupiedSlots": 0
}
```

---

# 8. Create Review

## POST /api/reviews

Request:
```
{
    "parkingLotID": "uuid",
    "title": "Great lot",
    "description": "optional text",
    "score": 4
}
```

Response:
```
{
    "status": "Review created"
}
```

---

# 9. Modify Review

## PATCH /api/reviews/{lotID}

Request:
```
{
    "title": "Updated title",
    "description": "Updated description",
    "score": 5
}
```

Response:
```
{
    "status": "The review has been modified"
}
```

---

# 10. Get Reviews for a Lot

## GET /api/reviews/{lotID}

Response:
```
[
    {
        "userID": "uuid",
        "username": "John Doe",
        "lotID": "uuid",
        "lotName": "Lot A",
        "title": "Great place",
        "description": {"String":"text","Valid":true},
        "score": 5,
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
    }
]
```

---

# 11. Top Rated Lots

## GET /api/topRatedLots
```
[
    {
        "id": "uuid",
        "name": "Lot A",
        "avgScore": "4.7"
    }
]
```

---

# 12. Average Time Parked

## GET /api/avgTimeParked
```
{
    "name": "John Doe",
    "avgMinutesParked": "42"
}
```

---

# 13. Count of Logs Per User

## GET /api/countOfLogsPerUser
```
[
    {
        "id": "uuid",
        "name": "John Doe",
        "totalEntries": 14
    }
]
```

---

# 14. Highest & Lowest Reviews

## GET /api/highestLowestRatings
```
[
    {
        "userID": "uuid",
        "username": "John Doe",
        "lotID": "uuid",
        "lotName": "Lot A",
        "title": "Great",
        "description": {"String":"Nice","Valid":true},
        "score": 5,
        "createdAt": "timestamp",
        "updatedAt": "timestamp",
        "reviewType": "highest"
    }
]
```

---

# 15. Average Rating for a Lot

## GET /api/averageLotRating/{lotID}
```
{
    "averageRating": "4.5",
    "totalReviewCount": 12
}
```

---

# 16. Reviews per User

## GET /api/countOfReviewsPerUser
```
[
    {
        "id": "uuid",
        "name": "John Doe",
        "totalReviews": 3
    }
]
```

---

# 17. Reviews per Lot

## GET /api/countOfReviewsPerLot
```
[
    {
        "id": "uuid",
        "name": "Lot A",
        "totalReviews": 10
    }
]
```

---

# 18. Logs per Lot

## GET /api/countOfLogsPerLot
```
[
    {
        "id": "uuid",
        "name": "Lot A",
        "totalEntries": 120
    }
]
```

---

# 19. Full Parking Lots

## GET /api/fullLots
```
[
    {
        "id": "uuid",
        "name": "Lot C",
        "slots": 40,
        "occupiedSlots": 40
    }
]
```

---

# 20. Park / Unpark User

## POST /api/park

Request:
```
{
    "parkingLotID": "uuid",
    "type": "entry" or "exit"
}
```

Response:
```
{
    "status": "accepted parking status"
}
```

---

# 21. Get Lot Data From ID

## GET /api/parkingLots/{lotID}

```
{
    "id": "uuid",
    "name": "Lot C",
    "slots": 40,
    "occupiedSlots": 40
}
```

---

# 22. Get Logs For User

## GET /api/parkingLogs

```
[
    {
        "id": "uuid",
        "userID": "uuid",
        "parkingLotID": "uuid",
        "eventType": "entry" or "exit"
        "time": "timestamp"
    }
]
```

---

# 23. Get User From JWT

## GET /api/user

```

{
    "id": "uuid",
    "name": "Will",
    "email": "will@test.com",
    "role": "admin" or "user",
    "parkingLotID": "uuid",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
}

```

---

# 24. Get All Users (Admin Only)

## GET /api/user

```
[
    {
        "id": "uuid",
        "name": "Will",
        "email": "will@test.com",
        "role": "admin" or "user",
        "parkingLotID": "uuid",
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
    }
]
```

---

# 25. Get All Logs (Admin Only)

## GET /api/parkingLogsAll

```
[
    {
        "id": "uuid",
        "userID": "uuid",
        "parkingLotID": "uuid",
        "eventType": "entry" or "exit"
        "time": "timestamp"
    }
]
```

---

# 26. Get ParkingLot History

## GET /api/parkingHistory/{lotID}

```
[
    {
        "date": "YYYY-MM-DD",
        "entries": 3
    }
]
```

---

# 27. Delete Review

## DELETE /api/reviews

Request:
```
{
    "userID": "uuid",
    "lotID": "uuid"
}
```

Response:
```
{
    "status": "The review has been deleted"
}
```

---

# 28. Delete User

## DELETE /api/user

```
{
    "status": "The user has been deleted"
}
```

---

# 29. Update User (At minimum one element in the request is required)

## DELETE /api/user

Request:
```
{
    "name": "Will", - Optional
    "email": "something@example.com", - Optional
    "password": "test" - Optional
}
```

Response:
```
{
    "status": "The user has been updated"
}
```

---

