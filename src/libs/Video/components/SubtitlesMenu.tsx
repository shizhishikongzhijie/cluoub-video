import './SubtitlesMenu.css'

import React, {useState} from 'react'

import type {ColorPickerProps, NumberInputProps, SelectProps, SwitchProps} from '../common'
import {ColorPicker, NumberInput, Popover, Select, Switch} from '../common'

interface SubtitleOption {
    id: string
    label: string
    language: string
    isActive: boolean
}

interface SubtitlesMenuProps {
    options: SubtitleOption[]
    isOpen: boolean
    onToggle: () => void
    onSelect: (optionId: string) => void
    onCloseSubtitles: () => void
}

const SubtitlesMenu: React.FC<SubtitlesMenuProps> = ({ options, isOpen, onToggle, onSelect, onCloseSubtitles }) => {
    // 字幕设置状态
    const [showSubtitles, setShowSubtitles] = useState(true)
    const [subtitleType, setSubtitleType] = useState('vtt')
    const [fontSize, setFontSize] = useState(100) // 百分比
    const [fontColor, setFontColor] = useState('#FFFFFF')
    const [outline, setOutline] = useState(true)
    const [bold, setBold] = useState(false)
    const [opacity, setOpacity] = useState(100) // 百分比

    // 字幕开关处理
    const handleSubtitleToggle: SwitchProps['onChange'] = (checked) => {
        setShowSubtitles(checked)
        if (!checked) {
            onCloseSubtitles()
        }
    }

    // 字幕类型处理
    const handleSubtitleTypeChange: SelectProps['onChange'] = (value) => {
        setSubtitleType(value)
    }

    // 字体大小处理
    const handleFontSizeChange: NumberInputProps['onChange'] = (value) => {
        console.log('fontSize', value)
        setFontSize(value)
    }

    // 字体颜色处理
    const handleFontColorChange: ColorPickerProps['onChange'] = (color) => {
        setFontColor(color)
    }

    // 描边开关处理
    const handleOutlineToggle: SwitchProps['onChange'] = (checked) => {
        setOutline(checked)
    }

    // 加粗开关处理
    const handleBoldToggle: SwitchProps['onChange'] = (checked) => {
        setBold(checked)
    }

    // 不透明度处理
    const handleOpacityChange: NumberInputProps['onChange'] = (value) => {
        setOpacity(value)
    }

    return (
        <Popover
            visible={isOpen}
            onVisibleChange={onToggle}
            trigger="click"
            position="top"
            content={
                <div className="subtitles-popover-content">
                    {/* 字幕开关 */}
                    <div className="subtitle-setting-item">
                        <span className="subtitle-setting-label">字幕</span>
                        <Switch checked={showSubtitles} onChange={handleSubtitleToggle} />
                    </div>

                    {/* 字幕类型 */}
                    <div className="subtitle-setting-item">
                        <span className="subtitle-setting-label">字幕类型</span>
                        <Select
                            value={subtitleType}
                            options={[
                                { value: 'vtt', label: 'WebVTT (.vtt)' },
                                { value: 'srt', label: 'SubRip (.srt)' },
                                { value: 'ass', label: 'Advanced SubStation Alpha (.ass)' }
                            ]}
                            onChange={handleSubtitleTypeChange}
                        />
                    </div>

                    {/* 字体大小 */}
                    <div className="subtitle-setting-item">
                        <span className="subtitle-setting-label">字体大小</span>
                        <NumberInput
                            defaultValue={fontSize}
                            min={50}
                            max={200}
                            step={10}
                            onChange={handleFontSizeChange}
                        />
                    </div>

                    {/* 字体颜色 */}
                    <div className="subtitle-setting-item">
                        <span className="subtitle-setting-label">字体颜色</span>
                        <ColorPicker defaultValue={fontColor} onChange={handleFontColorChange} />
                    </div>

                    {/* 描边和加粗开关并列 */}
                    <div className="subtitle-setting-row">
                        <div className="subtitle-setting-item">
                            <span className="subtitle-setting-label">描边</span>
                            <Switch checked={outline} size={'small'} onChange={handleOutlineToggle} />
                        </div>
                        <div className="subtitle-setting-item">
                            <span className="subtitle-setting-label">加粗</span>
                            <Switch checked={bold} size={'small'} onChange={handleBoldToggle} />
                        </div>
                    </div>

                    {/* 不透明度 */}
                    <div className="subtitle-setting-item">
                        <span className="subtitle-setting-label">不透明度</span>
                        <NumberInput defaultValue={opacity} min={0} max={100} step={5} onChange={handleOpacityChange} />
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
            <button className={`subtitles-button control-button ${isOpen ? 'active' : ''}`} title="字幕设置">
                {/*<ChevronDown size={20} className={`subtitles-icon ${isOpen ? 'rotated' : ''}`} />*/}
                <span>字幕</span>
            </button>
        </Popover>
    )
}

export default SubtitlesMenu
