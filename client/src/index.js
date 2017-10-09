import React from 'react'
import { render } from 'react-dom'
import { Router, Route, IndexRoute, IndexRedirect, useRouterHistory } from 'react-router'
import { createHistory } from 'history'
import AuthStore from './stores/AuthStore'
import AuthActions from './actions/AuthActions'
import App from './components/app'
import Container from './components/Container'
import Home from './components/Home'
import Login from './components/Login/Login'
import Premium from './components/Subscriptions/Premium'
import { Settings, Account, Subscription, Password, Invoices, Invoice, CreditCard } from './components/Settings'

const injectTapEventPlugin = require('react-tap-event-plugin')
require('babel-polyfill')

injectTapEventPlugin()


const history = useRouterHistory(createHistory)({
    basename: '/',
})

function requireNoPremium(nextState, replace) {
    if (AuthStore.isUserSubscribed()) {
        replace({
            pathname: '/',
        })
    }
}

function requireLoggedIn(nextState, replace) {
    if (!AuthStore.getCurrentUser()) {
        replace({
            pathname: '/sign-in',
        })
    }
}

function logout(nextState, replace) {
    AuthActions.logOut()
    replace({ pathname: '/' })
}


render((
        <App>
            <Router history={history} onUpdate={() => window.scrollTo(0, 0)}>
                <Route path="/sign-in" component={Login}/>
                <Route path="/logout" onEnter={logout}/>

                <Route path="/settings/invoices/:id" component={Invoice}/>
                <Route path="/" component={Container}>
                    <IndexRoute component={Home}/>
                    <Route path="premium" component={Premium} onEnter={requireNoPremium}/>
                    <Route path="settings" onEnter={requireLoggedIn} component={Settings}>
                        <IndexRedirect to="account"/>
                        <Route path="account" component={Account}/>
                        <Route path="password" component={Password}/>
                        <Route path="subscription" component={Subscription}/>
                        <Route path="invoices" component={Invoices}/>
                        <Route path="card" component={CreditCard}/>
                    </Route>
                    <Route path="user" onEnter={requireLoggedIn} component={User}>
                        <IndexRoute component={Profile}/>
                    </Route>
                </Route>
            </Router>
        </App>
    ),
    document.getElementById('app'),
)
