export default {
    encodeQueryString(params) {
        if (!this.isObject(params)) return ''

        const str = Object.keys(params).reduce((s, p) => {
            if (Object.prototype.hasOwnProperty.call(params, p)) {
                str.push(`${encodeURIComponent(p)}=${encodeURIComponent(params[p])}`)
            }

            return s
        }, [])

        return str.join('&')
    },
}
