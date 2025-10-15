import React, {useEffect, useRef, useState} from 'react';
import './index.css';

export interface MenuItemType {
  key: string;
  label: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
  children?: MenuItemType[];
}

interface MenuProps {
  /**
   * 菜单项数据
   */
  items: MenuItemType[];
  
  /**
   * 默认选中的菜单项 key
   */
  defaultSelectedKey?: string;
  
  /**
   * 选中的菜单项 key（受控模式）
   */
  selectedKey?: string;
  
  /**
   * 选中菜单项变化时的回调
   */
  onSelect?: (key: string) => void;
  
  /**
   * 自定义类名
   */
  className?: string;
  
  /**
   * 自定义样式
   */
  style?: React.CSSProperties;
}

const Menu: React.FC<MenuProps> = (props) => {
  const {
    items,
    defaultSelectedKey,
    selectedKey,
    onSelect,
    className = '',
    style
  } = props;
  
  const [innerSelectedKey, setInnerSelectedKey] = useState<string>(defaultSelectedKey || '');
  const selectedKeyRef = useRef(selectedKey !== undefined ? selectedKey : innerSelectedKey);
  
  // 更新选中项的引用
  useEffect(() => {
    selectedKeyRef.current = selectedKey !== undefined ? selectedKey : innerSelectedKey;
  }, [selectedKey, innerSelectedKey]);
  
  // 处理菜单项点击
  const handleSelect = (key: string, disabled: boolean | undefined) => {
    if (disabled) return;
    
    if (selectedKey === undefined) {
      setInnerSelectedKey(key);
    }
    onSelect?.(key);
  };
  
  // 渲染菜单项
  const renderMenuItem = (item: MenuItemType, level = 0) => {
    const isSelected = selectedKeyRef.current === item.key;
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <div 
        key={item.key}
        className={`
          menu-item 
          ${isSelected ? 'menu-item-selected' : ''} 
          ${item.disabled ? 'menu-item-disabled' : ''}
          ${hasChildren ? 'menu-item-with-children' : ''}
        `.trim()}
        onClick={() => handleSelect(item.key, item.disabled)}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        {item.icon && <span className="menu-item-icon">{item.icon}</span>}
        <span className="menu-item-label">{item.label}</span>
        {hasChildren && <span className="menu-item-arrow"></span>}
      </div>
    );
  };
  
  // 渲染菜单
  const renderMenu = (menuItems: MenuItemType[], level = 0) => {
    return menuItems.map(item => {
      const hasChildren = item.children && item.children.length > 0;
      
      return (
        <div key={item.key} className="menu-group">
          {renderMenuItem(item, level)}
          {hasChildren && (
            <div className="menu-submenu">
              {renderMenu(item.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };
  
  return (
    <div className={`menu ${className}`.trim()} style={style}>
      {renderMenu(items)}
    </div>
  );
};

export default Menu;