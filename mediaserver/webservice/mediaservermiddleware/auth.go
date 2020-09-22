package mediaservermiddleware

import (
	"fmt"
	"mediaserver/mediaserver/domain"
	"net/http"
	"strings"

	"github.com/dgrijalva/jwt-go"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logpkg"
)

func AuthMiddleware(signingSecret []byte, logger *logpkg.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {

		fn := func(w http.ResponseWriter, r *http.Request) {
			tokenString := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
			if tokenString == "" {
				// FIXME: disallow, due to token being saved in logs.
				// For websockets, generate one-time-tokens instead
				tokenString = r.URL.Query().Get("token")
			}

			if tokenString == "" {
				errorsx.HTTPError(w, logger, errorsx.Errorf("no token supplied"), http.StatusUnauthorized)
				return
			}

			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				// Don't forget to validate the alg is what you expect:
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
				}

				// hmacSampleSecret is a []byte containing your secret, e.g. []byte("my_secret_key")
				return signingSecret, nil
			})
			if err != nil {
				errorsx.HTTPError(w, logger, errorsx.Wrap(err), http.StatusInternalServerError)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok || !token.Valid {
				errorsx.HTTPError(w, logger, errorsx.Errorf("token invalid"), http.StatusUnauthorized)
				return
			}

			userIDFloat64, ok := claims[domain.ClaimsKeyUserID].(float64)
			if !ok {
				errorsx.HTTPError(w, logger, errorsx.Errorf("userID claim: expected int64 but got %T", claims[domain.ClaimsKeyUserID]), http.StatusInternalServerError)
				return
			}
			userID := int64(userIDFloat64)
			r = r.WithContext(domain.SetUserIDOnCtx(r.Context(), userID))

			next.ServeHTTP(w, r)
		}
		return http.HandlerFunc(fn)
	}
}
