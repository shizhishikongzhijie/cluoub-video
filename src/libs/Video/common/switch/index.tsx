import React, {useEffect, useRef, useState} from 'react';
import './index.css';

/**
 * 开关组件属性接口
 */
export interface SwitchProps {
  /**
   * 是否选中
   */
  checked?: boolean;
  
  /**
   * 初始是否选中
   */
  defaultChecked?: boolean;
  
  /**
   * 状态改变时的回调
   */
  onChange?: (checked: boolean, event: React.MouseEvent<HTMLSpanElement> | React.KeyboardEvent<HTMLSpanElement>) => void;
  
  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean;
  
  /**
   * 开关尺寸
   * @default 'default'
   */
  size?: 'small' | 'default' | 'large';
  
  /**
   * 打开时的显示文本（size为small时无效）
   */
  checkedText?: React.ReactNode;
  
  /**
   * 关闭时的显示文本（size为small时无效）
   */
  uncheckedText?: React.ReactNode;
  
  /**
   * 是否加载中状态
   * @default false
   */
  loading?: boolean;
  
  /**
   * 自定义类名
   */
  className?: string;
  
  /**
   * 自定义样式
   */
  style?: React.CSSProperties;
  
  /**
   * aria-label属性，用于无障碍访问
   */
  'aria-label'?: string;
  
  /**
   * aria-labelledby属性，用于无障碍访问
   */
  'aria-labelledby'?: string;
}

/**
 * 开关组件
 * 
 * @remarks
 * 开关组件用于在两种状态之间进行切换，常用于设置选项的开启/关闭。
 * 
 * @example
 * ```tsx
 * <Switch checked={true} onChange={(checked) => console.log(checked)} />
 * <Switch checkedText="开" uncheckedText="关" />
 * ```
 * 
 * @param props - 开关组件属性
 */
const Switch: React.FC<SwitchProps> = (props) => {
  const {
    checked,
    defaultChecked = false,
    onChange,
    disabled = false,
    size = 'default',
    checkedText,
    uncheckedText,
    loading = false,
    className = '',
    style,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy
  } = props;

  const [isChecked, setIsChecked] = useState<boolean>(checked !== undefined ? checked : defaultChecked);
  const switchRef = useRef<HTMLSpanElement>(null);

  // 处理受控模式
  useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked);
    }
  }, [checked]);

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (disabled || loading) return;
    
    const newChecked = !isChecked;
    if (checked === undefined) {
      setIsChecked(newChecked);
    }
    onChange?.(newChecked, e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (disabled || loading) return;
    
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const newChecked = !isChecked;
      if (checked === undefined) {
        setIsChecked(newChecked);
      }
      onChange?.(newChecked, e);
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'switch-small';
      case 'large': return 'switch-large';
      default: return 'switch-default';
    }
  };

  const switchClass = [
    'switch',
    getSizeClass(),
    isChecked ? 'switch-checked' : 'switch-unchecked',
    disabled ? 'switch-disabled' : '',
    loading ? 'switch-loading' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <span
      ref={switchRef}
      className={switchClass}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      style={style}
      role="switch"
      aria-checked={isChecked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      {loading && <span className="switch-loading-icon" />}
      <span className="switch-inner">
        {size !== 'small' && (
          isChecked ? checkedText : uncheckedText
        )}
      </span>
      <span className="switch-handle" />
    </span>
  );
};
Switch.displayName = 'Switch';
export default Switch;