import React from 'react';
import {Maximize} from 'lucide-react';

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onToggle: () => void;
  customIcons?: {
    fullscreenIcon?: React.ReactNode;
  };
}

const FullscreenButton: React.FC<FullscreenButtonProps> = ({ 
  isFullscreen, 
  onToggle, 
  customIcons 
}) => {
  // 获取图标，优先使用自定义图标，否则使用默认图标
  const getIcon = (iconType: keyof NonNullable<FullscreenButtonProps['customIcons']>, defaultIcon: React.ReactNode) => {
    return customIcons && customIcons[iconType] ? customIcons[iconType] : defaultIcon;
  };

  return (
    <button 
      className="control-button"
      onClick={onToggle}
    >
      {getIcon('fullscreenIcon', <Maximize size={20} />)}
    </button>
  );
};

export default FullscreenButton;