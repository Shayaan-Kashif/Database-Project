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

