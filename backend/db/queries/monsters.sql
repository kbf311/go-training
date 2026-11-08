-- name: GetMonsterByID :one
SELECT id, name, element, rarity, habitats, hp, attack, description
FROM monsters
WHERE id = ?
LIMIT 1;

-- name: CreateMonster :one
INSERT INTO monsters (name, element, rarity, habitats, hp, attack, description)
VALUES (?, ?, ?, ?, ?, ?, ?)
RETURNING id, name, element, rarity, habitats, hp, attack, description;

-- name: UpdateMonster :exec
UPDATE monsters
SET name = ?,
    element = ?,
    rarity = ?,
    habitats = ?,
    hp = ?,
    attack = ?,
    description = ?
WHERE id = ?;

-- name: DeleteMonster :exec
DELETE FROM monsters
WHERE id = ?;

-- name: DeleteAllMonsters :exec
DELETE FROM monsters;

-- name: CountMonsters :one
SELECT COUNT(*) FROM monsters;

