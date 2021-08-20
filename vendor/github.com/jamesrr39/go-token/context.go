package gotoken

import (
	"context"

	"github.com/jamesrr39/goutil/errorsx"
)

type ctxKey struct {
	Name string
}

var (
	TokenIDCtxKey        = ctxKey{Name: "TokenID"}
	TokenAccountIDCtxKey = ctxKey{Name: "AccountID"}
	TokenRoleIDsCtxKey   = ctxKey{Name: "RoleIDs"}
)

func GetIDFromCtx(ctx context.Context) (int64, errorsx.Error) {
	val := ctx.Value(TokenIDCtxKey)
	if val == nil {
		return 0, errorsx.Errorf("no TokenIDCtxKey found on context")
	}

	return val.(int64), nil
}

func GetAccountIDFromCtx(ctx context.Context) (int64, errorsx.Error) {
	val := ctx.Value(TokenAccountIDCtxKey)
	if val == nil {
		return 0, errorsx.Errorf("no TokenAccountIDCtxKey found on context")
	}

	return val.(int64), nil
}

func GetRoleIDsFromCtx(ctx context.Context) ([]int64, errorsx.Error) {
	val := ctx.Value(TokenRoleIDsCtxKey)
	if val == nil {
		return nil, errorsx.Errorf("no TokenRoleIDsCtxKey found on context")
	}

	return val.([]int64), nil
}

func HasRoleID(ctx context.Context, roleID int64) (bool, errorsx.Error) {
	roleIDs, err := GetRoleIDsFromCtx(ctx)
	if err != nil {
		return false, err
	}

	for _, roleIDOnCtx := range roleIDs {
		if roleID == roleIDOnCtx {
			return true, nil
		}
	}

	return false, nil
}
