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

-- name: GetHighestLowestRatingsFromUserID :many
SELECT *
FROM user_highest_lowest_ratings
WHERE userid = $1;

-- name: GetAverageLotRatingFromID :one
SELECT *
FROM average_lot_ratings
WHERE lotid = $1;

-- name: GetCountOfLogsPerLot :many
SELECT *
FROM count_of_logs_per_lot;

-- name: GetCountOfReviewsPerUser :many
SELECT *
FROM count_of_reviews_per_user;

-- name: GetCountOfReviewsPerLot :many
SELECT *
FROM count_of_review_per_lot;

-- name: GetFullLots :many
SELECT *
FROM full_parking_lots;