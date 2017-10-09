import React from 'react'
import Radium from 'radium'
import StripeCheckout from 'react-stripe-checkout'
import AuthActions, { EMAIL_UNIQUE_RESULT } from '../../actions/AuthActions'
import AuthStore from '../../stores/AuthStore'
import Facebook from '../Login/Facebook'
import PageUtils from '../../utils/PageUtils'
import CommonStyles from '../../styles/CommonStyles'

const STRIPE_KEY = process.env.STRIPE_KEY


const styles = {
    main: {
        textAlign: 'center',
    },
    header: {
        margin: 16,
    },
    premium: {
        textDecoration: 'underline',
    },
    fieldset: {
        maxWidth: 600,
        padding: '16px 24px 24px',
        margin: '32px 16px',
        flex: 1,
        border: '1px solid #e6e6e6',
        textAlign: 'left',
    },
    fieldsetHeader: {
        margin: 0,
        padding: 0,
        fontSize: 18,
        fontWeight: 400,
        color: '#4D545D',
        fontFamily: 'Montserrat, sans-serif',
    },
    flexContainerCenter: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        margin: '16px 0 0',
        padding: '8px 12px',
        alignItems: 'center',
        backgroundColor: '#fff',
        border: '1px solid #d7d7d7',
        color: '#4D545D',
        display: 'inline-flex',
        fontSize: 14,
        letterSpacing: '1px',
        lineHeight: '24px',
        width: '100%',
        fontWeight: 400,
        outline: 'none',
        ':hover': {
            border: '1px solid #a7a7a7',
        },
        ':focus': {
            border: '1px solid rgb(0, 177, 179)',
        },
    },
    cardButton: {
        padding: '12px 16px',
        outline: 'none',
        borderRadius: 3,
        margin: '16px 0 0',
        background: CommonStyles.mainColor,
        color: 'rgb(255, 255, 255)',
        border: 'none',
        fontSize: 14,
        textTransform: 'uppercase',
        fontWeight: 700,
        letterSpacing: 1,
        cursor: 'pointer',
    },
    submitButton: CommonStyles.formButton('#EF6733'),
    facebookButton: {
        borderRadius: 3,
        padding: '12px 16px',
        textAlign: 'center',
        backgroundColor: CommonStyles.facebookColor,
        color: '#fff',
        margin: '16px 0',
    },
    error: {
        fontSize: 10,
        padding: '4px 8px',
        color: CommonStyles.errorColor,
    },
    slideIn: Radium.keyframes({
        '0%': {
            maxHeight: 0,
            opacity: 0,
        },
        '100%': {
            maxHeight: 500,
            opacity: 1,
        },
    }, 'slide-in'),
}

const inheritedStyles = {
    ...styles,
    generalButton: {
        ...styles.submitButton,
        opacity: 0.8,
        cursor: 'pointer',
        ':hover': { opacity: 1, transform: 'scale(1.03)' },
    },
}

@Radium
export default class Premium extends React.Component {
    static contextTypes = {
        router: React.PropTypes.object.isRequired,
    }

    constructor(props) {
        super(props)

        this.renderForm = this.renderForm.bind(this)
        this.formValid = this.formValid.bind(this)
        this.updateEmail = e => this.setState({ email: e.currentTarget.value })
        this.updatePassword = e => this.setState({ password: e.currentTarget.value })
        this.updatePasswordRepeat = e => this.setState({ passwordRepeat: e.currentTarget.value })


        const checkFacebookUserExists = (isUnique) => {
            AuthStore.removeListener(EMAIL_UNIQUE_RESULT, checkFacebookUserExists)
            if (!isUnique) {
                // try to log in

                AuthStore.onLogout(this.onFailure)
                AuthStore.onLogin(this.handleRedirectExistingUser)
                AuthActions.facebookLogin(this.state.facebookToken)
            }
        }

        this.onFacebookSignUp = (response) => {
            // Log in with facebook accessToken
            if (!(response && response.accessToken)) {
                return
            }

            window.FB.api('/me',
                { fields: 'id, name, email, picture.width(200),first_name,last_name' },
                (facebookUser) => {
                    this.setState({
                        facebookToken: response.accessToken,
                        facebookUser,
                        email: facebookUser.email,
                    })

                    // Check if user already exists
                    AuthStore.on(EMAIL_UNIQUE_RESULT, checkFacebookUserExists)
                    AuthActions.checkEmail(facebookUser.email)
                },
            )
        }

        this.onToken = (token) => {
            this.setState(prevState => ({
                stripeToken: token.id,
                email: prevState.email ? prevState.email : token.email,
            }))

            this.validateEmail()
        }

        const emailUniqueHandler = (isUnique) => {
            AuthStore.removeListener(EMAIL_UNIQUE_RESULT, emailUniqueHandler)

            this.setState((prevState) => {
                const takenError = 'Looks like you already have an account. Please sign in.'
                let email
                if (isUnique) {
                    email = takenError === prevState.errors.email ? null : prevState.errors.email
                } else {
                    email = takenError
                }

                return {
                    errors: {
                        ...prevState.errors,
                        email,
                    },
                }
            })
        }

        this.validateEmail = () => {
            const { email } = this.state
            const emailRegex = /^.+@.+\..+$/

            if (email && emailRegex.test(email)) {
                AuthStore.on(EMAIL_UNIQUE_RESULT, emailUniqueHandler)
                AuthActions.checkEmail(email)

                this.setState(prevState => ({
                    errors: {
                        ...prevState.errors,
                        email: null,
                    },
                }))
            } else if (email) {
                this.setState(prevState => ({
                    errors: {
                        ...prevState.errors,
                        email: 'Please enter a valid email address.',
                    },
                }))
            }
        }

        this.validatePasswords = () => {
            const { password, passwordRepeat } = this.state

            const passwordValid = password.length >= 6
            const passwordMatch = password === passwordRepeat

            this.setState(prevState => ({
                errors: {
                    ...prevState.errors,
                    password: !password || passwordValid ? null : 'Password must be at least 6 characters.',
                    repeat: !password || !passwordRepeat || passwordMatch ? null : 'Passwords do not match.',

                },
            }))
        }

        this.submitForm = this.submitForm.bind(this)
        this.onSuccess = this.onSuccess.bind(this)
        this.handleRedirectExistingUser = this.handleRedirectExistingUser.bind(this)
        this.onFailure = this.onFailure.bind(this)

        this.state = {
            email: '',
            password: '',
            passwordRepeat: '',
            stripeToken: '',
            errors: null,
            facebookUser: null,
            facebookToken: null,
            submitting: false,
            serverError: '',
        }
    }

    componentDidMount() {
        if (this.form) {
            this.form.addEventListener('animationend', () => {
                this.setState({
                    removeForm: true,
                })
            })
        }
    }

    componentWillUnmount() {
        AuthStore.removeLoginListener(this.onSuccess)
        AuthStore.removeSignUpFailureListener(this.onFailure)
        PageUtils.isLoading(false)
    }

    render() {
        const user = AuthStore.getCurrentUser()

        return (
            <div style={styles.main}>
                <h1 style={styles.header}>Let's get you signed up with <span style={styles.premium}>Premium.</span></h1>

                {
                    user ? this.renderButton() : this.renderForm()
                }
            </div>
        )
    }

    renderButton() {
        return <div style={{ textAlign: 'center' }}>
            <div style={{ width: 280, display: 'inline-block' }}>
                <div style={inheritedStyles.generalButton} onClick={this.handleRedirectExistingUser}>
                    Get Premium!
                </div>
            </div>
        </div>
    }

    formValid() {
        const { email, password, passwordRepeat, stripeToken, errors, facebookToken } = this.state

        const hasErrors = errors && Object.values(errors).length === 0,
            formComplete = email && password && passwordRepeat && passwordRepeat === password

        return !!(stripeToken && ((hasErrors === 0 && formComplete) || facebookToken))
    }

    renderForm() {
        const {
            email,
            password,
            passwordRepeat,
            stripeToken,
            errors,
            facebookUser,
            removeForm,
            submitting,
        } = this.state

        const isValid = this.formValid()

        const button = <div style={styles.facebookButton}>Sign up with Facebook</div>

        return <div style={styles.flexContainerCenter}>
            <fieldset style={styles.fieldset}>
                <h3 style={styles.fieldsetHeader}>Sign Up</h3>
                <div style={{ overflow: 'hidden' }}>
                    {
                        facebookUser &&
                        <div style={{
                            animation: 'x 3s ease 0s forwards',
                            animationName: styles.slideIn,
                            padding: '16px 0 0',
                            textAlign: 'center',
                        }}>
                            <div style={{
                                width: 100,
                                height: 100,
                                display: 'inline-block',
                                position: 'relative',
                            }}>
                                <img src={facebookUser.picture.data.url}
                                     style={{
                                         borderRadius: 100,
                                         width: '100%',
                                         height: '100%',
                                         opacity: 'hidden',
                                         backgroundColor: '#CCC',
                                     }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 10,
                                    backgroundColor: styles.facebookButton.backgroundColor,
                                    color: '#fff',
                                    height: 20,
                                    width: 20,
                                    lineHeight: '20px',
                                    borderRadius: 100,
                                }}>
                                    <i className="fa fa-facebook"/>
                                </div>
                            </div>
                        </div>
                    }
                    {
                        !removeForm &&
                        <div
                            ref={(form) => {
                                this.form = form
                            }}
                            style={{
                                transition: 'all .3s ease',
                                opacity: facebookUser ? 0 : 1,
                                maxHeight: facebookUser ? 0 : 500,
                            }}
                        >
                            <Facebook
                                callback={this.onFacebookSignUp}
                                button={button}
                            />
                            <div style={{ textAlign: 'center' }}>or</div>
                            <input style={styles.input} value={email} required="true" type="text"
                                   onInput={this.updateEmail}
                                   onBlur={this.validateEmail}
                                   placeholder="Email address" name="email" id="email" key="email"
                            />
                            {errors && errors.email && <div style={styles.error}>{errors.email}</div>}

                            <input style={styles.input} type="password" value={password} required="true"
                                   onInput={this.updatePassword}
                                   onBlur={this.validatePasswords}
                                   placeholder="Desired password" name="password" id="password" key="password"/>
                            {errors && errors.password && <div style={styles.error}>{errors.password}</div>}

                            <input style={styles.input} type="password" value={passwordRepeat} required="true"
                                   onInput={this.updatePasswordRepeat}
                                   onBlur={this.validatePasswords}
                                   placeholder="Repeat password" name="repeat-password" id="repeat-password"
                                   key="repeat-password"/>
                            {errors && errors.repeat && <div style={styles.error}>{errors.repeat}</div>}
                        </div>
                    }
                </div>

                <StripeCheckout
                    name="Stockphotos"
                    description="Premium Monthly, $5"
                    token={this.onToken}
                    stripeKey={STRIPE_KEY}
                    panelLabel="Approve"
                    amount={500}
                    email={email}
                    allowRememberMe={false}
                    zipCode={true}
                    disabled={!!stripeToken}
                >
                    <div style={{
                        display: 'inline-block',
                        width: facebookUser ? '100%' : 'auto',
                        textAlign: 'center',
                        transition: 'all .3s ease',
                    }}>
                        {
                            stripeToken ?
                                <div style={{
                                    margin: '16px 0 0',
                                    padding: '0 0 0 8px',
                                    color: 'rgb(0, 177, 179)',
                                }}>
                                    Card Added!
                                </div> :
                                <button style={styles.cardButton}>
                                    Add Card
                                </button>
                        }
                    </div>
                </StripeCheckout>

                <div
                    style={{
                        ...styles.submitButton,
                        opacity: isValid && !submitting ? 1 : 0.2,
                        cursor: (submitting && 'wait') || (isValid && 'pointer') || 'not-allowed',
                    }}
                    onClick={this.submitForm}
                >
                    {submitting ? 'Signing Up...' : 'Sign Up'}
                </div>
            </fieldset>
        </div>
    }

    onSuccess() {
        AuthStore.removeLoginListener(this.onSuccess)
        AuthStore.removeSignUpFailureListener(this.onFailure)
        PageUtils.isLoading(false)

        this.context.router.push('/')
    }

    onFailure(error) {
        AuthStore.removeLoginListener(this.onSuccess)
        AuthStore.removeLoginListener(this.handleRedirectExistingUser)
        AuthStore.removeSignUpFailureListener(this.onFailure)
        PageUtils.isLoading(false)

        this.setState({
            serverError: (error && error.body && error.body.error && error.body.error.description) || '',
        })
    }

    handleRedirectExistingUser() {
        AuthStore.removeLoginListener(this.handleRedirectExistingUser)
        AuthStore.removeSignUpFailureListener(this.onFailure)

        this.context.router.push('/settings/subscription')
    }

    submitForm() {
        const { submitting } = this.state

        if (!this.formValid() || submitting) return

        const { email, password, stripeToken, facebookToken } = this.state
        const data = { stripe_token: stripeToken }

        if (facebookToken) {
            data.token = facebookToken
            data.backend = 'facebook'
        } else {
            data.email = email
            data.password = password
        }

        AuthStore.onLogin(this.onSuccess)
        AuthStore.onSignUpFailure(this.onFailure)
        AuthActions.signUp(data)
        this.setState({
            submitting: true,
        })
        PageUtils.isLoading(true)
    }
}
