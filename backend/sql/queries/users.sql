-- name: CreateUser :one
INSERT INTO users(id, name, email, hashed_password, role, parking_lot_id, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    $1,
    $2,
    $3,
    $4,
    NULL,
    NOW(),
    NOW()
)
RETURNING id, name, email, role;

-- name: GetUserFromEmail :one
SELECT * FROM users
WHERE email = $1;


-- name: GetUserFromID :one
SELECT * FROM users
WHERE id  = $1; 

-- name: UpdateUserParkingLot :exec
UPDATE users
SET parking_lot_id = $1
WHERE id = $2;


