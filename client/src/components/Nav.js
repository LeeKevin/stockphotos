import React from 'react'
import Radium from 'radium'
import { Link } from 'react-router'
import AuthStore from '../stores/AuthStore'
import FlashMessageEmitter from '../stores/FlashMessageEmitter'
import UserMenu from './UserMenu'
import CommonStyles from '../styles/CommonStyles'
import { FlashMessage } from './Common'

const styles = {
    header: {
        display: 'flex',
        position: 'fixed',
        top: 0,
        right: 0,
        left: 0,
        zIndex: 100,
        padding: '0 32px 0',
        alignItems: 'center',
        height: 60,
        backgroundColor: 'rgba(255,255,255, 0.9)',
        transition: 'top .3s ease',
    },
    logo: {
        textAlign: 'center',
        height: 42,
        width: 42,
        lineHeight: '42px',
        borderRadius: 100,
        backgroundColor: '#666',
        display: 'inline-block',
        color: '#fff',
        fontSize: 36,
    },
    headerSection: {
        display: 'inline-block',
        flex: 1,
    },
    menu: {
        padding: 0,
        margin: 0,
        listStyle: 'none',
        textAlign: 'center',
        fontWeight: 'bold',
        textTransform: 'lowercase',
        letterSpacing: 1,
        fontSize: 12,
    },
    menuItem: {
        display: 'inline-block',
        padding: '4px 8px',
        margin: '4px 8px',
    },
    buttonMenuItem: {
        display: 'inline-block',
        padding: '6px 8px',
        borderStyle: 'solid',
        borderWidth: 2,
        borderColor: '#AAA',
        transition: 'all .2s ease',
        fontSize: 12,
        color: '#AAA',
        ':hover': {
            color: '#666',
            borderColor: '#666',
        },
    },
    linkActive: {
        borderBottom: '1px solid #666',
    },
    profileContainer: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        position: 'relative',
    },
    profileImage: {
        borderRadius: 100,
        width: 24,
        height: 24,
        display: 'inline-block',
        overflow: 'hidden',
        position: 'relative',
        textAlign: 'center',
        lineHeight: '24px',
        backgroundColor: '#BBB',
        fontSize: 12,
        letterSpacing: 1,
        paddingLeft: 1,
        color: '#fff',
        marginRight: 8,
    },
    flashMessageContainer: {
        position: 'fixed',
        top: 0,
        right: 0,
        left: 0,
        zIndex: 100,
        padding: 0,
    },
    flashMessage: {
        minHeight: 42,
        maxHeight: 42,
        backgroundColor: CommonStyles.mainColor,
        color: '#fff',
        padding: '0 24px 0 40px',
        display: 'flex',
    },
}


@Radium
export default class Nav extends React.Component {
    static contextTypes = {
        router: React.PropTypes.object.isRequired,
    }

    constructor() {
        super()

        this.state = {
            showProfileMenu: false,
            user: AuthStore.getCurrentUser(),
        }

        this.openProfileMenu = () => this.setState({ showProfileMenu: true })
        this.closeProfileMenu = () => this.setState({ showProfileMenu: false })
        this.toggleProfileMenu = () => this.setState(prevState => ({ showProfileMenu: !prevState.showProfileMenu }))
        this.hideFlashMessage = this.hideFlashMessage.bind(this)

        this.onLogout = this.onLogout.bind(this)
        this.onFlashMessage = this.onFlashMessage.bind(this)
        AuthStore.onLogout(this.onLogout)
        FlashMessageEmitter.addMessageListener(this.onFlashMessage)

        this.loadUser = this.loadUser.bind(this)
        AuthStore.onChangeUser(this.loadUser)
    }

    loadUser() {
        this.setState({ user: AuthStore.getCurrentUser() })
    }

    componentWillUnmount() {
        AuthStore.removeLogoutListener(this.onLogout)
        AuthStore.removeUserListener(this.loadUser)
    }

    onFlashMessage(message) {
        this.setState({
            flashMessage: message,
        })
    }

    onLogout() {
        this.setState({ showProfileMenu: false, user: null })
        this.context.router.push('/')
    }

    render() {
        const { showProfileMenu, flashMessage, user } = this.state

        let headerStyle = styles.header
        if (flashMessage) {
            headerStyle = { ...headerStyle, top: 42 }
        }

        return (
            <div style={{ position: 'relative' }}>
                <FlashMessage
                    onHide={this.hideFlashMessage}
                    show={!!flashMessage}
                    autoHideDuration={0}
                    style={styles.flashMessage}
                    containerStyle={styles.flashMessageContainer}>
                    {flashMessage}
                </FlashMessage>
                <header style={headerStyle}>
                    <div style={styles.headerSection}>
                        <Link to="/"><span style={styles.logo}>S</span></Link>
                    </div>
                    <div style={{ ...styles.headerSection, flex: 2 }}>
                        <ul style={styles.menu}>
                            <li style={styles.menuItem}>
                                <Link to="/" activeStyle={styles.linkActive}>Home</Link>
                            </li>
                            {
                                !(user && (new Date(user.subscribed_until)) >= (new Date())) &&
                                <li style={{ ...styles.menuItem, padding: 0 }}>

                                    <Link to="/premium">
                                        <div key="premium" style={styles.buttonMenuItem}>Premium</div>
                                    </Link>
                                </li>
                            }
                        </ul>
                    </div>
                    <div style={styles.headerSection}>
                        <div style={{
                            textAlign: 'right',
                            fontSize: 15,
                            fontWeight: 'normal',
                        }}>
                            {
                                user ?
                                    <div
                                        style={{
                                            overflow: showProfileMenu ? 'visible' : 'hidden',
                                            position: 'relative',
                                        }}

                                    >
                                        <div style={{ display: 'inline-block' }}
                                             onMouseEnter={this.openProfileMenu}
                                             onMouseLeave={this.closeProfileMenu}
                                        >
                                            <div
                                                style={styles.profileContainer}
                                                onClick={this.toggleProfileMenu}
                                            >
                                                <a style={styles.profileImage}>
                                                    {
                                                        user.picture ?
                                                            <img src={user.picture.url} style={{ width: '100%' }}/> :
                                                            'KL'
                                                    }
                                                </a>
                                                <div>
                                                    {user.full_name}
                                                </div>
                                            </div>
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                right: 0,
                                                padding: '16px 0',
                                                marginTop: -7,
                                                transform: showProfileMenu ?
                                                    'scale(1) translate(0)' :
                                                    'scale(.8) translate(10%, -10%)',
                                                opacity: showProfileMenu ? 1 : 0,
                                                transition: 'all .3s ease, opacity .1s ease-in-out',
                                            }}>
                                                <UserMenu />
                                            </div>
                                        </div>
                                    </div> :
                                    <div style={{
                                        textTransform: 'lowercase',
                                        letterSpacing: 1,
                                    }}>
                                        <Link to="/sign-in">
                                            <div key="sign-in" style={styles.buttonMenuItem}>
                                                Sign In
                                            </div>
                                        </Link>
                                    </div>
                            }
                        </div>
                    </div>
                </header>
                <div style={{
                    minHeight: headerStyle.height + headerStyle.top,
                    transition: 'min-height ease .4s',
                }}/>
            </div>
        )
    }

    hideFlashMessage() {
        this.setState({
            flashMessage: null,
        })
    }
}
