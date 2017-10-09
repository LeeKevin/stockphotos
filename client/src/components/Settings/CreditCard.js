import React from 'react'
import Radium from 'radium'
import StripeCheckout from 'react-stripe-checkout'
import AccountActions from '../../actions/AccountActions'
import AccountStore from '../../stores/AccountStore'
import CardDetailsStore from '../../stores/CardDetailsStore'
import AuthStore from '../../stores/AuthStore'
import CommonStyles from '../../styles/CommonStyles'
import { Dialog } from '../Common'
import AlertCircle from '../../svg/alert-circle'
import CheckCircle from '../../svg/check-circle'

const STRIPE_KEY = process.env.STRIPE_KEY

const fade = Radium.keyframes({
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
}, 'fade')

const styles = {
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
        opacity: 0,
        animation: 'x 1.4s forwards ease-in-out',
        animationName: fade,
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
export default class CreditCard extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            card: CardDetailsStore.getCardDetails(),
            cardLoaded: false,
        }

        this.onSuccess = this.onSuccess.bind(this)
        this.onFailure = this.onFailure.bind(this)
        this.handleCloseSuccessDialog = this.handleCloseSuccessDialog.bind(this)
        this.handleCloseFailureDialog = this.handleCloseFailureDialog.bind(this)

        this.onToken = (token) => {
            AccountStore.addSuccessListener(this.onSuccess)
            AccountStore.addFailureListener(this.onFailure)
            AccountActions.updateCardDetails(token.id)
        }

        this.loadCard = this.loadCard.bind(this)

        CardDetailsStore.addChangeListener(this.loadCard)
        AccountActions.getCardDetails()
    }

    loadCard() {
        this.setState({
            card: CardDetailsStore.getCardDetails(),
            cardLoaded: true,
        })
    }

    componentWillUnmount() {
        CardDetailsStore.removeChangeListener(this.loadCard)
        AccountStore.removeSuccessListener(this.onSuccess)
        AccountStore.removeFailureListener(this.onFailure)
    }

    render() {
        const { card, isProcessing, cardLoaded } = this.state
        const user = AuthStore.getCurrentUser()

        const loaded = !!(card.funding || cardLoaded)

        return <div>
            <h2 style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 16px 8px 0' }}>
                Update Your Credit Card
            </h2>


            <div style={{ marginTop: 16 }}>
                <p>
                    Update your credit card number here. Your card information is secure and will not be stored on our
                    servers.
                </p>
                {
                    loaded &&
                    <StripeCheckout
                        name="Stockphotos"
                        token={this.onToken}
                        stripeKey={STRIPE_KEY}
                        panelLabel="Update Card Details"
                        email={user.email}
                        allowRememberMe={false}
                        zipCode={true}
                        disabled={!!isProcessing}
                    >
                        <div style={{
                            display: 'inline-block',
                            textAlign: 'center',
                            transition: 'all .3s ease',
                        }}>
                            <button style={styles.cardButton}>
                                {
                                    isProcessing ? 'Updating...' :
                                        `${card.funding ? 'Update' : 'Add'} Card${card.last4 ? ` (${card.last4})` : ''}`
                                }
                            </button>
                        </div>
                    </StripeCheckout>
                }
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
                        Your card has been updated!
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
                        There was an issue with the server while updating your card.
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
