package dbstatetracker

func NewDBStateTrackerForQLDB(logFunc LogFunc) *DBStateTracker {
	return &DBStateTracker{
		CreateVersionTableIfNotExistsSQL: "CREATE TABLE IF NOT EXISTS db_state (version int);",
		GetVersionSQL:                    "SELECT version FROM db_state;",
		InsertFirstVersionSQL:            "INSERT INTO db_state (version) VALUES (0);",
		UpdateVersionSQL:                 "UPDATE db_state SET version = $1;",
		LogFunc:                          logFunc,
	}
}
