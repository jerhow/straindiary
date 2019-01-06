// Package auth gathers any helper functions which are only relevant to logging in,
// or subsequent authentication within the app or to the API.
// Currently this package is oriented around bcrypt hashes, but this could change
// in the future.
package auth

import (
	"fmt"
	"github.com/jerhow/straindiary/internal/db"
	"github.com/jerhow/straindiary/internal/util"
	"golang.org/x/crypto/bcrypt"
	"math/rand"
	"time"
)

const BCRYPT_COST int = 10 // TODO: Research the optimal number of rounds (was 14 originally, but that was very slow)

func Pepper() string {
	// TODO: Store and fetch this as an ENV variable
	return "MyRandomPepper123"
}

func HashPassword(password string) (string, error) {
	// TODO: Add salt
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), BCRYPT_COST)
	util.ErrChk(err)
	return string(bytes), err
}

func checkPasswordHash(pwd string, hash string) bool {
	// TODO: Add salt
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(pwd))
	return (err == nil) // 'CompareHashAndPassword' returns nil on success or an error on failure, so we can return the result of the evaluation
}

func Login(un string, pwdFromUser string) (bool, int) {
	pwdHashFromDb, userId := db.FetchPwdHashAndUserId(un)
	return checkPasswordHash(pwdFromUser, pwdHashFromDb), userId
}

func generateRandomAlphaNumericString(length int) string {
	rand.Seed(time.Now().UnixNano())
	var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
	lettersLen := len(letters)

	arr := make([]rune, length)
	for i := range arr {
		arr[i] = letters[rand.Intn(lettersLen)]
	}

	return string(arr)
}

func NewSession(userId int) (bool, string, string) {
	var result bool = true
	var msg string = ""
	var authToken string = ""

	expireResult, expireMsg := db.ExpireSessionAuth(userId)
	if !expireResult {
		fmt.Println(expireMsg)
	}

	// TODO: Add salt
	someRandomString := generateRandomAlphaNumericString(10) // TODO: How long really?

	bytes, err := bcrypt.GenerateFromPassword([]byte(someRandomString), BCRYPT_COST)
	authToken = string(bytes)
	db.WriteNewSessionAuth(userId, authToken)

	if err != nil {
		result = false
		msg = err.Error()
	}

	return result, msg, authToken
}
