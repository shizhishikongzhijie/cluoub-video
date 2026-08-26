import './App.css'

import { useEffect, useRef, useState } from 'react'

import { CluoubVideo, DanmuBar, definePlugin, type VideoRef } from './libs'
import type { PlayerInstance } from './libs/core/types'
import { capturePlugin } from './libs/plugins/capture'
import { type DanmuItem, danmuPlugin } from './libs/plugins/danmu'
import { dashPlugin } from './libs/plugins/dash'
import { subtitlePlugin, type SubtitleTrack } from './libs/plugins/subtitle'

const MOCK_DANMU: DanmuItem[] = [
    { time: 1, text: '你好呀 👋', color: '#ffffff' },
    { time: 1.5, text: '弹幕来啦！', color: '#35ddd8' },
    { time: 2, text: '合成截图应该包含弹幕', color: '#ffd54a' },
    { time: 2.5, text: '666', color: '#ff6b6b' },
    { time: 3, text: '字幕 + 弹幕一起捕获', color: '#c792ea' },
    { time: 4, text: '顶部弹幕', mode: 'top', color: '#ffffff' },
    { time: 5, text: '底部弹幕', mode: 'bottom', color: '#ffffff' }
]

const MOCK_TRACKS: SubtitleTrack[] = [
    {
        id: '1',
        label: '简体中文',
        lang: 'zh',
        type: 'vtt',
        // 使用 Data URI 模拟一个 VTT 文件，无需真实后端
        src: `data:text/vtt;charset=utf-8,WEBVTT

00:00:01.000 --> 00:00:03.000
你好，欢迎来到 Cluoub 播放器！

00:00:03.500 --> 00:00:06.000
这里是演示字幕，你可以调节样式哦。

00:00:06.500 --> 00:00:10.000
<b style="color: #35ddd8">支持 HTML 标签</b>，比如加粗和颜色。
`
    },
    {
        id: '2',
        label: 'English',
        lang: 'en',
        type: 'srt',
        // 使用 Data URI 模拟一个 SRT 文件
        src: `data:text/plain;charset=utf-8,1
00:00:01,000 --> 00:00:03,000
Hello, welcome to Cluoub Player!

2
00:00:03,500 --> 00:00:06,000
This is a demo subtitle, try customizing styles.

3
00:00:06,500 --> 00:00:10,000
We support both VTT and SRT formats.
`
    },
    {
        id: '3',
        label: '日本語',
        lang: 'ja',
        type: 'vtt',
        src: `data:text/vtt;charset=utf-8,WEBVTT

00:00:01.000 --> 00:00:05.000
こんにちは、Cluoubプレイヤーへようこそ！
`
    }
]

const failingDemoPlugin = definePlugin({
    id: 'demo-failure',
    setup: (context) => context.reportError(new Error('Intentional demo failure'))
})

function App() {
    const ref = useRef<VideoRef>(null)
    // 拿到 PlayerInstance 用于渲染播放器下方的弹幕操作区（B 站式专门操作区）
    const [player, setPlayer] = useState<PlayerInstance | null>(null)
    const [pluginError, setPluginError] = useState<string>()

    // 支持 URL 参数用于演示/调试：mode=wide|small、autoplay=1、seek=<秒>、debug=1
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const mode = params.get('mode')
        const seekRaw = params.get('seek')
        const debug = params.get('debug') === '1'
        const iv = window.setInterval(() => {
            const p = ref.current?.getPlayer()
            if (!p) return
            window.clearInterval(iv)
            setPlayer(p)
            if (mode === 'wide' || mode === 'small') ref.current?.setScreenMode(mode)
            if (seekRaw !== null) {
                const time = Number(seekRaw)
                if (!Number.isNaN(time)) p.seek(time)
            }
            if (debug) {
                window.setTimeout(async () => {
                    const vc = document.querySelector('[class*="videoContainer"]') as HTMLElement | null
                    const sub = document.querySelector('[class*="subtitleLayer"]') as HTMLElement | null
                    const probe = (label: string) => {
                        const r1 = vc?.getBoundingClientRect()
                        const r2 = sub?.getBoundingClientRect()
                        const r3 = p.video.getBoundingClientRect()
                        const el = document.createElement('pre')
                        el.id = 'DEBUGLAYOUT'
                        el.textContent = JSON.stringify({
                            label,
                            container: r1 && { x: Math.round(r1.x), w: Math.round(r1.width), h: Math.round(r1.height) },
                            sub: r2 && { x: Math.round(r2.x), w: Math.round(r2.width), h: Math.round(r2.height) },
                            video: { w: Math.round(r3.width), h: Math.round(r3.height) }
                        })
                        document.body.appendChild(el)
                    }
                    probe('ready')
                    window.setTimeout(() => probe('settled'), 1500)

                    if (params.get('composite') === '1') {
                        // 无头环境下 autoplay 可能未真正生效：先强制播放态，再 seek 发射弹幕，
                        // 保证弹幕在虚拟时钟运行时进入舞台并绘制到 canvas
                        p.store.setState({ isPlaying: true })
                        window.setTimeout(async () => {
                            p.seek(1.5)
                            window.setTimeout(async () => {
                                const dataUrl = await p.captureComposite({ type: 'image/png' })
                                // 采样弹幕 canvas 像素，确认弹幕确实被绘制到捕获层
                                const danmuCanvas = document.querySelector(
                                    'canvas[data-capture-layer="danmu"]'
                                ) as HTMLCanvasElement | null
                                let danmuPixels = 0
                                try {
                                    const dctx = danmuCanvas?.getContext('2d')
                                    if (dctx && danmuCanvas) {
                                        const img = dctx.getImageData(0, 0, danmuCanvas.width, danmuCanvas.height)
                                        for (let i = 3; i < img.data.length; i += 40) {
                                            if (img.data[i] > 0) danmuPixels++
                                        }
                                    }
                                } catch {
                                    danmuPixels = -1
                                }
                                const pre = document.createElement('pre')
                                pre.id = 'COMPOSITEPROBE'
                                pre.textContent = JSON.stringify({
                                    ok: !!dataUrl,
                                    size: dataUrl ? dataUrl.length : 0,
                                    subtitleText:
                                        document.querySelector('[data-cluoub-subtitle-cue]')?.textContent ?? '',
                                    danmuCanvas: !!danmuCanvas,
                                    danmuPixels
                                })
                                document.body.appendChild(pre)
                            }, 300)
                        }, 200)
                    }
                }, 500)
            }
        }, 100)
        return () => window.clearInterval(iv)
    }, [])

    const params = new URLSearchParams(window.location.search)
    const autoplay = params.get('autoplay') === '1'
    const qualityDemo = params.get('quality') === '1'
    const errorDemo = params.get('pluginError') === '1'

    return (
        <>
            <CluoubVideo
                // debug={true}
                ref={ref}
                source={
                    qualityDemo
                        ? [
                              { src: './video.mp4_ja.mp4', quality: '原画' },
                              { src: './video.mp4_ja.mp4?quality=720', quality: '720P' }
                          ]
                        : './video.mp4_ja.mp4'
                }
                width="800px"
                aspectRatio="16:9"
                autoPlay={autoplay}
                muted={autoplay}
                plugins={[
                    dashPlugin,
                    subtitlePlugin,
                    capturePlugin,
                    danmuPlugin,
                    ...(errorDemo ? [failingDemoPlugin] : [])
                ]}
                onPluginError={(error) => setPluginError(`${error.pluginId}:${error.phase}`)}
                tracks={MOCK_TRACKS}
                danmuList={MOCK_DANMU}
                thumbnail={{ type: 'video' }}
                capture={{ gifFps: 8, gifDuration: 2, filename: 'cluoub-demo' }}
                // coverImage="https://image.e-esine.cn/img/%E6%97%B6%E4%B9%8B%E4%B8%96-img2-1731421919537.webp"
                // customIcons={{
                //     // playIcon: <Heart size={20} />,
                //     progressThumbIcon: <Circle size={16} fill="white" />
                // }}
                // tracks={[
                //     {
                //         id: 'translation',
                //         kind: 'subtitles',
                //         label: '中文',
                //         srclang: 'zh',
                //         src: '/assets/video_翻译.vtt',
                //         default: true
                //     },
                //     {
                //         id: 'original',
                //         kind: 'subtitles',
                //         label: 'Japanese',
                //         srclang: 'ja',
                //         src: '/assets/video_原始.vtt'
                //     }
                // ]}
                // plugins={[new DanmuPlugin()]}
            />
            {pluginError && <output data-testid="plugin-error">{pluginError}</output>}
            {/* B 站式弹幕操作区：播放器下方专门区域（也可通过 showDanmuBar 挂载到播放器内） */}
            <div className="danmuBarArea" style={{ marginTop: 12 }}>
                {player && <DanmuBar player={player} />}
            </div>
        </>
    )
}

export default App
