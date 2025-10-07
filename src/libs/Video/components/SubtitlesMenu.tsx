import React, {useEffect, useRef} from 'react';
import './SubtitlesMenu.css';
import {ChevronDown} from 'lucide-react';

interface SubtitleOption {
  id: string;
  label: string;
  language: string;
  isActive: boolean;
}

interface SubtitlesMenuProps {
  options: SubtitleOption[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (optionId: string) => void;
  onCloseSubtitles: () => void;
}

const SubtitlesMenu: React.FC<SubtitlesMenuProps> = ({
  options,
  isOpen,
  onToggle,
  onSelect,
  onCloseSubtitles
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  
  // 处理点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <div className="subtitles-menu-container" ref={menuRef}>
      {/* 字幕按钮 */}
      <button 
        className={`subtitles-button control-button ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
        title="字幕设置"
      >
        <ChevronDown 
          size={20} 
          className={`subtitles-icon ${isOpen ? 'rotated' : ''}`}
        />
      </button>
      
      {/* 弹出菜单 */}
      {isOpen && (
        <div className="subtitles-popover">
          {/* 关闭字幕选项 */}
          <button 
            className="subtitle-option"
            onClick={onCloseSubtitles}
          >
            <span className="subtitle-label">关闭字幕</span>
            <span className="subtitle-check">✓</span>
          </button>
          
          {/* 字幕轨道选项 */}
          {options.map((option) => (
            <button
              key={option.id}
              className={`subtitle-option ${option.isActive ? 'active' : ''}`}
              onClick={() => onSelect(option.id)}
            >
              <span className="subtitle-label">{option.label}</span>
              {option.isActive && <span className="subtitle-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubtitlesMenu;