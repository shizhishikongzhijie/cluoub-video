import './PipButton.css'

import React from 'react'

import SvgIcon from '../common/svgIcon'

interface PipButtonProps {
    onToggle: () => void
    customIcons?: {
        pipIcon?: React.ReactNode
    }
}

const PipButton: React.FC<PipButtonProps> = ({ onToggle, customIcons }) => {
    // 获取图标，优先使用自定义图标，否则使用默认图标
    const getIcon = (iconType: keyof NonNullable<PipButtonProps['customIcons']>, defaultIcon: React.ReactNode) => {
        return customIcons && customIcons[iconType] ? customIcons[iconType] : defaultIcon
    }

    return (
        <button className="control-button" onClick={onToggle} aria-label="Toggle picture in picture">
            {getIcon('pipIcon', <SvgIcon src={'/svg/小屏.svg'} noBackground size={20} />)}
        </button>
    )
}

export default PipButton
