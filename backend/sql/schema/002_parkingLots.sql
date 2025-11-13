-- +goose Up
CREATE TABLE parkingLots(
    id UUID PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slots INT NOT NULL,
    occupiedSlots INT CHECK(occupiedSlots <= slots) NOT NULL
);



-- +goose Down
DROP TABLE parkingLots;