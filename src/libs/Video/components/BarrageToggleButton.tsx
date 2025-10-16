import {MessageSquare} from 'lucide-react'
import React from 'react'

interface BarrageToggleButtonProps {
    isActive: boolean
    onClick: () => void
    title?: string
}

const BarrageToggleButton: React.FC<BarrageToggleButtonProps> = ({ isActive, onClick, title = '弹幕开关' }) => {
    return (
        <button className={`control-button ${isActive ? 'active' : ''}`} onClick={onClick} title={title} type="button">
            <MessageSquare size={20} />
        </button>
    )
}

export default BarrageToggleButton
