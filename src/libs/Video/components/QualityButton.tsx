import './QualityButton.css'

import React, {useCallback, useEffect, useState} from 'react'

import {customIconsKey, customIconsMapType, getIcon} from '@/libs/Video/utils/icon'

import Menu, {MenuItemType} from '../common/menu'
import Popover from '../common/popover'
import {usePlayerCore} from '../hooks'

interface QualityButtonProps {
    customIcons?: customIconsMapType
}

const QualityButton: React.FC<QualityButtonProps> = ({ customIcons }) => {
    // 获取播放器核心实例（不传递参数，因为我们只在已存在的实例上调用方法）
    const playerCore = usePlayerCore({} as any)
    const [currentQuality, setCurrentQuality] = useState('auto')
    const [menuItems, setMenuItems] = useState<MenuItemType[]>([{ key: 'auto', label: '自动' }])

    // 处理画质选择
    const handleQualitySelect = useCallback(
        (key: string) => {
            setCurrentQuality(key)
            // 实际切换画质的逻辑
            playerCore.setQuality(key)
        },
        [playerCore]
    )

    // 监听画质变化
    useEffect(() => {
        const handleQualityChange = (quality: string) => {
            setCurrentQuality(quality)
        }

        const handleAvailableQualitiesChange = (qualities: { key: string; label: string }[]) => {
            // 确保始终包含"自动"选项
            const itemsWithAuto = qualities.some((item) => item.key === 'auto')
                ? qualities
                : [{ key: 'auto', label: '自动' }, ...qualities]
            setMenuItems(itemsWithAuto)
        }
        console.log('QualitiesChange', playerCore.availableQualities)

        playerCore.on('qualityChange', handleQualityChange)
        playerCore.on('availableQualitiesChange', handleAvailableQualitiesChange)

        // 初始化时获取当前可用的画质选项
        setMenuItems(playerCore.availableQualities || [{ key: 'auto', label: '自动' }])
        setCurrentQuality(playerCore.quality || 'auto')

        return () => {
            playerCore.removeListener('qualityChange', handleQualityChange)
            playerCore.removeListener('availableQualitiesChange', handleAvailableQualitiesChange)
        }
    }, [playerCore])

    return (
        <Popover
            content={<Menu items={menuItems} selectedKey={currentQuality} onSelect={handleQualitySelect} />}
            position="top"
            style={{
                '--popover-padding': 0
            }}
        >
            <button className="control-button quality-button">
                {getIcon(
                    customIconsKey.quality,
                    customIcons?.quality || <span>{currentQuality === 'auto' ? '自动' : currentQuality}</span>
                )}
            </button>
        </Popover>
    )
}

export default QualityButton
