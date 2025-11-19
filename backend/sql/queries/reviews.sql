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


-- name: UpdateReview :exec
UPDATE reviews
SET 
title = $1,
description = $2,
score = $3,
updated_at = NOW()
WHERE user_id = $4 AND parking_lot_id = $5;

-- name: GetReviewByID :one
SELECT * FROM reviews
WHERE user_id = $1 AND parking_lot_id = $2;

-- name: DeleteReview :execresult
DELETE FROM reviews
WHERE user_id = $1 AND parking_lot_id = $2;