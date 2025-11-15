import './SettingsButton.css'

import React from 'react'

import {customIconsKey, customIconsMapType, getIcon} from '@/libs/Video/utils/icon'

interface SettingsButtonProps {
    customIcons?: customIconsMapType
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ customIcons }) => {
    return <button className="control-button">{getIcon(customIconsKey.settings, customIcons?.settings)}</button>
}

export default SettingsButton
