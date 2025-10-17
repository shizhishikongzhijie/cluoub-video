/**
 * 控制管理器，负责处理播放器控制栏的显示/隐藏逻辑
 */
export class ControlsManager {
    private _controlsTimeout: ReturnType<typeof setTimeout> | null = null
    private _isPlaying: boolean = false
    private readonly _hideDelay: number = 3000 // 3秒后隐藏控制栏

    constructor(isPlaying?: boolean) {
        this.init(isPlaying || true)
    }

    private _showControls: boolean = true

    /**
     * 获取当前控制栏显示状态
     */
    get showControls(): boolean {
        return this._showControls
    }

    /**
     * 检查是否有Popover处于激活状态
     * 使用CSS类选择器来检测
     */
    private _hasActivePopover(): boolean {
        // 检查是否有显示中的Popover元素（具有entered或entering类的Popover）
        return document.querySelectorAll('.popover.entered, .popover.entering').length > 0
    }

    /**
     * 初始化控制栏管理器
     * @param isPlaying 初始播放状态
     */
    init(isPlaying: boolean) {
        this._isPlaying = isPlaying
        this._showControls = true
    }

    /**
     * 处理鼠标移动事件
     * @param onShowControls 控制栏显示状态变化回调
     */
    handleMouseMove(onShowControls: (show: boolean) => void) {
        this._showControls = true
        onShowControls(true)

        if (this._controlsTimeout) {
            clearTimeout(this._controlsTimeout)
        }

        this._controlsTimeout = setTimeout(() => {
            // 如果有Popover激活或者没有播放，不要隐藏控制栏
            if (this._isPlaying && !this._hasActivePopover()) {
                this._showControls = false
                onShowControls(false)
            }
        }, this._hideDelay)
    }

    /**
     * 更新播放状态
     * @param isPlaying 是否正在播放
     */
    updatePlayingState(isPlaying: boolean) {
        this._isPlaying = isPlaying

        // 如果正在播放且控制栏超时，隐藏控制栏
        if (isPlaying && this._controlsTimeout) {
            clearTimeout(this._controlsTimeout)
            this._controlsTimeout = setTimeout(() => {
                // 如果有Popover激活，不要隐藏控制栏
                if (!this._hasActivePopover()) {
                    this._showControls = false
                }
            }, this._hideDelay)
        }
    }

    /**
     * 重置隐藏计时器
     */
    resetHideTimeout(): void {
        if (this._controlsTimeout) {
            clearTimeout(this._controlsTimeout)
        }
        this._showControls = true
    }

    /**
     * 清理资源
     */
    destroy() {
        if (this._controlsTimeout) {
            clearTimeout(this._controlsTimeout)
        }
    }
}
