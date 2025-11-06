-- +goose Up
CREATE TABLE parking_logs(
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    parking_lot_id UUID NOT NULL,
    event_type TEXT CHECK (event_type in ('entry', 'exit')) NOT NULL,
    time TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parking_lot_id) REFERENCES parkinglots(id) ON DELETE CASCADE
);



-- +goose Down
DROP TABLE parking_logs;