import React from 'react'
import Radium from 'radium'
import StripeCheckout from 'react-stripe-checkout'
import CommonStyles from '../../styles/CommonStyles'
import AuthStore from '../../stores/AuthStore'
import AlertCircle from '../../svg/alert-circle'
import { Dialog } from '../Common'
import AccountActions from '../../actions/AccountActions'
import AccountStore from '../../stores/AccountStore'

const STRIPE_KEY = process.env.STRIPE_KEY


const styles = {
    downArrow: {
        borderLeft: `1px solid ${CommonStyles.mainColor}`,
        borderBottom: `1px solid ${CommonStyles.mainColor}`,
        borderRight: 0,
        borderTop: 0,
        height: 7,
        pointerEvents: 'none',
        position: 'absolute',
        transform: 'rotate(-45deg) translateY(-100%)',
        width: 7,
        right: 16,
        top: '50%',
    },
    select: {
        ...CommonStyles.Settings.input,
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
    chip: {
        display: 'inline-block',
        padding: '4px 8px',
        verticalAlign: 'middle',
        color: '#fff',
        backgroundColor: CommonStyles.mainColor,
        borderRadius: 100,
        fontWeight: 400,
        fontSize: 11,
        marginBottom: 8,
    },
    dialogCancelButton: {
        ...CommonStyles.solidButton('#C1C1C1'),
    },
    dialogActionButton: {
        ...CommonStyles.solidButton('#8CD4F5'),
        marginLeft: 16,
    },
    cardButton: {
        padding: '8px 16px',
        outline: 'none',
        borderRadius: 3,
        background: CommonStyles.mainColor,
        color: 'rgb(255, 255, 255)',
        border: 'none',
        fontSize: 14,
        textTransform: 'uppercase',
        fontWeight: 700,
        letterSpacing: 1,
        cursor: 'pointer',
    },
    error: {
        color: CommonStyles.errorColor,
        fontSize: 12,
        verticalAlign: 'middle',
        display: 'inline-block',
        padding: '8px 0',
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
}

const SUBSCRIPTION_NAMES = {
    0: 'Free',
    1: 'Premium',
}

@Radium
export default class Subscription extends React.Component {
    constructor(props) {
        super(props)

        const user = AuthStore.getCurrentUser()

        this.state = {
            plan: user.plan || 0,
            showConfirmDialog: false,
            stripeToken: null,
        }

        this.handleOpenDialog = this.handleOpenDialog.bind(this)
        this.handleCloseDialog = this.handleCloseDialog.bind(this)
        this.changeSubscription = this.changeSubscription.bind(this)
        this.handleChangeSubscription = this.handleChangeSubscription.bind(this)
        this.handleCloseFailureDialog = this.handleCloseFailureDialog.bind(this)

        this.handleChangeSuccess = this.handleChangeSuccess.bind(this)
        this.handleChangeFailure = this.handleChangeFailure.bind(this)

        this.onToken = (token) => {
            this.setState({
                stripeToken: token.id,
                error: null,
            })
        }
    }

    render() {
        const { plan, stripeToken, error, isProcessing } = this.state
        const user = AuthStore.getCurrentUser()
        let subscriptionText = ''

        if (user.subscribed_until) {
            if (AuthStore.isUserSubscribed()) {
                subscriptionText =
                    `${SUBSCRIPTION_NAMES[user.plan]} - Active - Expires On ${user.subscribed_until}`
            } else {
                subscriptionText = `Canceled - Expired On ${user.subscribed_until}`
            }
        }

        return <div>
            <div>
                <h2 style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 16px 8px 0' }}>
                    Your Subscription Plan
                </h2>
                {
                    !!subscriptionText &&
                    <div style={styles.chip}>
                        {subscriptionText}
                    </div>
                }
            </div>

            <div style={{ marginTop: 24 }}>
                {
                    AuthStore.isUserSubscribed() && !user.will_auto_renew &&
                    <div style={{ color: '#666', marginBottom: 16 }}>
                        Your subscription will be downgraded on {user.subscribed_until}. You will not be
                        billed to renew your subscription.
                    </div>
                }
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <select value={plan} style={styles.select} onChange={this.changeSubscription}>
                            <option value={0}>Free ($0)</option>
                            <option value={1}>Premium ($5 / month)</option>
                        </select>
                        <div style={styles.downArrow}/>
                    </div>
                    {
                        plan !== user.plan && plan > 0 && !user.has_valid_payment &&
                        <div>
                            <StripeCheckout
                                name="Stockphotos"
                                description="Premium Monthly, $5"
                                token={this.onToken}
                                stripeKey={STRIPE_KEY}
                                panelLabel="Approve"
                                amount={500}
                                email={user.email}
                                allowRememberMe={false}
                                zipCode={true}
                                disabled={!!stripeToken}
                            >
                                <div style={{
                                    display: 'inline-block',
                                    textAlign: 'center',
                                    transition: 'all .3s ease',
                                    marginLeft: 16,
                                }}>
                                    {
                                        stripeToken ?
                                            <div style={{
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
                        </div>
                    }
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap-reverse', alignItems: 'center', margin: '8px 0 0' }}>
                    <div key="button" style={styles.submitButton} onTouchTap={this.handleOpenDialog}>
                        {isProcessing ? 'Updating...' : 'Update Subscription'}
                    </div>
                    {
                        error && <div style={styles.error}>{error}</div>
                    }
                </div>

            </div>
            {this.renderDialog()}
            {this.renderFailureDialog()}
        </div>
    }

    renderDialog() {
        const { plan, showConfirmDialog } = this.state
        const user = AuthStore.getCurrentUser()

        let showSubmit = true
        let title = 'Are you sure?',
            confirmText

        if ((plan === 1 && AuthStore.isUserSubscribed() && user.will_auto_renew) ||
            (plan === 0 && !AuthStore.isUserSubscribed())) {
            showSubmit = false
            confirmText = `You already have a ${SUBSCRIPTION_NAMES[plan]} subscription.`
            title = ''
        }

        let submitText
        if (plan >= user.plan) {
            submitText = 'Upgrade'
            if (!confirmText) {
                if (AuthStore.isUserSubscribed() && !user.will_auto_renew) {
                    confirmText =
                        `You will be automatically billed to renew your subscription on ${user.subscribed_until}. 
                        Are you sure you want to reactivate your subscription?`
                } else {
                    confirmText = `You will be billed and receive ${SUBSCRIPTION_NAMES[plan]} benefits 
                    immediately. Are you sure you want to upgrade your subscription?`
                }
            }
        } else {
            submitText = 'Downgrade'
            confirmText = `Your subscription will be downgraded and your ${SUBSCRIPTION_NAMES[user.plan]} access
                            will expire on ${user.subscribed_until}. Are you sure you want to downgrade?`
        }

        return <Dialog show={showConfirmDialog}
                       onRequestClose={this.handleCloseDialog}
                       style={styles.dialog}>
            <div style={styles.dialogContents}>
                <AlertCircle style={{ color: '#F8BB86' }}/>
                {title && <h3 style={{ fontSize: 24, marginTop: 16 }}>{title}</h3>}
                <div style={{ marginTop: 8, padding: '0 12px' }}>
                    <p style={{ color: '#797979', fontWeight: 200, lineHeight: 1.4 }}>{confirmText}</p>
                </div>
            </div>
            <div>
                <button key="cancel" style={styles.dialogCancelButton} onClick={this.handleCloseDialog}>
                    Cancel
                </button>
                {
                    showSubmit &&
                    <button key="submit"
                            style={styles.dialogActionButton}
                            onClick={this.handleChangeSubscription}>{submitText}</button>
                }
            </div>
        </Dialog>
    }

    renderFailureDialog() {
        const { failed } = this.state

        return <Dialog show={failed}
                       onRequestClose={this.handleCloseFailureDialog}
                       style={styles.failureDialog}>
            <div style={styles.dialogContents}>
                <AlertCircle style={{ color: CommonStyles.errorColor }}/>
                <h3 style={{ fontSize: 24, marginTop: 16 }}>Oops!</h3>
                <div style={{ marginTop: 8, padding: '0 12px' }}>
                    <p style={{ color: '#797979', fontWeight: 200, lineHeight: 1.4 }}>
                        There was an issue with the server while updating your subscription.
                        Please refresh the page and try again.
                    </p>
                </div>
            </div>
            <div>
                <button key="close" style={styles.dialogCancelButton} onClick={this.handleCloseFailureDialog}>
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

    handleChangeSuccess() {
        AccountStore.removeFailureListener(this.handleChangeFailure)
        AccountStore.removeSuccessListener(this.handleChangeSuccess)
        this.setState({
            isProcessing: false,
        })
    }

    handleChangeFailure() {
        AccountStore.removeFailureListener(this.handleChangeFailure)
        AccountStore.removeSuccessListener(this.handleChangeSuccess)

        this.setState({
            isProcessing: false,
            failed: true,
        })
    }

    handleChangeSubscription() {
        const { stripeToken: stripe_token, plan, isProcessing } = this.state

        if (isProcessing) return

        AccountStore.addFailureListener(this.handleChangeFailure)
        AccountStore.addSuccessListener(this.handleChangeSuccess)
        AccountActions.updateSubscription({
            plan,
            stripe_token,
        })

        this.setState({
            isProcessing: true,
            showConfirmDialog: false,
            error: null,
        })
    }

    handleOpenDialog() {
        const { plan, stripeToken } = this.state
        const user = AuthStore.getCurrentUser()
        if (plan !== user.plan && plan > 0 && !user.has_valid_payment && !stripeToken) {
            // We need payment information

            this.setState({
                error: 'Please add your card information in order complete your subscription.',
            })
            return
        }

        this.setState({
            showConfirmDialog: true,
        })
    }

    handleCloseDialog() {
        this.setState({
            showConfirmDialog: false,
        })
    }

    changeSubscription(e) {
        this.setState({
            plan: parseInt(e.target.value, 10),
            error: null,
        })
    }
}
