import './index.css'

import React, {useEffect, useRef, useState} from 'react'

import Popover from '../popover'

export interface ColorPickerProps {
    value?: string
    defaultValue?: string
    onChange?: (color: string) => void
    className?: string
    style?: React.CSSProperties
}

const ColorPicker: React.FC<ColorPickerProps> = (props) => {
    const { value, defaultValue = '#ffffff', onChange, className = '', style } = props

    const [innerValue, setInnerValue] = useState(defaultValue)
    const [inputValue, setInputValue] = useState(defaultValue)
    const [isPopoverVisible, setIsPopoverVisible] = useState(false)
    const isControlled = value !== undefined

    const currentValue = isControlled ? value : innerValue
    const colorPreviewRef = useRef<HTMLDivElement>(null)

    // 预定义颜色选项
    const presetColors = [
        '#ffffff',
        '#000000',
        '#ff0000',
        '#00ff00',
        '#0000ff',
        '#ffff00',
        '#00ffff',
        '#ff00ff',
        '#ffa500',
        '#800080',
        '#008000',
        '#800000',
        '#000080',
        '#808080',
        '#c0c0c0'
    ]

    useEffect(() => {
        if (isControlled) {
            setInputValue(value)
        }
    }, [value, isControlled])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value
        setInputValue(newColor)

        if (!isControlled) {
            setInnerValue(newColor)
        }
        onChange?.(newColor)
    }

    const handleColorSelect = (color: string) => {
        setInputValue(color)
        if (!isControlled) {
            setInnerValue(color)
        }
        onChange?.(color)
        setIsPopoverVisible(false)
    }

    const handlePreviewClick = () => {
        setIsPopoverVisible(true)
    }

    return (
        <div className={`color-picker-container ${className}`.trim()} style={style}>
            <div className="color-picker-preview" onClick={handlePreviewClick} ref={colorPreviewRef}>
                <div className="color-preview-swatch" style={{ backgroundColor: currentValue }} />
            </div>
            <input type="text" className="color-picker-input" value={inputValue} onChange={handleInputChange} />
            <Popover
                visible={isPopoverVisible}
                onVisibleChange={setIsPopoverVisible}
                trigger="custom"
                position="bottomLeft"
                content={
                    <div className="color-picker-popover">
                        <div className="color-picker-preset">
                            {presetColors.map((color, index) => (
                                <div
                                    key={index}
                                    className="color-picker-swatch"
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleColorSelect(color)}
                                />
                            ))}
                        </div>
                        <div className="color-picker-custom">
                            <input
                                type="color"
                                className="color-picker-custom-input"
                                value={currentValue}
                                onChange={(e) => handleColorSelect(e.target.value)}
                            />
                            <span>自定义颜色</span>
                        </div>
                    </div>
                }
            >
                <button className="color-picker-dropdown-button" onClick={() => setIsPopoverVisible(!isPopoverVisible)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M6 9L12 15L18 9"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </Popover>
        </div>
    )
}

export default ColorPicker
