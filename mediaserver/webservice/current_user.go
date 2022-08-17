package webservice

import (
	"mediaserver/mediaserver/dal"
	"mediaserver/mediaserver/dal/diskstorage/mediaserverdb"
	"mediaserver/mediaserver/domain"
	"mediaserver/mediaserver/webservice/mediaservermiddleware"
	"net/http"

	"github.com/go-chi/render"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logpkg"
)

func BuildGetCurrentUser(logger *logpkg.Logger, hmacSigningSecret []byte, dbConn *mediaserverdb.DBConn, peopleDAL *dal.PeopleDAL) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		type CurrentUserStatus struct {
			User *domain.Person `json:"user"`
		}

		userID, err := mediaservermiddleware.GetUserIDFromRequest(r, hmacSigningSecret)
		if err != nil {
			if errorsx.Cause(err) != mediaservermiddleware.ErrNoOrExpiredToken {
				errorsx.HTTPJSONError(w, logger, errorsx.Wrap(err), http.StatusInternalServerError)
				return
			}

			render.JSON(w, r, CurrentUserStatus{})
			return
		}

		// TODO: this shouldn't require a tx
		tx, err := dbConn.Begin()
		if err != nil {
			errorsx.HTTPJSONError(w, logger, errorsx.Wrap(err), http.StatusInternalServerError)
			return
		}
		defer tx.Rollback()

		user, err := peopleDAL.GetPersonByID(tx, userID)
		if err != nil {
			errorsx.HTTPJSONError(w, logger, errorsx.Wrap(err), http.StatusInternalServerError)
			return
		}

		render.JSON(w, r, CurrentUserStatus{
			User: user,
		})
	}
}
