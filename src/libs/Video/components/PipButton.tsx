import './PipButton.css'

import React from 'react'

import {customIconsKey, customIconsMapType, getIcon} from '@/libs/Video/utils/icon'

interface PipButtonProps {
    onToggle: () => void
    customIcons?: customIconsMapType
}

const PipButton: React.FC<PipButtonProps> = ({ onToggle, customIcons }) => {
    return (
        <button className="control-button" onClick={onToggle} aria-label="Toggle picture in picture">
            {getIcon(customIconsKey.pip, customIcons?.pip)}
        </button>
    )
}

export default PipButton
