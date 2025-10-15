import React, {useCallback, useEffect, useState} from 'react';
import './SpeedButton.css';
import Popover from "../common/popover";
import Menu, {MenuItemType} from "../common/menu";
import {usePlayerCore} from "../hooks";

interface SpeedButtonProps {
  customIcons?: {
    speedIcon?: React.ReactNode;
  };
}

const SpeedButton: React.FC<SpeedButtonProps> = ({ customIcons }) => {
  // 获取播放器核心实例（不传递参数，因为我们只在已存在的实例上调用方法）
  const playerCore = usePlayerCore({} as any);
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1.0);
  
  // 获取图标，优先使用自定义图标，否则使用默认图标
  const getIcon = (iconType: keyof NonNullable<SpeedButtonProps['customIcons']>, defaultIcon: React.ReactNode) => {
    return customIcons && customIcons[iconType] ? customIcons[iconType] : defaultIcon;
  };

  // 构造菜单项
  const menuItems: MenuItemType[] = [
    { key: '2.0', label: '2.0X' },
    { key: '1.5', label: '1.5X' },
    { key: '1.0', label: '1.0X' },
    { key: '0.5', label: '0.5X' },
  ];

  // 处理倍速选择
  const handleSpeedSelect = useCallback((key: string) => {
    const speed = parseFloat(key);
    setCurrentSpeed(speed);
    setIsPopoverVisible(false);
    // 实际切换倍速的逻辑
    playerCore.setSpeed(speed);
  }, [playerCore]);

  // 监听倍速变化
  useEffect(() => {
    const handleSpeedChange = (speed: number) => {
      setCurrentSpeed(speed);
    };
    
    playerCore.on('speedChange', handleSpeedChange);
    
    return () => {
      playerCore.removeListener('speedChange', handleSpeedChange);
    };
  }, [playerCore]);

  return (
    <Popover 
      visible={isPopoverVisible}
      onVisibleChange={setIsPopoverVisible}
      content={
        <Menu 
          items={menuItems}
          selectedKey={currentSpeed.toString()}
          onSelect={handleSpeedSelect}
        />
      }
      trigger="custom"
      position="top"
      style={{
        '--popover-padding': 0
      }}
    >
      <button 
        className="control-button speed-button"
        onClick={() => setIsPopoverVisible(!isPopoverVisible)}
      >
        {getIcon('speedIcon', <span>{currentSpeed.toFixed(1)}X</span>)}
      </button>
    </Popover>
  );
};

export default SpeedButton;