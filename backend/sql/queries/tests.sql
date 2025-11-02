-- name: CreateTest :one
INSERT INTO tests(id, name, created_at, updated_at) 
VALUES (
    gen_random_uuid(),
    'this is a test',
    NOW(),
    NOW()
)
RETURNING *;