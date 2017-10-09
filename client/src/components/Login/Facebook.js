import React from 'react'
import { FacebookActions, FACEBOOK_SDK_LOADED } from '../../actions/FacebookActions'
import FacebookStore from '../../stores/FacebookStore'
import ObjectUtils from '../../utils/ObjectUtils'

const APP_ID = '1337129122996562'

window.fbAsyncInit = () => {
    FacebookActions.loadSDK(APP_ID)
}

export default class Facebook extends React.Component {

    static propTypes = {
        button: React.PropTypes.element.isRequired,
        disabled: React.PropTypes.bool,
        onClick: React.PropTypes.func,
        redirectUri: React.PropTypes.string,
        reAuthenticate: React.PropTypes.bool,
        disableMobileRedirect: React.PropTypes.bool,
        callback: React.PropTypes.func.isRequired,
        language: React.PropTypes.string,
    }

    static defaultProps = {
        redirectUri: typeof window !== 'undefined' ? window.location.href : '/',
        scope: 'public_profile,email',
        reAuthenticate: false,
        language: 'en_US',
        disableMobileRedirect: false,
    }

    constructor() {
        super()

        this.clickButton = this.clickButton.bind(this)
        this.loadSDK = this.loadSDK.bind(this)

        this.checkLoginAfterRefresh = (response) => {
            if (response.status === 'unknown') {
                window.FB.login(loginResponse => this.checkLoginState(loginResponse), true)
            } else {
                this.checkLoginState(response)
            }
        }

        this.checkLoginState = (response) => {
            this.setState({ isProcessing: false })
            if (response.authResponse) {
                this.props.callback(response.authResponse)
            } else if (this.props.callback) {
                this.props.callback({ status: response.status })
            }
        }

        this.state = {
            isLoaded: false,
            isProcessing: false,
        }
    }

    loadSDK() {
        this.setState({ isLoaded: true })
        // window.FB.getLoginStatus(this.checkLoginAfterRefresh)
    }

    componentDidMount() {
        FacebookStore.on(FACEBOOK_SDK_LOADED, this.loadSDK)

        if (document.getElementById('facebook-jssdk')) {
            this.loadSDK()
            return
        }

        const { language } = this.props;
        ((d, s, id) => {
            const element = d.getElementsByTagName(s)[0]
            const fjs = element
            let js = element
            if (d.getElementById(id)) {
                return
            }
            js = d.createElement(s)
            js.id = id
            js.src = `//connect.facebook.net/${language}/all.js`
            fjs.parentNode.insertBefore(js, fjs)
        })(document, 'script', 'facebook-jssdk')

        let fbRoot = document.getElementById('fb-root')
        if (!fbRoot) {
            fbRoot = document.createElement('div')
            fbRoot.id = 'fb-root'
            document.body.appendChild(fbRoot)
        }
    }


    componentWillUnmount() {
        FacebookStore.removeListener(FACEBOOK_SDK_LOADED, this.loadSDK)
    }

    render() {
        const { button, disabled } = this.props,
            { isLoaded, isProcessing } = this.state,
            buttonDisabled = !isLoaded || isProcessing || disabled

        const facebookButton = React.cloneElement(
            button,
            {
                key: 'facebook-button',
                onClick: this.clickButton,
                style: { ...button.props.style, cursor: buttonDisabled ? 'default' : 'pointer' },
            },
        )


        return (
            <div style={{ opacity: buttonDisabled ? 0.6 : 1, transition: 'opacity 0.5s ease' }}>
                {facebookButton}
            </div>
        )
    }

    clickButton() {
        if (!this.state.isLoaded || this.state.isProcessing || this.props.disabled) {
            return
        }

        this.setState({ isProcessing: true })

        const { scope, onClick, reAuthenticate, redirectUri, disableMobileRedirect } = this.props

        if (typeof onClick === 'function') {
            onClick()
        }

        let isMobile = false

        try {
            isMobile =
                ((window.navigator && window.navigator.standalone) || navigator.userAgent.match('CriOS') ||
                navigator.userAgent.match(/mobile/i))
        } catch (ex) {
            // continue regardless of error
        }

        const params = {
            client_id: APP_ID,
            redirect_uri: redirectUri,
            state: 'facebookdirect',
            scope,
        }

        if (reAuthenticate) {
            params.auth_type = 'reauthenticate'
        }

        if (isMobile && !disableMobileRedirect) {
            window.location.href = `//www.facebook.com/dialog/oauth?${ObjectUtils.encodeQueryString(params)}`
        } else {
            window.FB.login(this.checkLoginState, { scope, auth_type: params.auth_type })
        }
    }
}
