import './index.css'

import React, {useState} from 'react'

import Popover from '../popover'

export interface SelectOption {
    value: string
    label: string
    disabled?: boolean
}

export interface SelectProps {
    value?: string
    defaultValue?: string
    options: SelectOption[]
    onChange?: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    style?: React.CSSProperties
}

const Select: React.FC<SelectProps> = (props) => {
    const {
        value,
        defaultValue,
        options,
        onChange,
        placeholder = '请选择',
        disabled = false,
        className = '',
        style
    } = props

    const [innerValue, setInnerValue] = useState(defaultValue || '')
    const [isPopoverVisible, setIsPopoverVisible] = useState(false)
    const isControlled = value !== undefined

    const currentValue = isControlled ? value : innerValue
    const selectedOption = options.find((option) => option.value === currentValue)

    const handleSelect = (optionValue: string) => {
        if (!isControlled) {
            setInnerValue(optionValue)
        }
        onChange?.(optionValue)
        setIsPopoverVisible(false)
    }

    return (
        <div className={`select-container ${className} ${disabled ? 'select-disabled' : ''}`.trim()} style={style}>
            <Popover
                visible={isPopoverVisible}
                onVisibleChange={setIsPopoverVisible}
                trigger="click"
                position="bottomLeft"
                content={
                    <div className="select-popover">
                        {options.map((option) => (
                            <div
                                key={option.value}
                                className={`select-option ${option.disabled ? 'select-option-disabled' : ''} ${
                                    currentValue === option.value ? 'select-option-selected' : ''
                                }`}
                                onClick={() => !option.disabled && handleSelect(option.value)}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                }
                style={{
                    '--popover-padding': 0,
                    '--z-index': 1001
                }}
            >
                <div
                    className={`select-trigger ${isPopoverVisible ? 'select-trigger-active' : ''}`}
                    onClick={() => !disabled && setIsPopoverVisible(!isPopoverVisible)}
                >
                    <span className="select-value">
                        {selectedOption ? (
                            selectedOption.label
                        ) : (
                            <span className="select-placeholder">{placeholder}</span>
                        )}
                    </span>
                    <span className={`select-arrow ${isPopoverVisible ? 'select-arrow-open' : ''}`} />
                </div>
            </Popover>
        </div>
    )
}

export default Select
