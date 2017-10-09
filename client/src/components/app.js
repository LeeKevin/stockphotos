import React from 'react'
import { StyleRoot } from 'radium'
import 'normalize.css'
import '../styles/main.scss'
import AuthActions from '../actions/AuthActions'
import AuthStore from '../stores/AuthStore'


export default class App extends React.Component {
    constructor() {
        super()

        let isLoading = false
        if (localStorage.token) {
            const authComplete = () => {
                AuthStore.removeLoginListener(authComplete)
                AuthStore.removeLogoutListener(authComplete)
                this.setState({ isLoading: false })
            }

            AuthStore.onLogin(authComplete)
            AuthStore.onLogout(authComplete)
            AuthActions.authenticateToken(localStorage.token)

            isLoading = true
        }

        this.state = { isLoading }
    }

    render() {
        const { isLoading } = this.state

        return isLoading ?
            <div className="spinner-container">
                <div className="spinner"></div>
            </div> : <StyleRoot>{this.props.children}</StyleRoot>
    }
}
