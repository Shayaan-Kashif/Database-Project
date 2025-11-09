-- name: GetReviewsFromLotID :many
SELECT *
FROM user_reviews_with_lot 
WHERE lotid = $1;