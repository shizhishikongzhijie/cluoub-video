import './index.css'

import React, {useEffect, useId, useRef, useState} from 'react'

export interface MenuItemType {
    key: string
    label: React.ReactNode
    disabled?: boolean
    icon?: React.ReactNode
    children?: MenuItemType[]
}

export interface MenuProps {
    items: MenuItemType[]
    defaultSelectedKey?: string
    selectedKey?: string
    onSelect?: (key: string) => void
    className?: string
    style?: React.CSSProperties
}

const Menu: React.FC<MenuProps> = ({
    items,
    defaultSelectedKey,
    selectedKey: controlledSelectedKey,
    onSelect,
    className = '',
    style
}) => {
    const isControlled = controlledSelectedKey !== undefined
    const [selectedKey, setSelectedKey] = useState(isControlled ? controlledSelectedKey : defaultSelectedKey || '')
    const [openKeys, setOpenKeys] = useState<Set<string>>(new Set())

    const id = useId()
    const menuRef = useRef<HTMLUListElement>(null)
    const itemRefs = useRef<Record<string, HTMLLIElement | null>>({})

    // 同步受控选中项
    useEffect(() => {
        if (isControlled) {
            setSelectedKey(controlledSelectedKey)
        }
    }, [controlledSelectedKey, isControlled])

    const handleSelect = (item: MenuItemType) => {
        if (item.disabled) return

        const newKey = item.key
        if (!isControlled) {
            setSelectedKey(newKey)
        }
        onSelect?.(newKey)

        // 如果有子菜单，切换展开状态
        if (item.children && item.children.length > 0) {
            setOpenKeys((prev) => {
                const newSet = new Set(prev)
                if (newSet.has(newKey)) {
                    newSet.delete(newKey)
                } else {
                    newSet.add(newKey)
                }
                return newSet
            })
        }
    }

    const renderMenuItem = (item: MenuItemType, level = 0): React.ReactNode => {
        const hasChildren = !!item.children?.length
        const isOpen = openKeys.has(item.key)
        const isSelected = selectedKey === item.key

        return (
            <li
                key={item.key}
                ref={(el) => (itemRefs.current[item.key] = el)}
                role={hasChildren ? 'menuitem' : 'menuitem'}
                aria-haspopup={hasChildren ? 'true' : undefined}
                aria-expanded={hasChildren ? isOpen : undefined}
                aria-selected={isSelected}
                aria-disabled={item.disabled}
                className={`
          menu-item
          ${isSelected ? 'menu-item-selected' : ''}
          ${item.disabled ? 'menu-item-disabled' : ''}
          ${hasChildren ? 'menu-item-with-children' : ''}
        `.trim()}
                onClick={() => handleSelect(item)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSelect(item)
                    }
                }}
                tabIndex={0}
                style={{ paddingLeft: `${12 + level * 16}px` }}
            >
                {item.icon && <span className="menu-item-icon">{item.icon}</span>}
                <span className="menu-item-label">{item.label}</span>
                {hasChildren && (
                    <span className={`menu-item-arrow ${isOpen ? 'menu-item-arrow-open' : ''}`} aria-hidden="true" />
                )}
            </li>
        )
    }

    const renderMenuItems = (items: MenuItemType[], level = 0) => {
        return items.map((item) => {
            const hasChildren = !!item.children?.length
            const isOpen = openKeys.has(item.key)

            return (
                <React.Fragment key={item.key}>
                    {renderMenuItem(item, level)}
                    {hasChildren && (
                        <div
                            className={`menu-submenu ${isOpen ? 'menu-submenu-open' : ''}`}
                            role="group"
                            aria-labelledby={`${id}-${item.key}`}
                        >
                            <ul className="menu-submenu-list">{renderMenuItems(item.children!, level + 1)}</ul>
                        </div>
                    )}
                </React.Fragment>
            )
        })
    }

    return (
        <ul ref={menuRef} id={id} role="menu" className={`menu ${className}`.trim()} style={style}>
            {renderMenuItems(items)}
        </ul>
    )
}

export default Menu
