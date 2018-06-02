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
`, `
CREATE TABLE IF NOT EXISTS collections (
  name string,
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_unique_id ON collections (id());

CREATE TABLE IF NOT EXISTS join_pictures_hash_collections (
  picture_hash string,
  collection_id int64,
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_join_pictures_hash_collections_unique_id ON join_pictures_hash_collections (picture_hash, collection_id);
`}

// FIXME foreign keys
