import Dispatcher from '../Dispatcher'
import PhotoPacks from '../api/PhotoPacks'

export const LOAD_MY_PHOTO_PACKS = 'LOAD_MY_PHOTO_PACKS'

export const PhotoPackServerActions = {
    loadFeed(packs) {
        Dispatcher.dispatch({
            type: LOAD_MY_PHOTO_PACKS,
            data: packs,
        })
    },
}

export const PhotoPackActions = {
    getMyPhotoPacks() {
        PhotoPacks
            .getMyPhotoPacks()
            .then(PhotoPackServerActions.loadMyPhotoPacks)
    },
}

export default PhotoPackActions
