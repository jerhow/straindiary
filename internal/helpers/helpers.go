package helpers

func Strain_GET_SortOrderQsParams(sortByRaw string, orderByRaw string) (string, string) {
	var sortBySQL, orderBySQL string
	var found bool = false

	// defaults if missing
	if sortByRaw == "" {
		sortByRaw = "1"
	}
	if orderByRaw == "" {
		orderByRaw = "0"
	}

	// The only allowable values and their corresponding SQL table fields
	sortByMap := map[string]string{
		"0": "id",
		"1": "strain_name",
		"2": "created_at",
	}

	if sortBySQL, found = sortByMap[sortByRaw]; !found {
		sortBySQL = "strain_name" // default if not found in the map
	}

	if orderByRaw == "1" {
		orderBySQL = "DESC"
	} else { // 0 or default (in case the value happens to be anything else)
		orderBySQL = "ASC"
	}

	return sortBySQL, orderBySQL

}
