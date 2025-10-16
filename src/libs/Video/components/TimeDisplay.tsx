import './TimeDisplay.css'

import React from 'react'

interface TimeDisplayProps {
    currentTime: number
    duration: number
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({ currentTime, duration }) => {
    // 格式化时间
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    }

    return (
        <div className="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
        </div>
    )
}

export default TimeDisplay
