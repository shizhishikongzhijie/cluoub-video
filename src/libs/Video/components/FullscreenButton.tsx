import './FullscreenButton.css'

import React from 'react'

import {customIconsKey, customIconsMapType, getIcon} from '@/libs/Video/utils/icon'

interface FullscreenButtonProps {
    isFullscreen: boolean
    onToggle: () => void
    customIcons?: customIconsMapType
}

const FullscreenButton: React.FC<FullscreenButtonProps> = ({ isFullscreen, onToggle, customIcons }) => {
    return (
        <button
            className="control-button"
            onClick={onToggle}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
            {!isFullscreen
                ? getIcon(customIconsKey.fullscreen, customIcons?.fullscreen)
                : getIcon(customIconsKey.exitFullscreen, customIcons?.exitFullscreen)}
        </button>
    )
}

export default FullscreenButton
