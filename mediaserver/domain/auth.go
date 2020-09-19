package domain

import (
	"context"
	"time"

	"fmt"

	"github.com/dgrijalva/jwt-go"
)

var CtxKeyUserID struct{}

const ClaimsKeyUserID = "userId"

func GetUserIDFromCtx(ctx context.Context) (int64, error) {
	val := ctx.Value(CtxKeyUserID)
	userID, ok := val.(int64)
	if !ok {
		return 0, fmt.Errorf("expected int64 type for user ID, but was %T", val)
	}
	return userID, nil
}

func SetUserIDOnCtx(ctx context.Context, userID int64) context.Context {
	return context.WithValue(ctx, CtxKeyUserID, userID)
}

func CreateJWTToken(signingSecret []byte, userID int64) (string, error) {
	nowUTC := time.Now().UTC()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"iat":           nowUTC.Unix(),
		"exp":           nowUTC.Add(time.Hour * 24 * 7).Unix(),
		"nbf":           nowUTC.Unix(),
		ClaimsKeyUserID: userID,
	})
	return token.SignedString(signingSecret)
}
