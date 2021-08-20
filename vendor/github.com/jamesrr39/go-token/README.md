# go-token

go-token is a package (and sub-packages) providing functions for getting up and running with long-term access tokens.

try it out with the [./examples](examples) folder, e.g.: `go run examples/simple_no_db/simple-no-db-main.go`

## For root tokens (one "master" token)

- [./scripts/create-root-token/create-root-token-main.go](Small program) to generate a base64-encoded root token and the base64 encoded hash for it
- It provides a middleware for authorizing root tokens

## For auth tokens (many tokens)

- Web service to create auth tokens
- Middleware for authorizing token
- Helper functions for retrieving token ID and account ID from the request context
