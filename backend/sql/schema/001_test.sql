-- +goose Up
CREATE TABLE tests(
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);



-- +goose Down
DROP TABLE tests;