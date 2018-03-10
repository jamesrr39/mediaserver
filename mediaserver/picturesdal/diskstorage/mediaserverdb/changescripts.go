package mediaserverdb

var createDBSQL = `
CREATE TABLE IF NOT EXISTS db_state (
  version int
);
`

var changescripts = []string{`
CREATE TABLE IF NOT EXISTS pictures_metadatas (
  hash string,
  file_size_bytes int64,
  exif_data_json string,
  raw_size_width int,
  raw_size_height int,
  format string
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pictures_metadatas_unique_hash ON pictures_metadatas (hash);
`}
