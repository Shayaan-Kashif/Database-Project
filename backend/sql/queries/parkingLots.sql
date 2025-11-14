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

-- name: UpdateOccupiedSlot :exec
UPDATE parkinglots
SET occupiedSlots = occupiedSlots + $1
WHERE id = $2;

-- name: GetParkingLotFromID :one
SELECT *
FROM parkinglots
WHERE id = $1;