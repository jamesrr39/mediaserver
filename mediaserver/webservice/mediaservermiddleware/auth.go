package mediaservermiddleware

import (
	"context"
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

			userID, err := getUserIDFromRequest(r, hmacSecret)
			if err != nil {
				switch e := err.Error.(type) {
				case errorsx.Error:
					errorsx.HTTPError(w, logger, errorsx.Wrap(e), err.ResponseCode)
					return
				default:
					http.Error(w, e.Error(), err.ResponseCode)
					return
				}
			}

			ctx = context.WithValue(ctx, gotoken.TokenAccountIDCtxKey, userID)

			r = r.WithContext(ctx)

			next.ServeHTTP(w, r)
		}

		return http.HandlerFunc(fn)
	}
}

func getUserIDFromRequest(r *http.Request, hmacSecret []byte) (int64, *errType) {
	cookie, err := r.Cookie(authTokenCookieName)
	if err != nil {
		if errorsx.Cause(err) == http.ErrNoCookie {
			return 0, &errType{http.ErrNoCookie, http.StatusUnauthorized}
		}
		return 0, &errType{errorsx.Wrap(err), http.StatusInternalServerError}
	}

	if cookie.Expires.After(time.Now()) {
		return 0, &errType{errorsx.Wrap(err), http.StatusUnauthorized}
	}

	token, err := jwt.Parse(cookie.Value, func(token *jwt.Token) (interface{}, error) {
		// Don't forget to validate the alg is what you expect:
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errorsx.Errorf("Unexpected signing method: %v", token.Header["alg"])
		}

		return hmacSecret, nil
	})
	if err != nil {
		return 0, &errType{errorsx.Wrap(err), http.StatusUnauthorized}
	}

	if !token.Valid {
		return 0, &errType{errorsx.Wrap(err), http.StatusUnauthorized}
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, &errType{errorsx.Wrap(err), http.StatusBadRequest}
	}

	// float64 -> int64
	userID := int64(claims[gotoken.JwtAccountIDKey].(float64))
	return userID, nil
}
