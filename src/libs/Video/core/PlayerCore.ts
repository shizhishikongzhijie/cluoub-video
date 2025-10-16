import {PluginManager} from '../plugins'
import Logger from '../utils/Logger'
import {VideoType} from '../Video.types'
import {EventEmitter} from './EventEmitter'
import {ControlButtonConfig, IPlayerCore, IPlayerPlugin, PlayerComponentConfig} from './IPlayerCore'

/**
 * 播放器核心类，负责管理播放器状态和逻辑
 * 与UI组件解耦，提供统一的事件接口
 * 实现标准化API接口和插件化架构
 */
export class PlayerCore extends EventEmitter implements IPlayerCore {
    // DASH播放器实例
    private _dashPlayer: dashjs.MediaPlayerClass | null = null
    // 管理器
    private _pluginManager: PluginManager
    private logger: Logger
    private isInitialized: boolean = false
    // 插件系统扩展
    private _controlButtons: ControlButtonConfig[] = []
    private _components: PlayerComponentConfig[] = []
    // 定时器
    private _controlsTimeout: ReturnType<typeof setTimeout> | null = null

    constructor(options?: {
        videoSrc?: string | { [key: string]: string }
        videoId?: string
        userId?: string
        username?: string
        videoType?: VideoType
        dataPrefix?: string
    }) {
        super()
        this._videoSrc = options?.videoSrc || ''
        this._videoId = options?.videoId || ''
        this._userId = options?.userId || ''
        this._username = options?.username || ''
        this._videoType = options?.videoType || VideoType.NORMAL
        this._dataPrefix = options?.dataPrefix || ''

        // 初始化日志管理器
        this.logger = Logger.getInstance()
        this.logger.setComponentName('PlayerCore')

        // 确保初始化日志只打印一次
        if (!this.isInitialized) {
            this.logger.initSuccess()
            this.isInitialized = true
        }

        // 初始化插件管理器
        this._pluginManager = new PluginManager(this)

        // 初始化可用画质选项
        this.initAvailableQualities()
    }

    // 视频相关状态
    private _isPlaying: boolean = false

    // Getter方法
    get isPlaying() {
        return this._isPlaying
    }

    private _isMuted: boolean = false

    get isMuted() {
        return this._isMuted
    }

    private _volume: number = 1

    get volume() {
        return this._volume
    }

    private _duration: number = 0

    get duration() {
        return this._duration
    }

    private _currentTime: number = 0

    get currentTime() {
        return this._currentTime
    }

    private _progress: number = 0

    get progress() {
        return this._progress
    }

    private _isFullscreen: boolean = false

    get isFullscreen() {
        return this._isFullscreen
    }

    // 配置
    private _videoSrc: string | { [key: string]: string } = ''

    get videoSrc() {
        return this._videoSrc
    }

    private _videoType: VideoType = VideoType.NORMAL

    get videoType() {
        return this._videoType
    }

    private _dataPrefix: string = ''

    get dataPrefix() {
        return this._dataPrefix
    }

    // 字幕相关
    private _showSubtitles: boolean = true

    get showSubtitles() {
        return this._showSubtitles
    }

    private _currentTrackIndex: number = 0

    get currentTrackIndex() {
        return this._currentTrackIndex
    }

    private _videoId: string = ''

    get videoId() {
        return this._videoId
    }

    private _userId: string = ''

    get userId() {
        return this._userId
    }

    private _username: string = ''

    get username() {
        return this._username
    }

    private _quality: string = 'auto'

    get quality() {
        return this._quality
    }

    private _speed: number = 1.0

    get speed() {
        return this._speed
    }

    // 弹幕相关方法已移除

    private _availableQualities: { key: string; label: string }[] = [{ key: 'auto', label: '自动' }]

    get availableQualities() {
        return this._availableQualities
    }

    togglePlay() {
        this.logger.debug('切换播放状态')
        if (this._isPlaying) {
            this.pause()
        } else {
            this.play()
        }
    }

    // 音量控制方法
    setMuted(muted: boolean) {
        this.logger.debug('设置静音状态', { muted })
        this._isMuted = muted
        this.emit('volumeChange', { isMuted: this._isMuted, volume: this._volume })
    }

    setVolume(volume: number) {
        this.logger.debug('设置音量', { volume })
        this._volume = volume
        this._isMuted = volume === 0
        this.emit('volumeChange', { isMuted: this._isMuted, volume: this._volume })
    }

    toggleMute() {
        this.logger.debug('切换静音状态')
        this.setMuted(!this._isMuted)
    }

    // 播放控制方法
    play() {
        this.logger.debug('播放视频')
        this._isPlaying = true
        this.emit('play')

        // 如果是DASH播放器且已初始化，则直接控制DASH播放器
        if (this._dashPlayer) {
            this._dashPlayer.play()
        }
    }

    setProgress(progress: number) {
        this.logger.debug('设置进度', { progress })
        this._progress = progress
        this.emit('progressChange', progress)
    }

    // 全屏控制方法
    toggleFullscreen() {
        this.logger.debug('切换全屏状态')
        this._isFullscreen = !this._isFullscreen
        this.emit('fullscreenChange', this._isFullscreen)
    }

    // 初始化DASH播放器
    initDashPlayer(videoElement: HTMLVideoElement): void {
        if (
            this._videoType !== VideoType.DASH ||
            typeof this._videoSrc !== 'string' ||
            !this._videoSrc.includes('.mpd')
        ) {
            return
        }

        try {
            // 动态导入dashjs库以避免在非DASH模式下加载
            import('dashjs').then((dashjs) => {
                try {
                    this._dashPlayer = dashjs.MediaPlayer().create()
                    this.logger.info('数据前缀设置为:', this._dataPrefix)
                    // 设置数据前缀（如果提供）
                    if (this._dataPrefix) {
                        // 保存PlayerCore上下文引用

                        const self = this
                        // 确保前缀末尾有斜杠
                        const dataPrefix = self._dataPrefix.endsWith('/') ? self._dataPrefix : self._dataPrefix + '/'

                        // 正确的方式：使用 extend 方法扩展 RequestModifier
                        this._dashPlayer.extend(
                            'RequestModifier',
                            () => {
                                return {
                                    modifyRequestHeader: function (xhr: XMLHttpRequest) {
                                        return xhr
                                    },
                                    modifyRequestURL: function (url: string) {
                                        // 只对相对路径添加前缀
                                        if (url && !/^https?:\/\//.test(url) && !url.startsWith('/')) {
                                            return dataPrefix + url
                                        }
                                        return url
                                    }
                                }
                            },
                            true
                        )
                    }

                    // 配置DASH播放器
                    this._dashPlayer.updateSettings({
                        streaming: {
                            buffer: {
                                stableBufferTime: 20,
                                bufferTimeAtTopQuality: 30
                            },
                            abr: {
                                useDefaultABRRules: true,
                                ABRStrategy: 'abrDynamic'
                            }
                        }
                    })

                    // 附加视频元素
                    this._dashPlayer.initialize(videoElement, this._videoSrc as string, false)

                    this.logger.debug('DASH播放器初始化成功')

                    // 监听DASH播放器的画质变化
                    this._dashPlayer.on('qualityChange', (e: any) => {
                        if (e.mediaType === 'video') {
                            // 更新当前画质状态
                            this.logger.debug('DASH画质变更:', e.newQuality)
                        }
                    })
                } catch (error) {
                    this.logger.error('DASH播放器初始化失败:', error)
                }
            })
        } catch (error) {
            this.logger.error('加载DASH播放器失败:', error)
        }
    }

    // 画质控制方法
    setQuality(quality: string) {
        this.logger.debug('设置画质', { quality })
        this._quality = quality

        // 如果是普通播放器且src是对象
        if (typeof this._videoSrc === 'object' && quality !== 'auto') {
            const videoElement = document.querySelector('video')
            if (videoElement && this._videoSrc[quality]) {
                const currentTime = videoElement.currentTime
                videoElement.src = this._videoSrc[quality]
                videoElement.currentTime = currentTime
                videoElement.play().catch((e) => this.logger.error('播放失败:', e))
            }
        }
        // 如果是DASH播放器且已初始化，则设置画质
        else if (this._dashPlayer) {
            try {
                const dashQuality = this.mapQualityToDash(quality)
                if (dashQuality !== null) {
                    this._dashPlayer.setQualityFor('video', dashQuality)
                } else {
                    // 设置为自动模式
                    this._dashPlayer.setAutoSwitchQualityFor('video', true)
                }
            } catch (error) {
                this.logger.error('设置DASH画质失败:', error)
            }
        }

        this.emit('qualityChange', quality)
    }

    // 倍速控制方法
    setSpeed(speed: number) {
        this.logger.debug('设置播放速度', { speed })
        this._speed = speed

        // 获取视频元素并设置播放速度
        const videoElement = document.querySelector('video')
        if (videoElement) {
            videoElement.playbackRate = speed
        }

        // 如果是DASH播放器且已初始化，则设置播放速度
        if (this._dashPlayer) {
            try {
                this._dashPlayer.setPlaybackRate(speed)
            } catch (error) {
                this.logger.error('设置DASH播放速度失败:', error)
            }
        }

        this.emit('speedChange', speed)
    }

    // 控制按钮注册方法
    registerControlButton(button: ControlButtonConfig): void {
        this.logger.debug('注册控制按钮', { buttonId: button.id })
        // 检查是否已存在相同ID的按钮
        const existingIndex = this._controlButtons.findIndex((b) => b.id === button.id)
        if (existingIndex !== -1) {
            this._controlButtons[existingIndex] = button
        } else {
            this._controlButtons.push(button)
        }
        this.emit('controlButtonsUpdate', this._controlButtons)
    }

    unregisterControlButton(buttonId: string): void {
        this.logger.debug('注销控制按钮', { buttonId })
        const initialLength = this._controlButtons.length
        this._controlButtons = this._controlButtons.filter((button) => button.id !== buttonId)
        if (this._controlButtons.length !== initialLength) {
            this.emit('controlButtonsUpdate', this._controlButtons)
        }
    }

    getControlButtons(): ControlButtonConfig[] {
        return [...this._controlButtons]
    }

    /**
     * 更新控制按钮
     * @param buttonId 要更新的按钮ID
     * @param newButton 新的按钮配置
     */
    updateControlButton(buttonId: string, newButton: Partial<ControlButtonConfig>): void {
        this.logger.debug('更新控制按钮', { buttonId, newButton })
        const index = this._controlButtons.findIndex((button) => button.id === buttonId)
        if (index !== -1) {
            this._controlButtons[index] = { ...this._controlButtons[index], ...newButton }
            this.emit('controlButtonsUpdate', this._controlButtons)
        }
    }

    // 组件注册方法
    registerComponent(component: PlayerComponentConfig): void {
        this.logger.debug('注册播放器组件', { componentId: component.id })
        // 检查是否已存在相同ID的组件
        const existingIndex = this._components.findIndex((c) => c.id === component.id)
        if (existingIndex !== -1) {
            this._components[existingIndex] = component
        } else {
            this._components.push(component)
        }
        this.emit('componentsUpdate', this._components)
    }

    unregisterComponent(componentId: string): void {
        this.logger.debug('注销播放器组件', { componentId })
        const initialLength = this._components.length
        this._components = this._components.filter((component) => component.id !== componentId)
        if (this._components.length !== initialLength) {
            this.emit('componentsUpdate', this._components)
        }
    }

    getComponents(): PlayerComponentConfig[] {
        return [...this._components]
    }

    /**
     * 更新播放器组件
     * @param componentId 要更新的组件ID
     * @param newComponent 新的组件配置
     */
    updateComponent(componentId: string, newComponent: Partial<PlayerComponentConfig>): void {
        this.logger.debug('更新播放器组件', { componentId, newComponent })
        const index = this._components.findIndex((component) => component.id === componentId)
        if (index !== -1) {
            this._components[index] = { ...this._components[index], ...newComponent }
            this.emit('componentsUpdate', this._components)
        }
    }

    // 字幕控制方法
    toggleSubtitles() {
        this.logger.debug('切换字幕显示')
        this._showSubtitles = !this._showSubtitles
        this.emit('subtitlesVisibilityChange', this._showSubtitles)
    }

    setSubtitleTrack(index: number) {
        this.logger.debug('设置字幕轨道', { index })
        this._currentTrackIndex = index
        this.emit('subtitleTrackChange', {
            trackIndex: this._currentTrackIndex,
            showSubtitles: this._showSubtitles
        })
    }

    setShowSubtitles(show: boolean) {
        this.logger.debug('设置字幕显示状态', { show })
        this._showSubtitles = show
        this.emit('subtitlesVisibilityChange', this._showSubtitles)
    }

    // 时间相关方法
    setTimeUpdate(currentTime: number) {
        this._currentTime = currentTime
        if (this._duration) {
            this._progress = (currentTime / this._duration) * 100
        }
        this.emit('timeUpdate', { currentTime: this._currentTime, progress: this._progress })
    }

    setDuration(duration: number) {
        this.logger.debug('设置视频时长', { duration })
        this._duration = duration
        this.emit('durationChange', duration)
    }

    // 控制栏显示方法
    showControls() {
        this.logger.debug('显示控制栏')
        this.emit('controlsVisibilityChange', true)
    }

    // 弹幕相关getter已移除

    hideControls() {
        this.logger.debug('隐藏控制栏')
        this.emit('controlsVisibilityChange', false)
    }

    // 插件系统
    use(plugin: IPlayerPlugin, options?: any) {
        this.logger.debug('使用插件', { plugin: plugin.name, options })
        this._pluginManager.use(plugin, options)
    }

    // 获取插件实例
    getPlugin(pluginName: string): IPlayerPlugin | undefined {
        return this._pluginManager.get(pluginName)
    }

    pause() {
        this.logger.debug('暂停视频')
        this._isPlaying = false
        this.emit('pause')

        // 如果是DASH播放器且已初始化，则直接控制DASH播放器
        if (this._dashPlayer) {
            this._dashPlayer.pause()
        }
    }

    // 进度控制方法
    seek(time: number) {
        this.logger.debug('跳转到指定时间', { time })
        this._currentTime = time
        this._progress = (time / (this._duration || 1)) * 100
        this.emit('seek', { time, progress: this._progress })

        // 如果是DASH播放器且已初始化，则直接控制DASH播放器
        if (this._dashPlayer) {
            this._dashPlayer.seek(time)
        }

        // 强制更新所有监听器
        this.emit('timeUpdate', { currentTime: this._currentTime, progress: this._progress })
    }

    // 清理方法
    destroy() {
        this.logger.debug('销毁播放器核心')
        if (this._controlsTimeout) {
            clearTimeout(this._controlsTimeout)
        }

        // 清理DASH播放器
        if (this._dashPlayer) {
            try {
                this._dashPlayer.reset()
                this._dashPlayer = null
                this.logger.debug('DASH播放器已销毁')
            } catch (error) {
                this.logger.error('销毁DASH播放器失败:', error)
            }
        }

        // 销毁插件
        this._pluginManager.destroy()

        this.removeAllListeners()
    }

    // 初始化可用画质选项
    private initAvailableQualities() {
        if (typeof this._videoSrc === 'object') {
            // 普通播放器模式，src是画质-key链接-value的对象
            this._availableQualities = [
                { key: 'auto', label: '自动' },
                ...Object.keys(this._videoSrc).map((key) => ({
                    key,
                    label: key
                }))
            ]
        } else if (
            this._videoType === VideoType.DASH &&
            typeof this._videoSrc === 'string' &&
            this._videoSrc.includes('.mpd')
        ) {
            // DASH模式，需要解析mpd文件获取画质信息
            // 这里暂时使用默认选项，实际应该解析MPD文件
            this._availableQualities = [
                { key: 'auto', label: '自动' },
                { key: '2160p', label: '2160p' },
                { key: '1440p', label: '1440p' },
                { key: '1080p', label: '1080p' },
                { key: '720p', label: '720p' },
                { key: '480p', label: '480p' },
                { key: '360p', label: '360p' }
            ]
        } else {
            // 默认选项
            this._availableQualities = [{ key: 'auto', label: '自动' }]
        }

        this.emit('availableQualitiesChange', this._availableQualities)
    }

    // 将画质映射到DASH的表示索引
    private mapQualityToDash(quality: string): number | null {
        // 在实际应用中，这里需要根据DASH的表示信息来映射
        // 这里只是一个示例映射
        switch (quality) {
            case '2160p':
                return 0
            case '1440p':
                return 1
            case '1080p':
                return 2
            case '720p':
                return 3
            case '480p':
                return 4
            case '360p':
                return 5
            default:
                return null // 自动模式
        }
    }
}
