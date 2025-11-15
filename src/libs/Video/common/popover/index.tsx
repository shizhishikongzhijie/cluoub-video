import './index.css'

import React, {useEffect, useId, useRef, useState} from 'react'
import ReactDOM from 'react-dom'

export type PopoverPosition =
    | 'top'
    | 'topLeft'
    | 'topRight'
    | 'bottom'
    | 'bottomLeft'
    | 'bottomRight'
    | 'left'
    | 'leftTop'
    | 'leftBottom'
    | 'right'
    | 'rightTop'
    | 'rightBottom'

type PopoverAnimationState = 'entering' | 'entered' | 'exiting' | 'exited'

export interface PopoverProps {
    content: React.ReactNode
    trigger?: 'hover' | 'click' | 'focus' | 'custom'
    position?: PopoverPosition
    showArrow?: boolean
    offset?: number
    visible?: boolean
    defaultVisible?: boolean
    mountContentOnEnter?: boolean
    onVisibleChange?: (visible: boolean) => void
    children: React.ReactElement
    className?: string
    style?: React.CSSProperties & {
        '--popover-padding'?: number | string
        '--z-index'?: number | string
    }
}

const Popover: React.FC<PopoverProps> = ({
    content,
    trigger = 'hover',
    position = 'top',
    showArrow = true,
    offset = 10,
    visible: controlledVisible,
    defaultVisible = false,
    mountContentOnEnter = false,
    onVisibleChange,
    children,
    className = '',
    style
}) => {
    const isControlled = controlledVisible !== undefined
    const [isVisible, setIsVisible] = useState(isControlled ? !!controlledVisible : defaultVisible)
    const [animationState, setAnimationState] = useState<PopoverAnimationState>(isVisible ? 'entered' : 'exited')

    const popoverRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLElement>(null)
    const enterTimerRef = useRef<number | null>(null)
    const leaveTimerRef = useRef<number | null>(null)

    // 用于 aria-describedby 关联
    const id = useId()

    // 同步受控状态
    useEffect(() => {
        if (isControlled) {
            const newVisible = !!controlledVisible
            if (newVisible !== isVisible) {
                setIsVisible(newVisible)
                if (newVisible) {
                    setAnimationState('entering')
                    requestAnimationFrame(() => setAnimationState('entered'))
                } else {
                    setAnimationState('exiting')
                    setTimeout(() => setAnimationState('exited'), 200)
                }
            }
        }
    }, [controlledVisible, isControlled, isVisible])

    // 更新位置（防抖 + 只在可见时执行）
    const updatePosition = () => {
        if (!isVisible || !popoverRef.current || !triggerRef.current) return

        const triggerRect = triggerRef.current.getBoundingClientRect()
        const popoverRect = popoverRef.current.getBoundingClientRect()

        let top = 0
        let left = 0

        switch (position) {
            case 'top':
                top = triggerRect.top - popoverRect.height * 1.0526 - offset
                left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2
                break
            case 'topLeft':
                top = triggerRect.top - popoverRect.height - offset
                left = triggerRect.left
                break
            case 'topRight':
                top = triggerRect.top - popoverRect.height - offset
                left = triggerRect.right - popoverRect.width
                break
            case 'bottom':
                top = triggerRect.bottom + offset
                left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2
                break
            case 'bottomLeft':
                top = triggerRect.bottom + offset
                left = triggerRect.left
                break
            case 'bottomRight':
                top = triggerRect.bottom + offset
                left = triggerRect.right - popoverRect.width
                break
            case 'left':
                top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2
                left = triggerRect.left - popoverRect.width - offset
                break
            case 'leftTop':
                top = triggerRect.top
                left = triggerRect.left - popoverRect.width - offset
                break
            case 'leftBottom':
                top = triggerRect.bottom - popoverRect.height
                left = triggerRect.left - popoverRect.width - offset
                break
            case 'right':
                top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2
                left = triggerRect.right + offset
                break
            case 'rightTop':
                top = triggerRect.top
                left = triggerRect.right + offset
                break
            case 'rightBottom':
                top = triggerRect.bottom - popoverRect.height
                left = triggerRect.right + offset
                break
        }

        // 边界限制（防止出屏）
        const padding = 8
        top = Math.max(padding, Math.min(top, window.innerHeight - popoverRect.height - padding))
        left = Math.max(padding, Math.min(left, window.innerWidth - popoverRect.width - padding))

        Object.assign(popoverRef.current.style, { top: `${top}px`, left: `${left}px` })
    }

    // 显示弹窗
    const show = () => {
        if (leaveTimerRef.current) window.clearTimeout(leaveTimerRef.current)
        if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current)

        enterTimerRef.current = window.setTimeout(() => {
            const nextVisible = true
            if (!isControlled) setIsVisible(nextVisible)
            onVisibleChange?.(nextVisible)
        }, 0)
    }

    // 隐藏弹窗（带延迟）
    const hide = () => {
        if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current)
        if (leaveTimerRef.current) window.clearTimeout(leaveTimerRef.current)

        leaveTimerRef.current = window.setTimeout(() => {
            // 检查是否仍悬停在 popover 或 trigger 上
            const isHovered = popoverRef.current?.matches(':hover') || triggerRef.current?.matches(':hover')
            if (!isHovered) {
                const nextVisible = false
                if (!isControlled) setIsVisible(nextVisible)
                onVisibleChange?.(nextVisible)
            }
        }, 150)
    }

    // 切换显隐（用于 click/focus）
    const toggle = () => {
        const nextVisible = !isVisible
        if (!isControlled) setIsVisible(nextVisible)
        onVisibleChange?.(nextVisible)
    }

    // 动画状态同步
    useEffect(() => {
        if (isVisible) {
            setAnimationState('entering')
            requestAnimationFrame(() => {
                updatePosition()
                setAnimationState('entered')
            })
        } else {
            setAnimationState('exiting')
            setTimeout(() => setAnimationState('exited'), 200)
        }
    }, [isVisible])

    // 监听窗口 resize
    useEffect(() => {
        if (isVisible) {
            const handleResize = () => requestAnimationFrame(updatePosition)
            window.addEventListener('resize', handleResize)
            return () => window.removeEventListener('resize', handleResize)
        }
    }, [isVisible])

    // 清理定时器
    useEffect(() => {
        return () => {
            if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current)
            if (leaveTimerRef.current) window.clearTimeout(leaveTimerRef.current)
        }
    }, [])

    // 构建触发器 props
    const getTriggerProps = () => {
        const baseProps = { ref: triggerRef }

        if (trigger === 'hover') {
            return {
                ...baseProps,
                onMouseEnter: show,
                onMouseLeave: hide,
                'aria-describedby': isVisible ? id : undefined
            }
        }

        if (trigger === 'click') {
            return {
                ...baseProps,
                onClick: toggle,
                'aria-expanded': isVisible,
                'aria-haspopup': 'dialog'
            }
        }

        if (trigger === 'focus') {
            return {
                ...baseProps,
                onFocus: show,
                onBlur: hide,
                'aria-describedby': isVisible ? id : undefined
            }
        }

        return baseProps // custom
    }

    const triggerElement = React.cloneElement(children, {
        ...children.props,
        ...getTriggerProps()
    })

    // 是否应渲染内容
    const shouldRenderContent = !mountContentOnEnter || isVisible || animationState !== 'exited'

    return (
        <>
            {triggerElement}
            {shouldRenderContent &&
                ReactDOM.createPortal(
                    <div
                        id={id}
                        ref={popoverRef}
                        role="tooltip"
                        className={`popover ${position} ${animationState} ${className}`.trim()}
                        style={style}
                        onMouseEnter={trigger === 'hover' ? show : undefined}
                        onMouseLeave={trigger === 'hover' ? hide : undefined}
                    >
                        {showArrow && <div className="popover-arrow" />}
                        <div className="popover-content">{content}</div>
                    </div>,
                    document.body
                )}
        </>
    )
}

Popover.displayName = 'Popover'
export default Popover
