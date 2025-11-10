-- name: GetReviewsFromLotID :many
SELECT *
FROM user_reviews_with_lot 
WHERE lotid = $1;

-- name: GetTopRatedLots :many
SELECT *
FROM top_rated_lot;

-- name: GetAverageParkingTimeFromUserID :one
SELECT *
FROM avg_parking_time_per_user
WHERE user_id = $1;

-- name: GetCountOfLogsPerUser :many
SELECT *
FROM count_of_logs_per_user;