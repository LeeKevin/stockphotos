import Dispatcher from '../Dispatcher'

export const FACEBOOK_SDK_LOADED = 'FACEBOOK_SDK_LOADED'


export const FacebookActions = {
    loadSDK(appId) {
        window.FB.init({
            version: 'v2.6',
            appId: appId,
            xfbml: true,
        })

        Dispatcher.dispatch({
            type: FACEBOOK_SDK_LOADED,
        })
    },
}

export default FacebookActions
