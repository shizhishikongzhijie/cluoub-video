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
                    id: "subtitle1",
                    label: "中文",
                    language: "zh",
                    src: "/video_%E7%BF%BB%E8%AF%91.srt",
                    kind: "subtitles",
                    default: true
                },
                {
                    id: "subtitle2",
                    label: "Japanese",
                    language: "ja",
                    src: "/video_%E5%8E%9F%E5%A7%8B.srt",
                    kind: "subtitles"
                }
            ]}
        />
    </>
  )
}

export default App
