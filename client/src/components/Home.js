import React from 'react'
import Radium from 'radium'
import FeedStore from '../stores/FeedStore'
import FeedActions from '../actions/FeedActions'
import Image from './Image'

const styles = {
    feedContainer: {
        textAlign: 'center',
    },
}

@Radium
export default class Home extends React.Component {

    constructor() {
        super()

        this.state = {
            feed: [],
        }

        this.loadFeed = this.loadFeed.bind(this)
    }

    loadFeed() {
        this.setState({
            feed: FeedStore.getFeed(),
        })
    }

    componentDidMount() {
        FeedStore.addChangeListener(this.loadFeed)

        FeedActions.getFeed()
    }

    componentWillUnmount() {
        FeedStore.removeChangeListener(this.loadFeed)
    }

    render() {
        const { feed } = this.state

        return (
            <div style={styles.feedContainer}>
                {feed.map(photo => <Image key={photo.id} url={photo.url} height={photo.height} width={photo.width}/>)}
            </div>
        )
    }
}
