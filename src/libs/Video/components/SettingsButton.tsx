import React from 'react';
import {Settings} from 'lucide-react';
import './SettingsButton.css';

interface SettingsButtonProps {
  customIcons?: {
    settingsIcon?: React.ReactNode;
  };
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ customIcons }) => {
  // 获取图标，优先使用自定义图标，否则使用默认图标
  const getIcon = (iconType: keyof NonNullable<SettingsButtonProps['customIcons']>, defaultIcon: React.ReactNode) => {
    return customIcons && customIcons[iconType] ? customIcons[iconType] : defaultIcon;
  };

  return (
    <button 
      className="control-button"
    >
      {getIcon('settingsIcon', <Settings size={20} />)}
    </button>
  );
};

export default SettingsButton;