import React from 'react'
import Radium from 'radium'
import Facebook from './Facebook'
import AuthActions from '../../actions/AuthActions'
import AuthStore from '../../stores/AuthStore'
import CommonStyles from '../../styles/CommonStyles'


const loginStyles = {
    container: {
        maxWidth: 600,
        margin: '32px auto',
        padding: '8px 32px',
        textAlign: 'center',
    },
    formContainer: {
        margin: '40px auto 32px',
        maxWidth: 300,
    },
    button: {
        borderRadius: 3,
        padding: '8px 16px',
    },
}

@Radium
export default class Login extends React.Component {

    constructor() {
        super()
        this.onFacebookLogin = this.onFacebookLogin.bind(this)
        this.onError = (error) => {
            AuthStore.removeLogoutListener(this.onError)
            AuthStore.removeLoginListener(this.onSuccess)
        }
        this.onSuccess = () => this.context.router.push('/')


        this.styles = { ...loginStyles }

        this.styles.facebookButton = {
            ...this.styles.button,
            backgroundColor: CommonStyles.facebookColor,
            color: '#fff',
        }
    }

    static contextTypes = {
        router: React.PropTypes.object.isRequired,
    }


    onFacebookLogin(response) {
        // Log in with facebook accessToken
        if (!(response && response.accessToken)) return

        AuthStore.onLogout(this.onError)
        AuthStore.onLogin(this.onSuccess)
        AuthActions.facebookLogin(response.accessToken)
    }

    componentWillUnmount() {
        AuthStore.removeLogoutListener(this.onError)
        AuthStore.removeLoginListener(this.onSuccess)
    }


    render() {
        const styles = this.styles
        const button = <div style={styles.facebookButton}>Login with Facebook</div>

        return (
            <div style={styles.container}>
                <h1>Login</h1>

                <div style={styles.formContainer}>
                    <Facebook
                        callback={this.onFacebookLogin}
                        button={button}
                    />
                </div>
            </div>
        )
    }
}
