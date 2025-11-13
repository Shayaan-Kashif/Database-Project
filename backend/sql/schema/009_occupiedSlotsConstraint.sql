-- +goose Up
ALTER TABLE parkinglots
ADD CONSTRAINT nonnegative CHECK (occupiedSlots >= 0);





-- +goose Down
ALTER TABLE parkinglots
DROP CONSTRAINT nonnegative;