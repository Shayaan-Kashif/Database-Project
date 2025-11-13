-- +goose Up
ALTER TABLE reviews
ALTER COLUMN score SET NOT NULL;




-- +goose Down
ALTER TABLE reviews
ALTER COLUMN score DROP NOT NULL;