// Package auth gathers any helper functions which are only relevant to logging in,
// or subsequent authentication within the app or to the API.
// Currently this package is oriented around bcrypt hashes, but this could change
// in the future.
package auth

import (
	"github.com/jerhow/straindiary/internal/db"
	"github.com/jerhow/straindiary/internal/util"
	"golang.org/x/crypto/bcrypt"
)

const BCRYPT_COST int = 14

func Pepper() string {
	// TODO: Store and fetch this as an ENV variable
	return "MyRandomPepper123"
}

func HashPwd(pwd string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(pwd), BCRYPT_COST)
	util.ErrChk(err)
	return string(bytes), err
}

func CheckPasswordHash(pwd string, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(pwd))
	return err == nil // 'CompareHashAndPassword' returns nil on success, or an error on failure
}

func Authenticate(un string, pwdFromUser string) (bool, int) {
	pwdHashFromDb, userId := db.FetchPwdHashAndUserId(un)
	return CheckPasswordHash(pwdFromUser, pwdHashFromDb), userId
}
