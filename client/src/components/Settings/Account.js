import React from 'react'
import Radium from 'radium'
import CommonStyles from '../../styles/CommonStyles'
import AuthStore from '../../stores/AuthStore'
import AuthActions, { EMAIL_UNIQUE_RESULT } from '../../actions/AuthActions'
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
    profileImage: {
        borderRadius: 100,
        width: 120,
        height: 120,
        display: 'inline-block',
        overflow: 'hidden',
        position: 'relative',
        textAlign: 'center',
        lineHeight: '120px',
        backgroundColor: '#BBB',
        fontSize: 60,
        letterSpacing: 1,
        paddingLeft: 1,
        color: '#fff',
        cursor: 'pointer',
        marginBottom: 8,
    },
    photoContainer: {
        padding: '0 24px 0 8px',
        textAlign: 'center',
        marginBottom: 16,
        '@media (max-width: 600px)': {
            flex: 1,
            padding: '0',
        },
    },
    nameFieldsContainer: {
        flex: 1,
        '@media (max-width: 600px)': {
            width: '100%',
            flex: 'none',
        },
    },
}

@Radium
class GeneralInput extends React.Component {
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
                type="text"
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
export default class Account extends React.Component {
    constructor(props) {
        super(props)

        const user = AuthStore.getCurrentUser()

        this.state = {
            picture: user.picture,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
        }

        this.changeAccountDetail = property => (v) => {
            let value = v
            if (value.target) {
                value = value.target.value
            }

            this.setState(prevState => ({ [property]: value, errors: { ...prevState.errors, [property]: null } }))
        }
        this.handleEmailChange = this.changeAccountDetail('email')
        this.handleFirstNameChange = this.changeAccountDetail('firstName')
        this.handleLastNameChange = this.changeAccountDetail('lastName')
        this.updateProfile = this.updateProfile.bind(this)

        this.openFileBrowser = this.openFileBrowser.bind(this)
        this.handlePhotoUpload = this.handlePhotoUpload.bind(this)
        this.onPhotoSuccess = this.onPhotoSuccess.bind(this)

        this.onSuccess = this.onSuccess.bind(this)
        this.onFailure = this.onFailure.bind(this)
        this.handleCloseSuccessDialog = this.handleCloseSuccessDialog.bind(this)
        this.handleCloseFailureDialog = this.handleCloseFailureDialog.bind(this)

        this.handleUniqueEmail = this.handleUniqueEmail.bind(this)
        this.validateEmail = this.validateEmail.bind(this)
        this.validateEmptyField = this.validateEmptyField.bind(this)
    }

    render() {
        const { email, firstName, lastName, errors, isProcessing, picture, photoUploading } = this.state

        return <div>
            <h2 style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 16px 8px 0' }}>
                Your Account Information
            </h2>

            <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={styles.photoContainer}>
                        <a style={styles.profileImage} onTouchTap={this.openFileBrowser}>
                            {
                                picture ?
                                    <img src={picture.url} style={{ width: '100%' }}/> :
                                    'KL'
                            }
                        </a>
                        <a style={{ display: 'block', cursor: 'pointer' }} onTouchTap={this.openFileBrowser}>
                            {photoUploading ? 'Uploading...' : 'Change Photo'}
                        </a>
                    </div>
                    <div style={styles.nameFieldsContainer}>
                        <label style={styles.label}>First Name:</label>
                        <GeneralInput
                            key="firstName"
                            property="firstName"
                            value={firstName}
                            handleValidation={this.validateEmptyField}
                            error={(errors && errors.firstName) || null}
                            onInput={this.handleFirstNameChange}/>

                        <label style={styles.label}>Last Name:</label>
                        <GeneralInput
                            key="lastName"
                            property="lastName"
                            value={lastName}
                            handleValidation={this.validateEmptyField}
                            error={(errors && errors.lastName) || null}
                            onInput={this.handleLastNameChange}/>
                    </div>
                </div>

                <label style={styles.label}>Email:</label>
                <GeneralInput
                    key="email"
                    property="email"
                    value={email}
                    handleValidation={this.validateEmail}
                    error={(errors && errors.email) || null}
                    onInput={this.handleEmailChange}/>
            </div>
            <div>
                <div key="button" style={styles.submitButton} onTouchTap={this.updateProfile}>
                    {isProcessing ? 'Updating...' : 'Update Profile'}
                </div>
            </div>
            {this.renderSuccessDialog()}
            {this.renderFailureDialog()}
            <input
                ref={(upload) => {
                    this.upload = upload
                }}
                type="file"
                style={{ display: 'none' }}
                onChange={this.handlePhotoUpload}/>
        </div>
    }

    renderSuccessDialog() {
        const { success, photoUploading } = this.state

        return <Dialog show={success}
                       onRequestClose={this.handleCloseSuccessDialog}
                       style={styles.dialog}>
            <div style={styles.dialogContents}>
                <CheckCircle style={{ color: CommonStyles.successColor }}/>
                <h3 style={{ fontSize: 24, marginTop: 16 }}>Great Success!</h3>
                <div style={{ marginTop: 8, padding: '0 12px' }}>
                    <p style={{ color: '#797979', fontWeight: 200, lineHeight: 1.4 }}>
                        Your {photoUploading ? 'photo' : 'profile'} has been updated!
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
        const { failed, photoUploading } = this.state

        return <Dialog show={failed}
                       onRequestClose={this.handleCloseFailureDialog}
                       style={styles.dialog}>
            <div style={styles.dialogContents}>
                <AlertCircle style={{ color: CommonStyles.errorColor }}/>
                <h3 style={{ fontSize: 24, marginTop: 16 }}>Oops!</h3>
                <div style={{ marginTop: 8, padding: '0 12px' }}>
                    <p style={{ color: '#797979', fontWeight: 200, lineHeight: 1.4 }}>
                        There was an issue with the server while {photoUploading ? 'uploading your profile photo' :
                        'updating your account information'}.
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

    openFileBrowser() {
        const { photoUploading } = this.state

        if (photoUploading) return

        this.upload.click()
    }

    handlePhotoUpload(e) {
        const event = e

        if (!(event.target.files && event.target.files.length && event.target.files[0].type.indexOf('image') !== -1)) {
            return
        }

        AccountStore.addSuccessListener(this.onPhotoSuccess)
        AccountStore.addFailureListener(this.onFailure)
        AccountActions.changeProfilePhoto(event.target.files[0])
        event.target.value = ''

        this.setState({
            photoUploading: true,
        })
    }

    handleCloseFailureDialog() {
        this.setState({
            failed: false,
            photoUploading: false,
        })
    }

    handleCloseSuccessDialog() {
        this.setState({
            success: false,
            photoUploading: false,
        })
    }

    handleUniqueEmail(isUnique) {
        AuthStore.removeListener(EMAIL_UNIQUE_RESULT, this.handleUniqueEmail)

        this.setState((prevState) => {
            const takenError = 'Email taken.'
            let email
            if (isUnique) {
                email = !(prevState.errors && prevState.errors.email) || takenError === prevState.errors.email ?
                    null : prevState.errors.email
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

    validateEmptyField(value, property) {
        if (!value.trim()) {
            this.setState(prevState => ({
                errors: {
                    ...prevState.errors,
                    [property]: 'You cannot leave this field empty.',
                },
            }))
        }
    }

    validateEmail(email) {
        const emailRegex = /^.+@.+\..+$/

        if (email && emailRegex.test(email)) {
            AuthStore.on(EMAIL_UNIQUE_RESULT, this.handleUniqueEmail)
            AuthActions.checkEmail(email)

            this.setState(prevState => ({
                errors: {
                    ...prevState.errors,
                    email: null,
                },
            }))
        } else {
            this.setState(prevState => ({
                errors: {
                    ...prevState.errors,
                    email: 'Please enter a valid email address.',
                },
            }))
        }
    }

    updateProfile() {
        const { email, firstName, lastName, isProcessing, errors } = this.state

        if (isProcessing || (errors && Object.keys(errors).filter(p => errors[p] !== null).length)) return

        AccountStore.addSuccessListener(this.onSuccess)
        AccountStore.addFailureListener(this.onFailure)
        AccountActions.updateAccountDetails({
            email,
            first_name: firstName,
            last_name: lastName,
        })

        this.setState({
            isProcessing: true,
            errors: null,
        })
    }

    onPhotoSuccess(picture) {
        AccountStore.removeSuccessListener(this.onPhotoSuccess)
        AccountStore.removeFailureListener(this.onFailure)

        this.setState({
            success: true,
            picture,
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
        AccountStore.removeSuccessListener(this.onPhotoSuccess)
        AccountStore.removeFailureListener(this.onFailure)

        this.setState({
            isProcessing: false,
            failed: true,
        })
    }
}
