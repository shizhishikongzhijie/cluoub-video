import './App.css'

import {Circle} from 'lucide-react'

import {CluoubVideo, VideoType} from './libs/Video'
import {DanmuPlugin} from './plugins/DanmuPlugin'

function App() {
    return (
        <>
            <CluoubVideo
                debug={true}
                videoSrc="format.mpd"
                videoType={VideoType.DASH}
                dataPrefix="./assets"
                width="800px"
                aspectRatio="16:9"
                coverImage="https://image.e-esine.cn/img/%E6%97%B6%E4%B9%8B%E4%B8%96-img2-1731421919537.webp"
                customIcons={{
                    // playIcon: <Heart size={20} />,
                    progressThumbIcon: <Circle size={16} fill="white" />
                }}
                tracks={[
                    {
                        id: 'translation',
                        kind: 'subtitles',
                        label: '中文',
                        srclang: 'zh',
                        src: '/assets/video_翻译.vtt',
                        default: true
                    },
                    {
                        id: 'original',
                        kind: 'subtitles',
                        label: 'Japanese',
                        srclang: 'ja',
                        src: '/assets/video_原始.vtt'
                    }
                ]}
                plugins={[new DanmuPlugin()]}
            />
        </>
    )
}

export default App
