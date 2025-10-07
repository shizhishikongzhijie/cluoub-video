import React, {useCallback, useRef, useState} from 'react';
import {Send} from 'lucide-react';
import './BarrageInput.css';
import Logger from '../utils/Logger';

interface BarrageInputProps {
  isPlaying: boolean;
  onSend: (text: string) => void;
  customIcons?: {
    sendIcon?: React.ReactNode;
  };
}

const BarrageInput: React.FC<BarrageInputProps> = ({ 
  isPlaying, 
  onSend,
  customIcons 
}) => {
  const [input, setInput] = useState('');
  const logger = Logger.getInstance();
  logger.setComponentName('BarrageInput');
  
  // 使用useRef确保初始化日志只打印一次
  const isInitialized = useRef(false);
  
  if (!isInitialized.current) {
    logger.initSuccess();
    isInitialized.current = true;
  }
  
  // 获取图标，优先使用自定义图标，否则使用默认图标
  const getIcon = (iconType: keyof NonNullable<BarrageInputProps['customIcons']>, defaultIcon: React.ReactNode) => {
    return customIcons && customIcons[iconType] ? customIcons[iconType] : defaultIcon;
  };

  // 发送弹幕
  const sendBarrage = useCallback(() => {
    logger.debug('Preparing to send barrage:', input);
    if (!input.trim() || !isPlaying) {
      logger.debug('Barrage is empty or video is not playing, canceling send');
      return;
    }
    
    // 防止重复发送
    const textToSend = input.trim();
    setInput('');
    logger.debug('Sending barrage:', textToSend);
    onSend(textToSend);
  }, [input, isPlaying, onSend]);

  // 处理回车键发送
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendBarrage();
    }
  }, [sendBarrage]);

  // 处理按钮点击发送
  const handleButtonClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    sendBarrage();
  }, [sendBarrage]);

  return (
    <div className="barrage-input-container">
      <div className="barrage-input-wrapper">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="发送弹幕 (按Enter发送)"
          className="barrage-input"
        />
        <button 
          onClick={handleButtonClick}
          className="barrage-send-btn"
        >
          {getIcon('sendIcon', <Send size={16} />)}
        </button>
      </div>
    </div>
  );
};

export default BarrageInput;