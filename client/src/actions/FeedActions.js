import Dispatcher from '../Dispatcher'
import Feed from '../api/Feed'

export const LOAD_FEED = 'LOAD_FEED'

export const FeedServerActions = {
    loadFeed(feed) {
        Dispatcher.dispatch({
            type: LOAD_FEED,
            data: feed,
        })
    },
}

export const FeedActions = {
    getFeed() {
        Feed.getFeed()
            .then(FeedServerActions.loadFeed)
    },
}

export default FeedActions
