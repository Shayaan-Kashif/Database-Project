-- +goose Up
CREATE TABLE users(
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role TEXT CHECK (role in('admin', 'user')) NOT NULL,
    parking_lot_id UUID,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (parking_lot_id) REFERENCES parkinglots(id) ON DELETE SET NULL
);




-- +goose Down
DROP TABLE users;