-- +goose Up
CREATE TABLE reviews(
    user_id UUID NOT NULL,
    parking_lot_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    score INT CHECK (score> 0 AND score <= 5),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parking_lot_id) REFERENCES parkinglots(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, parking_lot_id)
);


-- +goose Down
DROP TABLE reviews;