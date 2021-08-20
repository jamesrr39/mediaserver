package gotoken

import (
	"context"
	"net/http"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logpkg"
)

const (
	JwtIDKey        = "id"
	JwtAccountIDKey = "account"
	JwtRoleIDsKey   = "roles"
)

type Token struct {
	// ID of the token (if required)
	ID int64
	// ID of the "account" the token belongs to (probably creaated by)
	// This could be e.g. a user ID, or an organisation ID
	AccountID int64
	Name      string
	// RoleIDs the token has. This can be used the user has access to the endpoint they are trying to access
	RoleIDs   []int64
	CreatedAt time.Time
}

func NewToken(id, accountID int64, name string, roleIDs []int64, createdAt time.Time) *Token {
	return &Token{id, accountID, name, roleIDs, createdAt}
}

func (token *Token) ToJWTToken(hmacSecret []byte) (string, errorsx.Error) {
	roleIDs := token.RoleIDs
	if roleIDs == nil {
		roleIDs = []int64{}
	}
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		JwtIDKey:        token.ID,
		JwtAccountIDKey: token.AccountID,
		JwtRoleIDsKey:   roleIDs,
		"nbf":           token.CreatedAt.Unix(),
	})
	tokenString, err := jwtToken.SignedString(hmacSecret)
	if err != nil {
		return "", errorsx.Wrap(err)
	}

	return tokenString, nil
}

// CheckHasRole checks if a user has a given role. It returns a boolean: if the execution should continue or not.
// If the user doesn't have the  role it, logs to the logger and returns 403.
// If there is any other error, it returns 500
func CheckHasRole(ctx context.Context, logger *logpkg.Logger, w http.ResponseWriter, r *http.Request, roleID int64) bool {
	hasRole, err := HasRoleID(ctx, roleID)
	if err != nil {
		errorsx.HTTPError(w, logger, errorsx.Wrap(err), http.StatusInternalServerError)
		return false
	}

	if !hasRole {
		errorsx.HTTPError(w, logger, errorsx.Errorf("token does not have role %d", roleID), http.StatusUnauthorized)
		return false
	}

	return true
}
