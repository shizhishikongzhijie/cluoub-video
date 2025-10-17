export interface SvgIconProps {
    /**
     * SVG内容，可以是SVG字符串或URL
     */
    src: string

    /**
     * 图标大小
     */
    size?: number | string

    /**
     * primary样式
     */
    primary?: boolean

    /**
     * 无背景样式
     */
    noBackground?: boolean

    /**
     * 是否为原始SVG字符串
     */
    isRaw?: boolean

    /**
     * 点击事件处理函数
     */
    onClick?: () => void

    /**
     * 鼠标悬停事件处理函数
     */
    onMouseEnter?: () => void

    /**
     * 鼠标离开事件处理函数
     */
    onMouseLeave?: () => void
}

export type SvgIconRef = SVGSVGElement
