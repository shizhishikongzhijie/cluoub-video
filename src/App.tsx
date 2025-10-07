import './App.css'
import CluoubVideo from "./libs/Video";
import {Circle} from "lucide-react";

function App() {

  return (
    <>
        <CluoubVideo
            videoSrc="https://video.e-esine.cn/test/video.mp4"
            videoId="视频ID"
            userId="用户ID"
            username="用户名"
            width="800px"
            aspectRatio="16:9"
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
            src: '/video_翻译.vtt',
            default: true
          },
          {
            id: 'original',
            kind: 'subtitles',
            label: 'Japanese',
            srclang: 'ja',
            src: '/video_原始.vtt'
          }
        ]}
        />
    </>
  )
}

export default App
