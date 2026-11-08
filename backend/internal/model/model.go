package model

var (
	Elements = []string{"炎", "水", "風", "光", "闇"}
	Rarities = []int64{3, 4, 5}
	Habitats = []string{"草原", "洞窟", "魔王城"}
)

func IsValidElement(e string) bool {
	for _, el := range Elements {
		if el == e {
			return true
		}
	}
	return false
}

func IsValidRarity(r int64) bool {
	for _, rar := range Rarities {
		if rar == r {
			return true
		}
	}
	return false
}

func IsValidHabitat(h string) bool {
	for _, hab := range Habitats {
		if hab == h {
			return true
		}
	}
	return false
}

type MonsterResponse struct {
	ID          int64    `json:"id"`
	Name        string   `json:"name"`
	Element     string   `json:"element"`
	Rarity      int64    `json:"rarity"`
	Habitats    string   `json:"habitats"`
	HabitatList []string `json:"habitat_list"`
	Hp          int64    `json:"hp"`
	Attack      int64    `json:"attack"`
	Description string   `json:"description"`
}

type MonsterListResponse struct {
	Monsters   []MonsterResponse `json:"monsters"`
	Total      int64             `json:"total"`
	Page       int               `json:"page"`
	Limit      int               `json:"limit"`
	TotalPages int               `json:"total_pages"`
}

type MonsterPayload struct {
	Name        string   `json:"name"`
	Element     string   `json:"element"`
	Rarity      int64    `json:"rarity"`
	Habitats    []string `json:"habitats"`
	Hp          int64    `json:"hp"`
	Attack      int64    `json:"attack"`
	Description string   `json:"description"`
}

type UserResponse struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

