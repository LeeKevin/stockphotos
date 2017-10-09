import React from 'react'
import Radium from 'radium'
import CommonStyles from '../../styles/CommonStyles'
import AccountStore from '../../stores/AccountStore'
import AccountActions from '../../actions/AccountActions'
import { Dialog } from '../Common'
import AlertCircle from '../../svg/alert-circle'
import CheckCircle from '../../svg/check-circle'

const styles = {
    input: {
        ...CommonStyles.Settings.input,
    },
    label: {
        padding: '8px 0',
        display: 'block',
    },
    submitButton: {
        ...CommonStyles.formButton('#EF6733'),
        width: 'auto',
        display: 'inline-block',
        cursor: 'pointer',
        margin: '8px 16px 8px 0',
        ':hover': {
            color: '#fff',
            backgroundColor: '#EF6733',
        },
    },
    error: {
        fontSize: 10,
        padding: '4px 8px',
        color: CommonStyles.errorColor,
    },
    dialog: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dialogContents: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dialogCancelButton: {
        ...CommonStyles.solidButton('#C1C1C1'),
    },
}

@Radium
class PasswordInput extends React.Component {
    static propTypes = {
        property: React.PropTypes.string,
        value: React.PropTypes.string,
        onInput: React.PropTypes.func,
        handleValidation: React.PropTypes.func,
        error: React.PropTypes.string,
    }

    constructor(props) {
        super(props)

        this.validate = this.validate.bind(this)
    }

    render() {
        const { value, onInput, error } = this.props

        return <div style={{ marginBottom: 16 }}>
            <input
                type="password"
                style={styles.input}
                value={value}
                onBlur={this.validate}
                onChange={onInput}/>
            {error && <div style={styles.error}>{error}</div>}
        </div>
    }

    validate() {
        const { property, value, handleValidation } = this.props

        if (handleValidation) {
            handleValidation(value, property)
        }
    }
}

@Radium
export default class Password extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            password: '',
            confirm: '',
        }

        this.changeAccountDetail = property => (v) => {
            let value = v
            if (value.target) {
                value = value.target.value
            }

            this.setState(prevState => ({ [property]: value, errors: { ...prevState.errors, [property]: null } }))
        }
        this.handlePasswordChange = this.changeAccountDetail('password')
        this.handleConfirmChange = this.changeAccountDetail('confirm')
        this.updateProfile = this.updateProfile.bind(this)

        this.onSuccess = this.onSuccess.bind(this)
        this.onFailure = this.onFailure.bind(this)
        this.handleCloseSuccessDialog = this.handleCloseSuccessDialog.bind(this)
        this.handleCloseFailureDialog = this.handleCloseFailureDialog.bind(this)

        this.validate = this.validate.bind(this)
    }

    render() {
        const { password, confirm, errors, isProcessing } = this.state

        return <div>
            <h2 style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 16px 8px 0' }}>
                Change Your Password
            </h2>


            <div style={{ marginTop: 16 }}>
                <label style={styles.label}>New Password:</label>
                <PasswordInput
                    key="password"
                    property="password"
                    value={password}
                    handleValidation={this.validate}
                    error={(errors && errors.password) || null}
                    onInput={this.handlePasswordChange}/>

                <label style={styles.label}>Confirm Password:</label>
                <PasswordInput
                    key="confirm"
                    property="confirm"
                    value={confirm}
                    handleValidation={this.validate}
                    error={(errors && errors.confirm) || null}
                    onInput={this.handleConfirmChange}/>
            </div>
            <div>
                <div key="button" style={styles.submitButton} onTouchTap={this.updateProfile}>
                    {isProcessing ? 'Updating...' : 'Update Profile'}
                </div>
            </div>
            {this.renderSuccessDialog()}
            {this.renderFailureDialog()}
        </div>
    }

    renderSuccessDialog() {
        const { success } = this.state

        return <Dialog show={success}
                       onRequestClose={this.handleCloseSuccessDialog}
                       style={styles.dialog}>
            <div style={styles.dialogContents}>
                <CheckCircle style={{ color: CommonStyles.successColor }}/>
                <h3 style={{ fontSize: 24, marginTop: 16 }}>Great Success!</h3>
                <div style={{ marginTop: 8, padding: '0 12px' }}>
                    <p style={{ color: '#797979', fontWeight: 200, lineHeight: 1.4 }}>
                        Your password was updated!
                    </p>
                </div>
            </div>
            <div>
                <button key="close-failure" style={styles.dialogCancelButton} onClick={this.handleCloseSuccessDialog}>
                    Close
                </button>
            </div>
        </Dialog>
    }

    renderFailureDialog() {
        const { failed } = this.state

        return <Dialog show={failed}
                       onRequestClose={this.handleCloseFailureDialog}
                       style={styles.dialog}>
            <div style={styles.dialogContents}>
                <AlertCircle style={{ color: CommonStyles.errorColor }}/>
                <h3 style={{ fontSize: 24, marginTop: 16 }}>Oops!</h3>
                <div style={{ marginTop: 8, padding: '0 12px' }}>
                    <p style={{ color: '#797979', fontWeight: 200, lineHeight: 1.4 }}>
                        There was an issue with the server while updating your password.
                        Please refresh the page and try again.
                    </p>
                </div>
            </div>
            <div>
                <button key="close-success" style={styles.dialogCancelButton} onClick={this.handleCloseFailureDialog}>
                    Close
                </button>
            </div>
        </Dialog>
    }

    handleCloseFailureDialog() {
        this.setState({
            failed: false,
        })
    }

    handleCloseSuccessDialog() {
        this.setState({
            success: false,
        })
    }

    validate(value, property) {
        switch (property) {
            case 'password':
                if (!(value.length >= 6)) {
                    this.setState(prevState => ({
                        errors: {
                            ...prevState.errors,
                            [property]: 'Password must be at least 6 characters.',
                        },
                    }))
                    return false
                }

                break
            case 'confirm':
                break
            default:
                return true
        }

        const { password, confirm } = this.state
        const passwordMatch = password && password === confirm

        this.setState(prevState => ({
            errors: {
                ...prevState.errors,
                confirm: passwordMatch ? null : 'Passwords do not match.',

            },
        }))

        return passwordMatch
    }

    updateProfile() {
        const { password, isProcessing, errors } = this.state

        if (isProcessing || (errors && Object.keys(errors).filter(p => errors[p] !== null).length)) return

        AccountStore.addSuccessListener(this.onSuccess)
        AccountStore.addFailureListener(this.onFailure)
        AccountActions.updateAccountDetails({
            password,
        })

        this.setState({
            isProcessing: true,
            errors: null,
            password: '',
            confirm: '',
        })
    }

    onSuccess() {
        AccountStore.removeSuccessListener(this.onSuccess)
        AccountStore.removeFailureListener(this.onFailure)

        this.setState({
            isProcessing: false,
            success: true,
        })
    }

    onFailure() {
        AccountStore.removeSuccessListener(this.onSuccess)
        AccountStore.removeFailureListener(this.onFailure)

        this.setState({
            isProcessing: false,
            failed: true,
        })
    }
}
