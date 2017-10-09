import Dispatcher from '../Dispatcher'
import Auth from '../api/Auth'

export const LOAD_USER = 'LOAD_USER'
export const LOGOUT = 'LOGOUT'
export const EMAIL_UNIQUE_RESULT = 'EMAIL_UNIQUE_RESULT'
export const SIGNUP_SUCCESS = 'SIGNUP_SUCCESS'
export const SIGNUP_FAILURE = 'SIGNUP_FAILURE'


export const LoginServerActions = {
    loadUser(user) {
        Dispatcher.dispatch({
            type: LOAD_USER,
            data: user,
        })
    },

    logOut(error) {
        if (localStorage.token) delete localStorage.token

        Dispatcher.dispatch({
            type: LOGOUT,
            error,
        })
    },

    sendSignUpSuccess(user) {
        Dispatcher.dispatch({
            type: SIGNUP_SUCCESS,
            data: user,
        })
    },

    sendSignUpFailure(error) {
        Dispatcher.dispatch({
            type: SIGNUP_FAILURE,
            error,
        })
    },

    sendEmailUniqueResult(result) {
        Dispatcher.dispatch({
            type: EMAIL_UNIQUE_RESULT,
            data: result,
        })
    },
}

export const AuthActions = {
    facebookLogin(accessToken) {
        Auth.facebookLogin(accessToken)
            .then(this.authenticateToken, error => this.logOut(error))
    },

    authenticateToken(accessToken) {
        Auth.authenticateToken(accessToken)
            .then(LoginServerActions.loadUser, error => this.logOut(error))
    },

    login(email, password) {
        Auth.login({ email, password })
            .then(this.authenticateToken, error => this.logOut(error))
    },

    logOut(error) {
        if (error && error.status === 401) {
            LoginServerActions.logOut(error)
            return
        }

        Auth.logout(localStorage.token, () => LoginServerActions.logOut(error))
    },

    checkEmail(email) {
        Auth.checkEmail(email)
            .then(LoginServerActions.sendEmailUniqueResult)
    },

    signUp(data) {
        Auth.signUp(data)
            .then(LoginServerActions.loadUser, LoginServerActions.sendSignUpFailure)
    },
}

export default AuthActions
