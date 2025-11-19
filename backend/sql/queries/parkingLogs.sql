-- name: CreateLog :one
INSERT INTO parking_logs(id, user_id, parking_lot_id, event_type, time)
VALUES (
    gen_random_uuid(),
    $1,
    $2,
    $3,
    NOW()
) RETURNING *;

-- name: GetLogs :many
SELECT * FROM parking_logs;

-- name: GetLogsFromUserID :many
SELECT *
FROM parking_logs
WHERE user_id = $1;

-- name: GetLogsFromLotID :many
SELECT *
FROM parking_logs
WHERE parking_lot_id = $1
ORDER BY time ASC;