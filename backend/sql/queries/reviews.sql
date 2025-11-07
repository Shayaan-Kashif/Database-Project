-- name: CreateReview :one
INSERT INTO reviews(user_id, parking_lot_id, title, description, score, created_at, updated_at)
VALUES(
    $1,
    $2,
    $3,
    $4,
    $5,
    NOW(),
    NOW()
) RETURNING *;