-- name: GetUserByUsername :one
SELECT id, username, password
FROM users
WHERE username = ?
LIMIT 1;

-- name: CreateUser :exec
INSERT INTO users (username, password)
VALUES (?, ?);

-- name: CountUsers :one
SELECT COUNT(*) FROM users;

