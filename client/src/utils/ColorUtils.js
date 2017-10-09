function sbcRip(val) {
    const i = parseInt,
        r = Math.round

    let d = val
    const l = d.length,
        RGB = {}
    if (l > 9) {
        d = d.split(',')
        if (d.length < 3 || d.length > 4) return null // ErrorCheck
        RGB[0] = i(d[0].slice(4))
        RGB[1] = i(d[1])
        RGB[2] = i(d[2])
        RGB[3] = d[3] ? parseFloat(d[3]) : -1
    } else {
        if (l === 8 || l === 6 || l < 4) return null // ErrorCheck
        if (l < 6) d = `#${d[1]}${d[1]}${d[2]}${d[2]}${d[3]}${d[3]}${l > 4 ? `${d[4]}${d[4]}` : ''}` // 3
        // digit
        d = i(d.slice(1), 16)
        // eslint-disable-next-line no-bitwise
        RGB[0] = (d >> 16) & 255
        // eslint-disable-next-line no-bitwise
        RGB[1] = (d >> 8) & 255
        // eslint-disable-next-line no-bitwise
        RGB[2] = d & 255
        // eslint-disable-next-line no-bitwise
        RGB[3] = l === 9 || l === 5 ? r((((d >> 24) & 255) / 255) * 10000) / 10000 : -1
    }
    return RGB
}

export default {
    // See http://stackoverflow.com/a/13542669/4264463
    shadeBlendConvert(percent, fromColor, toColor) {
        const from = fromColor,
            r = Math.round,
            b = percent < 0,
            p = b ? percent * -1 : percent,
            to = toColor && toColor !== 'c' ?
                toColor : ((b && '#000000') || '#FFFFFF'),
            f = sbcRip(from),
            t = sbcRip(to)

        let h = from.length > 9
        if (typeof (to) === 'string') {
            if (to.length > 9) {
                h = true
            } else if (to === 'c') {
                h = !h
            } else {
                h = false
            }
        }

        if (typeof (p) !== 'number' || p < -1 || p > 1 || typeof (from) !== 'string' ||
            (from[0] !== 'r' && from[0] !== '#') ||
            (typeof (to) !== 'string' && typeof (to) !== 'undefined')) return null // ErrorCheck

        if (!f || !t) return null // ErrorCheck
        if (h) {
            let c3
            if (f[3] > -1 && t[3] > -1) {
                c3 = r((((t[3] - f[3]) * p) + f[3]) * 10000) / 10000
            } else if (t[3] < 0) {
                c3 = f[3]
            } else {
                c3 = t[3]
            }

            return `rgb(${r(((t[0] - f[0]) * p) + f[0])},${r(((t[1] - f[1]) * p) + f[1])},${
                r(((t[2] - f[2]) * p) + f[2])}${f[3] < 0 && t[3] < 0 ?
                ')' :
                `,${c3})`}`
        }

        let val1
        if (f[3] > -1 && t[3] > -1) {
            val1 = r((((t[3] - f[3]) * p) + f[3]) * 255)
        } else if (t[3] > -1) {
            val1 = r(t[3] * 255)
        } else if (f[3] > -1) {
            val1 = r(f[3] * 255)
        } else {
            val1 = 255
        }

        return `#${(0x100000000 + (val1 * 0x1000000) + (r(((t[0] - f[0]) * p) + f[0]) * 0x10000) +
        (r(((t[1] - f[1]) * p) + f[1]) * 0x100) +
        r(((t[2] - f[2]) * p) + f[2])).toString(16).slice(f[3] > -1 || t[3] > -1 ? 1 : 3)}`
    },
}
