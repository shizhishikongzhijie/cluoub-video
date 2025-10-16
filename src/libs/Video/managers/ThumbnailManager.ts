/**
 * 缩略图管理器，负责处理视频预览缩略图的加载和显示
 */
export class ThumbnailManager {
    constructor() {}

    private _thumbnailUrl: string | undefined

    // Getter方法
    get thumbnailUrl(): string | undefined {
        return this._thumbnailUrl
    }

    private _preloadImage: HTMLImageElement | null = null

    get preloadImage(): HTMLImageElement | null {
        return this._preloadImage
    }

    private _isThumbnailVisible: boolean = false

    get isThumbnailVisible(): boolean {
        return this._isThumbnailVisible
    }

    private _thumbnailPosition: { x: number; time: number } = { x: 0, time: 0 }

    get thumbnailPosition(): { x: number; time: number } {
        return this._thumbnailPosition
    }

    /**
     * 初始化缩略图管理器
     * @param thumbnailUrl 缩略图URL
     */
    init(thumbnailUrl?: string) {
        this._thumbnailUrl = thumbnailUrl
        if (thumbnailUrl) {
            this._preloadThumbnail()
        }
    }

    /**
     * 显示缩略图
     * @param position 缩略图位置信息
     */
    showThumbnail(position: { x: number; time: number }) {
        this._isThumbnailVisible = true
        this._thumbnailPosition = position
    }

    /**
     * 隐藏缩略图
     */
    hideThumbnail() {
        this._isThumbnailVisible = false
    }

    /**
     * 更新缩略图URL
     * @param thumbnailUrl 新的缩略图URL
     */
    updateThumbnailUrl(thumbnailUrl?: string) {
        if (this._thumbnailUrl !== thumbnailUrl) {
            this._thumbnailUrl = thumbnailUrl
            if (thumbnailUrl) {
                this._preloadThumbnail()
            } else {
                this._preloadImage = null
            }
        }
    }

    /**
     * 清理资源
     */
    destroy() {
        this._preloadImage = null
    }

    /**
     * 预加载缩略图
     */
    private _preloadThumbnail() {
        if (this._thumbnailUrl) {
            this._preloadImage = new Image()
            this._preloadImage.src = this._thumbnailUrl
        }
    }
}
