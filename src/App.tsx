import './App.css'
import CluoubVideo from "./libs/Video";
import {Circle} from "lucide-react";

function App() {

  return (
    <>
        <CluoubVideo
            videoSrc="https://video.e-esine.cn/video/%E6%97%B6%E4%B9%8B%E4%B8%96-video-1734444962803.mp4"
            videoId="视频ID"
            userId="用户ID"
            username="用户名"
            width="800px"
            aspectRatio="16:9"
            customIcons={{
                // playIcon: <Heart size={20} />,
                progressThumbIcon: <Circle size={16} fill="white" />
            }}
        />
    </>
  )
}

export default App
