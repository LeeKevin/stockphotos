export default {
    isLoading(state) {
        document.body.className = state ?
            `${document.body.className} loading-cursor`.trim() :
            document.body.className.replace('loading-cursor', '').trim()
    },
}
