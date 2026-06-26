import './App.css'

import { CluoubVideo } from './libs'
import { dashPlugin } from './libs/plugins/dash'
import { subtitlePlugin, type SubtitleTrack } from './libs/plugins/subtitle'

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

function App() {
    return (
        <>
            <CluoubVideo
                // debug={true}
                source="./video.mp4_ja.mp4"
                // videoType={VideoType.NORMAL}
                // dataPrefix="./assets"
                width="800px"
                aspectRatio="16:9"
                plugins={[dashPlugin, subtitlePlugin]}
                tracks={MOCK_TRACKS}
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
        </>
    )
}

export default App
