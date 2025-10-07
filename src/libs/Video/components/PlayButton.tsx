import React from 'react';
import {Pause, Play} from 'lucide-react';
import './PlayButton.css';

interface PlayButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
  customIcons?: {
    playIcon?: React.ReactNode;
    pauseIcon?: React.ReactNode;
  };
}

const PlayButton: React.FC<PlayButtonProps> = ({ 
  isPlaying, 
  onToggle, 
  customIcons 
}) => {
  // 获取图标，优先使用自定义图标，否则使用默认图标
  const getIcon = (iconType: keyof NonNullable<PlayButtonProps['customIcons']>, defaultIcon: React.ReactNode) => {
    return customIcons && customIcons[iconType] ? customIcons[iconType] : defaultIcon;
  };

  return (
    <button 
      className="control-button"
      onClick={onToggle}
    >
      {isPlaying ? 
        getIcon('pauseIcon', <Pause size={20} fill={'white'} />) :
        getIcon('playIcon', <Play size={20} fill={'white'} />)}
    </button>
  );
};

export default PlayButton;