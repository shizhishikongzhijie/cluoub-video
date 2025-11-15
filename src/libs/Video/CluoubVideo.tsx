import React, {useEffect, useRef, useState} from 'react'

import FullscreenButton from './components/FullscreenButton'
import PipButton from './components/PipButton'
import PlayButton from './components/PlayButton'
import ProgressControl from './components/ProgressControl'
import QualityButton from './components/QualityButton'
import SettingsButton from './components/SettingsButton'
import SpeedButton from './components/SpeedButton'
import SubtitlesMenu from './components/SubtitlesMenu'
import TimeDisplay from './components/TimeDisplay'
import VolumeControl from './components/VolumeControl'
import {ControlButtonConfig, IPlayerPlugin, PlayerComponentConfig} from './core'
import {useControlsManager, usePlayerCore, useThumbnailManager} from './hooks'
import {useControlsVisibility} from './hooks/useControlsVisibility'
import {useKeyboardShortcuts} from './hooks/useKeyboardShortcuts'
import {useSubtitles} from './hooks/useSubtitles'
import {useVideoEvents} from './hooks/useVideoEvents'
import {CoverPlugin} from './plugins'
import Logger from './utils/Logger'
import {VideoProps, VideoRef, VideoType} from './Video.types'

const CluoubVideo: React.ForwardRefRenderFunction<VideoRef, VideoProps> = (props, ref) => {
    const {
        videoSrc,
        videoType,
        dataPrefix,
        width = '100%',
        height = 'auto',
        aspectRatio = '16:9',
        controls = {
            play: true,
            volume: true,
            time: true,
            progress: true,
            settings: true,
            fullscreen: true,
            barrage: true,
            subtitles: true,
            quality: true,
            speed: true,
            pip: true
        },
        customIcons,
        thumbnailUrl,
        thumbnailWidth = 120,
        thumbnailHeight = 80,
        tracks = [],
        enableShortcuts = true,
        debug = false,
        plugins = [],
        coverImage,
        showCover = true
    } = props
    const logger = Logger.getInstance()
    logger.setComponentName('CluoubVideo')
    logger.setDebugMode(debug)

    // 使用useRef确保初始化日志只打印一次
    const isInitialized = useRef(false)

    if (!isInitialized.current) {
        logger.initSuccess()
        isInitialized.current = true
    }

    // 使用播放器核心
    const playerCore = usePlayerCore({
        videoSrc: typeof videoSrc === 'string' ? videoSrc : videoSrc || '',
        videoType: videoType || VideoType.DASH,
        dataPrefix: dataPrefix || ''
    })

    // 组件ref，用于暴露方法给外部
    const exposedRef = useRef<VideoRef>({
        play: () => playerCore.play(),
        pause: () => playerCore.pause(),
        togglePlay: () => playerCore.togglePlay(),
        seekTo: (time: number) => playerCore.seek(time),
        setVolume: (volume: number) => playerCore.setVolume(volume),
        toggleMute: () => playerCore.toggleMute(),
        toggleFullscreen: () => playerCore.toggleFullscreen(),
        getPlugin: (pluginName: string) => playerCore.getPlugin(pluginName),
        get currentTime() {
            return currentTime
        },
        get duration() {
            return duration
        },
        get isPlaying() {
            return isPlaying
        }
    })

    // 处理外部传入的ref
    React.useImperativeHandle(ref, () => exposedRef.current)

    // 从插件系统获取控制按钮和组件
    const [controlButtons, setControlButtons] = useState<ControlButtonConfig[]>([])

    // 从插件系统获取注册的组件
    const [pluginComponents, setPluginComponents] = useState<PlayerComponentConfig[]>([])

    // 使用控制栏管理器
    const controlsManager = useControlsManager()

    // 使用缩略图管理器
    const thumbnailManager = useThumbnailManager(thumbnailUrl)

    // 状态管理
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [volume, setVolume] = useState(1)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [showThumbnail, setShowThumbnail] = useState(false)
    const [thumbnailPosition, setThumbnailPosition] = useState({ x: 0, time: 0 })
    const [buffered, setBuffered] = useState(0)

    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // 使用控制栏可见性Hook
    const { showControls } = useControlsVisibility(containerRef as React.RefObject<HTMLDivElement>, controlsManager)

    // 监听播放器核心事件
    useEffect(() => {
        const handlePlay = () => setIsPlaying(true)
        const handlePause = () => setIsPlaying(false)
        const handleVolumeChange = (data: { isMuted: boolean; volume: number }) => {
            setIsMuted(data.isMuted)
            setVolume(data.volume)
        }
        const handleSeek = (data: { time: number; progress: number }) => {
            setCurrentTime(data.time)
            setProgress(data.progress)
        }
        const handleProgressChange = (progress: number) => {
            setProgress(progress)
        }
        const handleFullscreenChange = (fullscreen: boolean) => {
            setIsFullscreen(fullscreen)
            // 实际执行全屏操作
            handleFullscreenToggle(fullscreen)
        }

        const handleTimeUpdate = (data: { currentTime: number; progress: number }) => {
            setCurrentTime(data.currentTime)
            setProgress(data.progress)
        }
        const handleDurationChange = (duration: number) => {
            setDuration(duration)
        }

        // 字幕相关事件处理
        const handleSubtitleTrackChange = ({
            trackIndex,
            showSubtitles
        }: {
            trackIndex: number
            showSubtitles: boolean
        }) => {
            const video = videoRef.current
            if (!video || !video.textTracks) return

            logger.debug(
                'PlayerCore subtitle track changed:',
                {
                    trackIndex,
                    showSubtitles
                },
                'Track count:',
                video.textTracks.length
            )

            if (showSubtitles && video.textTracks.length > 0) {
                const validIndex = Math.min(trackIndex, video.textTracks.length - 1)
                for (let i = 0; i < video.textTracks.length; i++) {
                    video.textTracks[i].mode = i === validIndex ? 'showing' : 'hidden'
                }
            } else {
                for (let i = 0; i < video.textTracks.length; i++) {
                    video.textTracks[i].mode = 'hidden'
                }
            }
        }

        const handleSubtitlesVisibilityChange = (show: boolean) => {
            const video = videoRef.current
            if (!video || !video.textTracks) return

            logger.debug('PlayerCore subtitle visibility changed:', { show })

            const trackIndex = playerCore.currentTrackIndex
            if (show && video.textTracks.length > 0) {
                const validIndex = Math.min(trackIndex, video.textTracks.length - 1)
                for (let i = 0; i < video.textTracks.length; i++) {
                    video.textTracks[i].mode = i === validIndex ? 'showing' : 'hidden'
                }
            } else {
                for (let i = 0; i < video.textTracks.length; i++) {
                    video.textTracks[i].mode = 'hidden'
                }
            }
        }

        playerCore.on('play', handlePlay)
        playerCore.on('pause', handlePause)
        playerCore.on('volumeChange', handleVolumeChange)
        playerCore.on('seek', handleSeek)
        playerCore.on('progressChange', handleProgressChange)
        playerCore.on('bufferedChange', handleBufferedChange)
        playerCore.on('fullscreenChange', handleFullscreenChange)

        playerCore.on('timeUpdate', handleTimeUpdate)
        playerCore.on('durationChange', handleDurationChange)
        playerCore.on('subtitleTrackChange', handleSubtitleTrackChange)
        playerCore.on('subtitlesVisibilityChange', handleSubtitlesVisibilityChange)

        return () => {
            playerCore.removeListener('play', handlePlay)
            playerCore.removeListener('pause', handlePause)
            playerCore.removeListener('volumeChange', handleVolumeChange)
            playerCore.removeListener('seek', handleSeek)
            playerCore.removeListener('progressChange', handleProgressChange)
            playerCore.removeListener('bufferedChange', handleBufferedChange)
            playerCore.removeListener('fullscreenChange', handleFullscreenChange)

            playerCore.removeListener('timeUpdate', handleTimeUpdate)
            playerCore.removeListener('durationChange', handleDurationChange)
            playerCore.removeListener('subtitleTrackChange', handleSubtitleTrackChange)
            playerCore.removeListener('subtitlesVisibilityChange', handleSubtitlesVisibilityChange)
        }
    }, [playerCore])
    // 初始化用户提供的插件
    // 第一个useEffect：先注册事件监听器
    useEffect(() => {
        const handleControlButtonsUpdate = (buttons: any) => {
            setControlButtons(buttons)
        }

        const handleComponentsUpdate = (components: any) => {
            setPluginComponents(components)
        }

        // 监听插件组件变化事件
        playerCore.on('controlButtonsUpdate', handleControlButtonsUpdate)

        // 监听插件注册的组件更新事件
        playerCore.on('componentsUpdate', handleComponentsUpdate)

        // 清理函数
        return () => {
            playerCore.removeListener('controlButtonsUpdate', handleControlButtonsUpdate)
            playerCore.removeListener('componentsUpdate', handleComponentsUpdate)
        }
    }, [playerCore])

    // 第二个useEffect：在事件监听器注册后再注册插件
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        // 注册默认插件
        if (showCover && coverImage) {
            const coverPlugin = new CoverPlugin({
                coverImage,
                showCover
            })
            playerCore.use(coverPlugin)
        }

        // 注册用户提供的插件
        if (plugins && Array.isArray(plugins)) {
            plugins.forEach((pluginConfig) => {
                if (pluginConfig) {
                    // 处理插件配置对象 {plugin: IPlayerPlugin, options?: any}
                    if (typeof pluginConfig === 'object' && 'plugin' in pluginConfig) {
                        playerCore.use(pluginConfig.plugin, pluginConfig.options)
                    } else if (
                        typeof pluginConfig === 'object' &&
                        pluginConfig.name &&
                        typeof pluginConfig.install === 'function'
                    ) {
                        // 直接传入的插件实例
                        playerCore.use(pluginConfig as IPlayerPlugin)
                    }
                }
            })
        }
    }, [playerCore, plugins])

    // 监听缩略图状态变化
    useEffect(() => {
        setShowThumbnail(thumbnailManager.isThumbnailVisible)
        setThumbnailPosition(thumbnailManager.thumbnailPosition)
    }, [thumbnailManager.isThumbnailVisible, thumbnailManager.thumbnailPosition])

    // 使用视频事件Hook
    useVideoEvents(videoRef as React.RefObject<HTMLVideoElement>, playerCore, isMuted, volume, currentTime)

    // 初始化DASH播放器（如果需要）
    useEffect(() => {
        const video = videoRef.current
        if (!video || playerCore.videoType !== VideoType.DASH) return

        // 初始化DASH播放器
        playerCore.initDashPlayer(video)

        // 清理函数
        return () => {
            // PlayerCore的destroy方法会处理DASH播放器的清理
            playerCore.destroy()
        }
    }, [playerCore.videoType])

    // 使用字幕Hook
    // 转换tracks为符合Track类型的数组
    const processedTracks = (tracks || []).map((track, index) => ({
        id: track.id || `track-${index}`,
        label: track.label || `Track ${index + 1}`,
        src: track.src,
        srclang: track.srclang || 'auto',
        kind: (track.kind as 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata') || 'subtitles',
        default: track.default
    }))

    useSubtitles(videoRef as React.RefObject<HTMLVideoElement>, playerCore, processedTracks)

    // 使用快捷键Hook
    useKeyboardShortcuts(
        containerRef as React.RefObject<HTMLDivElement>,
        playerCore,
        enableShortcuts,
        currentTime,
        duration,
        volume
    )

    // 更新缩略图URL到管理器
    useEffect(() => {
        thumbnailManager.updateThumbnailUrl(thumbnailUrl)
    }, [thumbnailUrl, thumbnailManager])

    // 监听视频播放状态变化（来自video元素）
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handlePlay = () => playerCore.play()
        const handlePause = () => playerCore.pause()
        const handleMute = () => playerCore.setMuted(video.muted)
        const handleVolumeChange = () => {
            // 只有当音量真正改变时才通知PlayerCore
            if (video.volume !== volume || video.muted !== isMuted) {
                playerCore.setVolume(video.volume)
            }
        }
        const handleTimeUpdate = () => {
            playerCore.setTimeUpdate(video.currentTime)
        }
        const handleLoadedMetadata = () => {
            playerCore.setDuration(video.duration)
        }

        video.addEventListener('play', handlePlay)
        video.addEventListener('pause', handlePause)
        const muteListener = () => handleMute()
        const volumeListener = () => handleVolumeChange()
        video.addEventListener('volumechange', muteListener)
        video.addEventListener('volumechange', volumeListener)
        video.addEventListener('timeupdate', handleTimeUpdate)
        video.addEventListener('loadedmetadata', handleLoadedMetadata)

        return () => {
            video.removeEventListener('play', handlePlay)
            video.removeEventListener('pause', handlePause)
            video.removeEventListener('volumechange', muteListener)
            video.removeEventListener('volumechange', volumeListener)
            video.removeEventListener('timeupdate', handleTimeUpdate)
            video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        }
    }, [playerCore, volume, isMuted])

    // 播放/暂停
    const togglePlay = () => {
        playerCore.togglePlay()
    }

    // 静音切换
    const toggleMute = () => {
        playerCore.toggleMute()
    }

    // 音量控制
    const handleVolumeChange = (newVolume: number) => {
        playerCore.setVolume(newVolume)
    }

    // 进度条控制
    const handleProgressChange = (newProgress: number, _newTime: number) => {
        playerCore.setProgress(newProgress)
    }

    // 缓冲进度控制
    const handleBufferedChange = (newBuffered: number) => {
        setBuffered(newBuffered)
    }

    // 跳转到指定时间
    const handleSeek = (time: number) => {
        playerCore.seek(time)
    }

    // 显示/隐藏缩略图
    const handleShowThumbnail = (show: boolean, position?: { x: number; time: number }) => {
        if (show && position) {
            thumbnailManager.showThumbnail(position)
        } else {
            thumbnailManager.hideThumbnail()
        }
    }

    // 全屏切换
    const toggleFullscreen = () => {
        playerCore.toggleFullscreen()
    }

    // 画中画切换
    const togglePip = async () => {
        const video = videoRef.current
        if (!video) return

        // 检查视频元数据是否已加载
        if (video.readyState < 1) {
            logger.warn('视频元数据尚未加载完成，无法进入画中画模式')
            return
        }

        // 检查是否支持画中画功能
        if ('pictureInPictureEnabled' in document) {
            try {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture()
                } else if (video.requestPictureInPicture) {
                    await video.requestPictureInPicture()
                }
            } catch (error) {
                logger.error('画中画模式切换失败:', error)
            }
        } else {
            logger.warn('当前浏览器不支持画中画功能')
        }
    }

    // 实际执行全屏操作
    const handleFullscreenToggle = (fullscreen: boolean) => {
        const container = containerRef.current
        if (!container) return

        if (fullscreen) {
            // 进入全屏
            if (container.requestFullscreen) {
                container.requestFullscreen().catch((err) => {
                    logger.error('无法进入全屏模式:', err)
                })
            }
        } else {
            // 退出全屏
            if (document.exitFullscreen) {
                document.exitFullscreen().catch((err) => {
                    logger.error('无法退出全屏模式:', err)
                })
            }
        }
    }
    // 字幕设置状态
    const [showSubtitles, setShowSubtitles] = useState(true)
    const [subtitleType, setSubtitleType] = useState('vtt')
    const [fontSize, setFontSize] = useState(100) // 百分比
    const [fontColor, setFontColor] = useState('#FFFFFF')
    const [outline, setOutline] = useState(true)
    const [bold, setBold] = useState(false)
    const [opacity, setOpacity] = useState(100) // 百分比

    // 选择字幕轨道
    const selectSubtitleTrack = (trackId: string) => {
        const trackIndex = tracks.findIndex((track) => (track.id || track.label) === trackId)
        if (trackIndex !== -1) {
            playerCore.setSubtitleTrack(trackIndex)
            playerCore.setShowSubtitles(true)
            setShowSubtitles(true) // 同步更新本地状态
        }
    }

    // 关闭字幕
    const closeSubtitles = () => {
        playerCore.setShowSubtitles(false)
        setShowSubtitles(false) // 同步更新本地状态
    }

    // 字幕设置变更处理函数
    const handleShowSubtitlesChange = (show: boolean) => {
        playerCore.setShowSubtitles(show)
        setShowSubtitles(show)
    }

    const handleSubtitleTypeChange = (type: string) => {
        setSubtitleType(type)
        // 应用字幕类型变更到视频元素
        const video = videoRef.current
        if (video && video.textTracks) {
            // 这里可以添加特定于字幕类型的处理逻辑
        }
    }

    const handleFontSizeChange = (size: number) => {
        setFontSize(size)
        // 更新CSS变量以改变字幕字体大小
        const videoElement = videoRef.current
        if (videoElement) {
            videoElement.style.setProperty('--subtitle-font-size', `${size}%`)
        }
    }

    const handleFontColorChange = (color: string) => {
        setFontColor(color)
        // 更新CSS变量以改变字幕颜色
        const videoElement = videoRef.current
        if (videoElement) {
            videoElement.style.setProperty('--subtitle-color', color)
        }
    }

    const handleOutlineChange = (outline: boolean) => {
        setOutline(outline)
        // 更新CSS变量以控制字幕描边
        const videoElement = videoRef.current
        if (videoElement) {
            videoElement.style.setProperty('--subtitle-outline', outline ? '1px' : '0px')
        }
    }

    const handleBoldChange = (bold: boolean) => {
        setBold(bold)
        // 更新CSS变量以控制字幕加粗
        const videoElement = videoRef.current
        if (videoElement) {
            videoElement.style.setProperty('--subtitle-font-weight', bold ? 'bold' : 'normal')
        }
    }

    const handleOpacityChange = (opacity: number) => {
        setOpacity(opacity)
        // 更新CSS变量以改变字幕不透明度
        const videoElement = videoRef.current
        if (videoElement) {
            videoElement.style.setProperty('--subtitle-opacity', `${opacity}%`)
        }
    }

    // 计算容器样式
    const getContainerStyle = () => {
        let style: React.CSSProperties = {
            width: width,
            height: height
        }

        if (aspectRatio) {
            const [w, h] = aspectRatio.split(':').map(Number)
            style = {
                ...style,
                aspectRatio: `${w}/${h}`
            }
        }

        return style
    }

    return (
        <div className="anime-player-container" ref={containerRef} style={getContainerStyle()}>
            <div className="video-wrapper">
                <video
                    ref={videoRef}
                    src={playerCore.videoType !== VideoType.DASH && typeof videoSrc === 'string' ? videoSrc : undefined}
                    playsInline
                    muted={isMuted}
                    className="video-element"
                />

                {/* 渲染插件注册的组件 */}
                {pluginComponents.map((component) => (
                    <div key={component.id} id={component.id} className={`plugin-component ${component.type}`}>
                        {component.component}
                    </div>
                ))}

                {/* 视频控制栏 */}
                <div className={`video-controls ${showControls ? 'visible' : 'hidden'}`}>
                    <div className={'video-controls-process'}>
                        {/* 进度条 */}
                        {controls.progress && (
                            <ProgressControl
                                progress={progress}
                                buffered={buffered}
                                duration={duration}
                                showThumbnail={showThumbnail}
                                thumbnailPosition={thumbnailPosition}
                                thumbnailUrl={thumbnailUrl}
                                thumbnailWidth={thumbnailWidth}
                                thumbnailHeight={thumbnailHeight}
                                customIcons={customIcons}
                                onProgressChange={handleProgressChange}
                                onSeek={handleSeek}
                                onShowThumbnail={handleShowThumbnail}
                            />
                        )}
                    </div>
                    <div className="video-controls-center">
                        {/* 左侧控制按钮 */}
                        <div className="video-controls-left">
                            {/* 播放按钮 */}
                            {controls.play && (
                                <PlayButton isPlaying={isPlaying} onToggle={togglePlay} customIcons={customIcons} />
                            )}

                            {controlButtons
                                .filter((button) => button.position === 'left')
                                .sort((a, b) => (a.order || 0) - (b.order || 0))
                                .map((button) => (
                                    <React.Fragment key={button.id}>
                                        {button.customComponent ? (
                                            button.customComponent
                                        ) : (
                                            <button
                                                className="control-button plugin-control-button"
                                                title={button.title}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (button.onClick) button.onClick()
                                                }}
                                                aria-label={button.title}
                                            >
                                                {button.icon}
                                            </button>
                                        )}
                                    </React.Fragment>
                                ))}
                            {/* 时间显示 */}
                            {controls.time && <TimeDisplay currentTime={currentTime} duration={duration} />}
                        </div>

                        {/*右侧控制按钮*/}
                        <div className="video-controls-right">
                            {/* 画质按钮 */}
                            {controls.quality && <QualityButton customIcons={customIcons} />}

                            {/* 倍速控制 */}
                            {controls.speed && <SpeedButton customIcons={customIcons} />}
                            {/* 字幕控制按钮 - 使用SubtitlesMenu组件 */}
                            {controls.subtitles && tracks.length > 0 && (
                                <SubtitlesMenu
                                    options={tracks.map((track, index) => ({
                                        id: track.id || `track-${index}`,
                                        kind: track.kind || 'subtitles',
                                        label: track.label,
                                        language: track.srclang || 'auto',
                                        isActive: playerCore.showSubtitles && index === playerCore.currentTrackIndex
                                    }))}
                                    onSelect={selectSubtitleTrack}
                                    onCloseSubtitles={closeSubtitles}
                                    // 新增props用于与播放器核心联动
                                    tracks={tracks}
                                    showSubtitles={showSubtitles}
                                    onShowSubtitlesChange={handleShowSubtitlesChange}
                                    onSubtitleTypeChange={handleSubtitleTypeChange}
                                    onFontSizeChange={handleFontSizeChange}
                                    onFontColorChange={handleFontColorChange}
                                    onOutlineChange={handleOutlineChange}
                                    onBoldChange={handleBoldChange}
                                    onOpacityChange={handleOpacityChange}
                                    fontSize={fontSize}
                                    fontColor={fontColor}
                                    outline={outline}
                                    bold={bold}
                                    opacity={opacity}
                                    subtitleType={subtitleType}
                                />
                            )}
                            {/* 音量控制 */}
                            {controls.volume && (
                                <VolumeControl
                                    isMuted={isMuted}
                                    volume={volume}
                                    onToggleMute={toggleMute}
                                    onVolumeChange={handleVolumeChange}
                                    customIcons={customIcons}
                                />
                            )}

                            {controlButtons
                                .filter((button) => button.position === 'right')
                                .sort((a, b) => (a.order || 0) - (b.order || 0))
                                .map((button) => (
                                    <React.Fragment key={button.id}>
                                        {button.customComponent ? (
                                            button.customComponent
                                        ) : (
                                            <button
                                                className="control-button plugin-control-button"
                                                title={button.title}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (button.onClick) button.onClick()
                                                }}
                                                aria-label={button.title}
                                            >
                                                {button.icon}
                                            </button>
                                        )}
                                    </React.Fragment>
                                ))}

                            {/* 设置按钮 */}
                            {controls.settings && <SettingsButton customIcons={customIcons} />}

                            {/* 画中画按钮 */}
                            {controls.pip && <PipButton onToggle={togglePip} customIcons={customIcons} />}

                            {/* 全屏按钮 */}
                            {controls.fullscreen && (
                                <FullscreenButton
                                    isFullscreen={isFullscreen}
                                    onToggle={toggleFullscreen}
                                    customIcons={customIcons}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default React.forwardRef<VideoRef, VideoProps>(CluoubVideo)
