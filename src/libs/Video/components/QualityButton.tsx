import React, {useCallback, useEffect, useState} from 'react';
import './QualityButton.css';
import Popover from "../common/popover";
import Menu, {MenuItemType} from "../common/menu";
import {usePlayerCore} from "../hooks";

interface QualityButtonProps {
  customIcons?: {
    qualityIcon?: React.ReactNode;
  };
}

const QualityButton: React.FC<QualityButtonProps> = ({ customIcons }) => {
  // 获取播放器核心实例（不传递参数，因为我们只在已存在的实例上调用方法）
  const playerCore = usePlayerCore({} as any);
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('auto');
  
  // 获取图标，优先使用自定义图标，否则使用默认图标
  const getIcon = (iconType: keyof NonNullable<QualityButtonProps['customIcons']>, defaultIcon: React.ReactNode) => {
    return customIcons && customIcons[iconType] ? customIcons[iconType] : defaultIcon;
  };

  // 构造菜单项
  const menuItems: MenuItemType[] = [
    { key: 'auto', label: '自动' },
    { key: '2160p', label: '2160p' },
    { key: '1440p', label: '1440p' },
    { key: '1080p', label: '1080p' },
    { key: '720p', label: '720p' },
    { key: '480p', label: '480p' },
    { key: '360p', label: '360p' },
  ];

  // 处理画质选择
  const handleQualitySelect = useCallback((key: string) => {
    setCurrentQuality(key);
    setIsPopoverVisible(false);
    // 实际切换画质的逻辑
    playerCore.setQuality(key);
  }, [playerCore]);

  // 监听画质变化
  useEffect(() => {
    const handleQualityChange = (quality: string) => {
      setCurrentQuality(quality);
    };
    
    playerCore.on('qualityChange', handleQualityChange);
    
    return () => {
      playerCore.removeListener('qualityChange', handleQualityChange);
    };
  }, [playerCore]);

  return (
    <Popover 
      visible={isPopoverVisible}
      onVisibleChange={setIsPopoverVisible}
      content={
        <Menu 
          items={menuItems}
          selectedKey={currentQuality}
          onSelect={handleQualitySelect}
        />
      }
      trigger="custom"
      position="top"
      style={{
        '--popover-padding': 0
      }}
    >
      <button 
        className="control-button quality-button"
        onClick={() => setIsPopoverVisible(!isPopoverVisible)}
      >
        {getIcon('qualityIcon', <span>{currentQuality === 'auto' ? '自动' : currentQuality}</span>)}
      </button>
    </Popover>
  );
};

export default QualityButton;