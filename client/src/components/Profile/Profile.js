import React from 'react'
import Radium from 'radium'
import AuthStore from '../../stores/AuthStore'


const styles = {}


@Radium
export default class Subscription extends React.Component {
    constructor(props) {
        super(props)

        const user = AuthStore.getCurrentUser()

        this.state = {}
    }

    render() {


        return <div>

        </div>
    }

}
