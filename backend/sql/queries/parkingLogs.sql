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


