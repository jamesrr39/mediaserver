package mediaservermiddleware

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/dgrijalva/jwt-go"
	gotoken "github.com/jamesrr39/go-token"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logpkg"
)

type errType struct {
	Error        error
	ResponseCode int
}

const authTokenCookieName = "authtoken"

func NewAuthMiddleware(logger *logpkg.Logger, hmacSecret []byte) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		fn := func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()

			userID, err := GetUserIDFromRequest(r, hmacSecret)
			if err != nil {
				if errorsx.Cause(err) == ErrNoOrExpiredToken {
					http.Error(w, err.Error(), http.StatusUnauthorized)
					return
				}
				errorsx.HTTPJSONError(w, logger, errorsx.Wrap(err), http.StatusInternalServerError)
				return
			}

			ctx = context.WithValue(ctx, gotoken.TokenAccountIDCtxKey, userID)

			r = r.WithContext(ctx)

			next.ServeHTTP(w, r)
		}

		return http.HandlerFunc(fn)
	}
}

var ErrNoOrExpiredToken = errors.New("ErrNoOrExpiredToken")

// GetUserIDFromRequest returns the user ID or an error, either ErrNoOrExpiredToken, or a different unexpected error
func GetUserIDFromRequest(r *http.Request, hmacSecret []byte) (int64, error) {
	cookie, err := r.Cookie(authTokenCookieName)
	if err != nil {
		if errorsx.Cause(err) == http.ErrNoCookie {
			return 0, ErrNoOrExpiredToken
		}
		return 0, errorsx.Wrap(err)
	}

	if cookie.Expires.After(time.Now()) {
		return 0, ErrNoOrExpiredToken
	}

	token, err := jwt.Parse(cookie.Value, func(token *jwt.Token) (interface{}, error) {
		// Don't forget to validate the alg is what you expect:
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errorsx.Errorf("Unexpected signing method: %v", token.Header["alg"])
		}

		return hmacSecret, nil
	})
	if err != nil {
		return 0, errorsx.Wrap(err)
	}

	if !token.Valid {
		return 0, errorsx.Wrap(err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, errorsx.Wrap(err)
	}

	// MapClaims stores numbers as float64. Convert to int64 for userID.
	userID := int64(claims[gotoken.JwtAccountIDKey].(float64))
	return userID, nil
}
