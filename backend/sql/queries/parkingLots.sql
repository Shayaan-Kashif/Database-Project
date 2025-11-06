-- name: GetParkingLots :many
SELECT *
FROM parkinglots;

-- name: CreateParkingLot :one
INSERT INTO parkinglots(id, name, slots, occupiedslots)
VALUES (
    gen_random_uuid(),
    $1,
    $2,
    0
)
RETURNING *;