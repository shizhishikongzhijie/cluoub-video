import './SubtitlesMenu.css'

import React, {useEffect, useState} from 'react'

import type {ColorPickerProps, NumberInputProps, SelectProps, SwitchProps} from '../common'
import {ColorPicker, NumberInput, Popover, Select, Switch} from '../common'
import type {Track} from '../Video.types'

/**
 * 字幕选项接口
 * @interface SubtitleOption
 */
interface SubtitleOption {
    /** 字幕选项唯一标识符 */
    id: string
    /** 字幕选项显示标签 */
    label: string
    /** 字幕语言代码 */
    language: string
    /** 是否为当前激活选项 */
    isActive: boolean
}

/**
 * 字幕菜单组件属性接口
 * @interface SubtitlesMenuProps
 */
interface SubtitlesMenuProps {
    /** 字幕选项列表 */
    options: SubtitleOption[]
    /** 选择字幕选项回调 */
    onSelect: (optionId: string) => void
    /** 关闭字幕回调 */
    onCloseSubtitles: () => void
    /** 字幕轨道列表 */
    tracks: Track[]
    /** 字幕显示状态 */
    showSubtitles: boolean
    /** 字幕显示状态变更回调 */
    onShowSubtitlesChange: (show: boolean) => void
    /** 字幕类型变更回调 */
    onSubtitleTypeChange: (type: string) => void
    /** 字体大小变更回调 */
    onFontSizeChange: (size: number) => void
    /** 字体颜色变更回调 */
    onFontColorChange: (color: string) => void
    /** 描边开关变更回调 */
    onOutlineChange: (outline: boolean) => void
    /** 加粗开关变更回调 */
    onBoldChange: (bold: boolean) => void
    /** 不透明度变更回调 */
    onOpacityChange: (opacity: number) => void
    /** 字体大小 */
    fontSize: number
    /** 字体颜色 */
    fontColor: string
    /** 描边开关状态 */
    outline: boolean
    /** 加粗开关状态 */
    bold: boolean
    /** 不透明度 */
    opacity: number
    /** 字幕类型 */
    subtitleType: string
}

const SubtitlesMenu: React.FC<SubtitlesMenuProps> = ({
    options,
    onSelect,
    onCloseSubtitles,
    tracks,
    showSubtitles,
    onShowSubtitlesChange,
    onSubtitleTypeChange,
    onFontSizeChange,
    onFontColorChange,
    onOutlineChange,
    onBoldChange,
    onOpacityChange,
    fontSize,
    fontColor,
    outline,
    bold,
    opacity,
    subtitleType
}) => {
    // 字幕设置状态（从props获取初始值）
    const [localShowSubtitles, setLocalShowSubtitles] = useState(showSubtitles)
    const [localSubtitleType, setLocalSubtitleType] = useState(subtitleType)
    const [localFontSize, setLocalFontSize] = useState(fontSize)
    const [localFontColor, setLocalFontColor] = useState(fontColor)
    const [localOutline, setLocalOutline] = useState(outline)
    const [localBold, setLocalBold] = useState(bold)
    const [localOpacity, setLocalOpacity] = useState(opacity)

    // 当props变化时更新本地状态
    useEffect(() => {
        setLocalShowSubtitles(showSubtitles)
        setLocalSubtitleType(subtitleType)
        setLocalFontSize(fontSize)
        setLocalFontColor(fontColor)
        setLocalOutline(outline)
        setLocalBold(bold)
        setLocalOpacity(opacity)
    }, [showSubtitles, subtitleType, fontSize, fontColor, outline, bold, opacity])

    // 字幕开关处理
    const handleSubtitleToggle: SwitchProps['onChange'] = (checked) => {
        setLocalShowSubtitles(checked)
        onShowSubtitlesChange(checked)
        if (!checked) {
            onCloseSubtitles()
        }
    }

    // 字幕类型处理
    const handleSubtitleTypeChange: SelectProps['onChange'] = (value) => {
        setLocalSubtitleType(value)
        onSubtitleTypeChange(value)
    }

    // 字体大小处理
    const handleFontSizeChange: NumberInputProps['onChange'] = (value) => {
        setLocalFontSize(value)
        onFontSizeChange(value)
    }

    // 字体颜色处理
    const handleFontColorChange: ColorPickerProps['onChange'] = (color) => {
        setLocalFontColor(color)
        onFontColorChange(color)
    }

    // 描边开关处理
    const handleOutlineToggle: SwitchProps['onChange'] = (checked) => {
        setLocalOutline(checked)
        onOutlineChange(checked)
    }

    // 加粗开关处理
    const handleBoldToggle: SwitchProps['onChange'] = (checked) => {
        setLocalBold(checked)
        onBoldChange(checked)
    }

    // 不透明度处理
    const handleOpacityChange: NumberInputProps['onChange'] = (value) => {
        setLocalOpacity(value)
        onOpacityChange(value)
    }

    // 根据实际可用的字幕类型生成选项
    const getSubtitleTypeOptions = () => {
        const types = new Set<string>()
        tracks.forEach((track) => {
            const extension = track.src.split('.').pop()?.toLowerCase()
            if (extension) {
                types.add(extension)
            }
        })

        const options = []
        if (types.has('vtt')) options.push({ value: 'vtt', label: 'WebVTT (.vtt)' })
        if (types.has('srt')) options.push({ value: 'srt', label: 'SubRip (.srt)' })
        if (types.has('ass')) options.push({ value: 'ass', label: 'Advanced SubStation Alpha (.ass)' })

        // 如果没有识别到类型，默认添加vtt
        if (options.length === 0) {
            options.push({ value: 'vtt', label: 'WebVTT (.vtt)' })
        }

        return options
    }

    return (
        <Popover
            position="top"
            content={
                <div className="subtitles-popover-content">
                    {/* 字幕开关 */}
                    <div className="subtitle-setting-item">
                        <span className="subtitle-setting-label">字幕</span>
                        <Switch checked={localShowSubtitles} onChange={handleSubtitleToggle} />
                    </div>

                    {/* 字幕类型 */}
                    <div className="subtitle-setting-item">
                        <span className="subtitle-setting-label">字幕类型</span>
                        <Select
                            value={localSubtitleType}
                            options={getSubtitleTypeOptions()}
                            onChange={handleSubtitleTypeChange}
                        />
                    </div>

                    {/* 字体大小 */}
                    <div className="subtitle-setting-item">
                        <span className="subtitle-setting-label">字体大小</span>
                        <NumberInput
                            defaultValue={localFontSize}
                            min={50}
                            max={200}
                            step={10}
                            onChange={handleFontSizeChange}
                        />
                    </div>

                    {/* 字体颜色 */}
                    <div className="subtitle-setting-item">
                        <span className="subtitle-setting-label">字体颜色</span>
                        <ColorPicker defaultValue={localFontColor} onChange={handleFontColorChange} />
                    </div>

                    {/* 描边和加粗开关并列 */}
                    <div className="subtitle-setting-row">
                        <div className="subtitle-setting-item">
                            <span className="subtitle-setting-label">描边</span>
                            <Switch checked={localOutline} size={'small'} onChange={handleOutlineToggle} />
                        </div>
                        <div className="subtitle-setting-item">
                            <span className="subtitle-setting-label">加粗</span>
                            <Switch checked={localBold} size={'small'} onChange={handleBoldToggle} />
                        </div>
                    </div>

                    {/* 不透明度 */}
                    <div className="subtitle-setting-item">
                        <span className="subtitle-setting-label">不透明度</span>
                        <NumberInput
                            defaultValue={localOpacity}
                            min={0}
                            max={100}
                            step={5}
                            onChange={handleOpacityChange}
                        />
                    </div>

                    {/* 字幕轨道选择 */}
                    <div className="subtitle-setting-item">
                        <span className="subtitle-setting-label">字幕轨道</span>
                        <Select
                            value={options.find((option) => option.isActive)?.id || 'close'}
                            options={[
                                { value: 'close', label: '关闭字幕' },
                                ...options.map((option) => ({
                                    value: option.id,
                                    label: option.label,
                                    disabled: false
                                }))
                            ]}
                            onChange={(value) => {
                                if (value === 'close') {
                                    onCloseSubtitles()
                                } else {
                                    onSelect(value)
                                }
                            }}
                            placeholder="选择字幕轨道"
                        />
                    </div>
                </div>
            }
            style={{
                '--popover-padding': 0
            }}
        >
            <button className={`subtitles-button control-button`} title="字幕设置">
                {/*<ChevronDown size={20} className={`subtitles-icon ${isOpen ? 'rotated' : ''}`} />*/}
                <span>字幕</span>
            </button>
        </Popover>
    )
}

export default SubtitlesMenu
