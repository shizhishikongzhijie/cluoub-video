import './FullscreenButton.css'

import React from 'react'

import {SvgIcon} from '../common'

interface FullscreenButtonProps {
    isFullscreen: boolean
    onToggle: () => void
    customIcons?: {
        fullscreenIcon?: React.ReactNode
    }
}

const FullscreenButton: React.FC<FullscreenButtonProps> = ({ isFullscreen, onToggle, customIcons }) => {
    // 获取图标，优先使用自定义图标，否则使用默认图标
    const getIcon = (
        iconType: keyof NonNullable<FullscreenButtonProps['customIcons']>,
        defaultIcon: React.ReactNode
    ) => {
        return customIcons && customIcons[iconType] ? customIcons[iconType] : defaultIcon
    }

    return (
        <button
            className="control-button"
            onClick={onToggle}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
            {getIcon(
                'fullscreenIcon',
                isFullscreen ? (
                    <SvgIcon src={'/svg/全屏.svg'} noBackground size={20} />
                ) : (
                    <SvgIcon src={'/svg/退出全屏.svg'} noBackground size={20} />
                )
            )}
        </button>
    )
}

export default FullscreenButton
