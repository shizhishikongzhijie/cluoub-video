import './index.css'

import React, {useEffect, useRef, useState} from 'react'
import ReactDOM from 'react-dom'

/**
 * 弹出层位置类型
 */
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

/**
 * 弹出层动画状态
 */
type PopoverAnimationState = 'entering' | 'entered' | 'exiting' | 'exited'

/**
 * 弹出层组件属性接口
 */
export interface PopoverProps {
    /**
     * 弹出层内容
     */
    content: React.ReactNode

    /**
     * 触发方式
     * @default 'hover'
     */
    trigger?: 'hover' | 'click' | 'focus' | 'custom'

    /**
     * 弹出位置
     * @default 'top'
     */
    position?: PopoverPosition

    /**
     * 是否显示小三角箭头
     * @default true
     */
    showArrow?: boolean

    /**
     * 弹出层与元素间距
     */
    offset?: number

    /**
     * 是否受控显示
     */
    visible?: boolean

    /**
     * 默认是否显示
     * @default false
     */
    defaultVisible?: boolean

    /**
     * 是否在初始时就挂载内容
     * @default false
     */
    mountContentOnEnter?: boolean

    /**
     * 显示隐藏状态变化的回调
     */
    onVisibleChange?: (visible: boolean) => void

    /**
     * 子元素
     */
    children: React.ReactElement

    /**
     * 自定义类名
     */
    className?: string

    /**
     * 自定义样式
     */
    style?: React.CSSProperties & {
        '--popover-padding'?: number | string
        '--z-index'?: number | string
    }
}

/**
 * 弹出层组件
 *
 * @remarks
 * 该组件用于在触发元素附近显示一个弹出层，常用于显示提示信息、操作菜单等。
 *
 * @example
 * ```tsx
 * <Popover content={<div>这是提示内容</div>}>
 *   <button>悬停显示提示</button>
 * </Popover>
 * ```
 *
 * @param props - 弹出层属性
 */
const Popover: React.FC<PopoverProps> = (props) => {
    const {
        content,
        trigger = 'hover',
        position = 'top',
        showArrow = true,
        offset = 10,
        visible,
        defaultVisible = false,
        mountContentOnEnter = false,
        onVisibleChange,
        children,
        className = '',
        style
    } = props

    const [isVisible, setIsVisible] = useState<boolean>(visible !== undefined ? visible : defaultVisible)
    const [animationState, setAnimationState] = useState<PopoverAnimationState>('exited')
    const popoverRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLElement>(null)
    const arrowRef = useRef<HTMLDivElement>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // 处理受控模式
    useEffect(() => {
        if (visible !== undefined) {
            setIsVisible(visible)
            if (visible) {
                setAnimationState('entering')
                // 延迟一帧设置entered状态，确保动画能正常触发
                requestAnimationFrame(() => {
                    setAnimationState('entered')
                })
            } else {
                setAnimationState('exiting')
            }
        }
    }, [visible])

    // 计算弹出层位置
    const updatePosition = () => {
        if (!popoverRef.current || !triggerRef.current || !isVisible) return

        const triggerRect = triggerRef.current.getBoundingClientRect()
        const popoverRect = popoverRef.current.getBoundingClientRect()

        let top = 0
        let left = 0
        switch (position) {
            case 'top':
                top = triggerRect.top - popoverRect.height - offset
                left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2
                break
            case 'topLeft':
                top = triggerRect.top - popoverRect.height
                left = triggerRect.left
                break
            case 'topRight':
                top = triggerRect.top - popoverRect.height
                left = triggerRect.right - popoverRect.width
                break
            case 'bottom':
                top = triggerRect.bottom + offset
                left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2
                break
            case 'bottomLeft':
                top = triggerRect.bottom
                left = triggerRect.left
                break
            case 'bottomRight':
                top = triggerRect.bottom
                left = triggerRect.right - popoverRect.width
                break
            case 'left':
                top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2
                left = triggerRect.left - popoverRect.width - offset
                break
            case 'leftTop':
                top = triggerRect.top
                left = triggerRect.left - popoverRect.width
                break
            case 'leftBottom':
                top = triggerRect.bottom - popoverRect.height
                left = triggerRect.left - popoverRect.width
                break
            case 'right':
                top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2
                left = triggerRect.right + offset
                break
            case 'rightTop':
                top = triggerRect.top
                left = triggerRect.right
                break
            case 'rightBottom':
                top = triggerRect.bottom - popoverRect.height
                left = triggerRect.right
                break
        }

        // 防止超出视窗
        const padding = 8
        top = Math.max(padding, Math.min(top, window.innerHeight - popoverRect.height - padding))
        left = Math.max(padding, Math.min(left, window.innerWidth - popoverRect.width - padding))

        popoverRef.current.style.top = `${top}px`
        popoverRef.current.style.left = `${left}px`
    }
    // 处理动画状态转换
    useEffect(() => {
        if (isVisible) {
            requestAnimationFrame(updatePosition)
            setAnimationState('entering')
            // 延迟一帧设置entered状态，确保动画能正常触发
            requestAnimationFrame(() => {
                setAnimationState('entered')
            })
        } else {
            setAnimationState('exiting')
            // 延迟一段时间后设置exited状态，确保消失动画能正常播放
            if (visibilityTimeoutRef.current) {
                clearTimeout(visibilityTimeoutRef.current)
            }
            visibilityTimeoutRef.current = setTimeout(() => {
                setAnimationState('exited')
            }, 200) // 与CSS中的transition时间保持一致
        }
    }, [isVisible])

    // 清理定时器
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
            if (visibilityTimeoutRef.current) {
                clearTimeout(visibilityTimeoutRef.current)
            }
        }
    }, [])

    const showPopover = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }

        const newVisible = true
        if (visible === undefined) {
            setIsVisible(newVisible)
        }
        onVisibleChange?.(newVisible)
    }

    const hidePopover = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }

        timerRef.current = setTimeout(() => {
            // 检查鼠标是否还在Popover或触发元素上
            const isHovered = popoverRef.current?.matches(':hover') || triggerRef.current?.matches(':hover')
            if (!isHovered) {
                const newVisible = false
                if (visible === undefined) {
                    setIsVisible(newVisible)
                }
                onVisibleChange?.(newVisible)
            }
        }, 150) // 设置150ms延迟隐藏
    }

    const handleToggle = () => {
        const newVisible = !isVisible
        if (visible === undefined) {
            setIsVisible(newVisible)
        }
        onVisibleChange?.(newVisible)
    }

    // 监听窗口大小变化
    useEffect(() => {
        if (isVisible) {
            window.addEventListener('resize', updatePosition)
            return () => {
                window.removeEventListener('resize', updatePosition)
            }
        }
    }, [isVisible])

    // 处理子元素事件
    const getTriggerProps = () => {
        const triggerProps: React.HTMLAttributes<HTMLElement> = {}

        switch (trigger) {
            case 'hover':
                triggerProps.onMouseEnter = (e: React.MouseEvent) => {
                    showPopover()
                    ;(children.props as any).onMouseEnter?.(e)
                }
                triggerProps.onMouseLeave = (e: React.MouseEvent) => {
                    // 延迟隐藏，给用户一些时间移动到popover内容上
                    setTimeout(() => {
                        // 检查鼠标是否在Popover上
                        if (!popoverRef.current?.matches(':hover')) {
                            hidePopover()
                        }
                    }, 50)
                    ;(children.props as any).onMouseLeave?.(e)
                }
                break
            case 'click':
                triggerProps.onClick = (e: React.MouseEvent) => {
                    handleToggle()
                    ;(children.props as any).onClick?.(e)
                }
                break
            case 'focus':
                triggerProps.onFocus = () => {
                    showPopover()
                    ;(children.props as any).onFocus?.()
                }
                triggerProps.onBlur = () => {
                    hidePopover()
                    ;(children.props as any).onBlur?.()
                }
                break
            case 'custom':
                // 对于custom模式，不添加任何事件处理，只保留ref引用
                break
        }

        return triggerProps
    }

    // 克隆子元素并添加事件处理
      const triggerElement = React.cloneElement(children, {
          ...(children.props || {}),
          ...getTriggerProps()
      })

    // 渲染弹出层内容
    const renderPopover = () => {
        // 如果不挂载内容直到进入，并且当前不可见，则不渲染
        if (mountContentOnEnter && animationState === 'exited' && !isVisible) return null

        // 如果处于退出完成状态，则不渲染
        //if (animationState === 'exited' && !isVisible) return null;

        return ReactDOM.createPortal(
            <div
                ref={popoverRef}
                className={`popover ${position} ${animationState} ${className}`.trim()}
                style={style}
                onMouseEnter={trigger === 'hover' || trigger === 'custom' ? showPopover : undefined}
                onMouseLeave={trigger === 'hover' || trigger === 'custom' ? hidePopover : undefined}
            >
                {showArrow && <div ref={arrowRef} className="popover-arrow" />}
                <div className="popover-content">{content}</div>
            </div>,
            document.body
        )
    }

    return (
        <>
            {triggerElement}
            {renderPopover()}
        </>
    )
}

Popover.displayName = 'Popover'
export default Popover
