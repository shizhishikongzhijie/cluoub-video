import './PlayButton.css'

import React from 'react'

import {customIconsKey, customIconsMapType, getIcon} from '@/libs/Video/utils/icon'

interface PlayButtonProps {
    isPlaying: boolean
    onToggle: () => void
    customIcons?: customIconsMapType
}

const PlayButton: React.FC<PlayButtonProps> = ({ isPlaying, onToggle, customIcons }) => {
    return (
        <button className="control-button" onClick={onToggle}>
            {isPlaying
                ? getIcon(customIconsKey.pause, customIcons?.pause)
                : getIcon(customIconsKey.play, customIcons?.play)}
        </button>
    )
}

export default PlayButton
