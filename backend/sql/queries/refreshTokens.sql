-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens(token, user_id, expires_at, revoked_at)
VALUES(
    $1,
    $2,
    $3,
    NULL
) RETURNING *;


-- name: GetRefreshToken :one
SELECT refresh_tokens.*, users.role FROM refresh_tokens
INNER JOIN users ON refresh_tokens.user_id = users.id 
WHERE refresh_tokens.token = $1;

-- name: RevokeToken :exec
UPDATE refresh_tokens
SET revoked_at = NOW()
WHERE token = $1;
