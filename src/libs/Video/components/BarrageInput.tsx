import React, {useState} from 'react';
import {Send} from 'lucide-react';
import './BarrageInput.css';

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

  // 获取图标，优先使用自定义图标，否则使用默认图标
  const getIcon = (iconType: keyof NonNullable<BarrageInputProps['customIcons']>, defaultIcon: React.ReactNode) => {
    return customIcons && customIcons[iconType] ? customIcons[iconType] : defaultIcon;
  };

  // 发送弹幕
  const sendBarrage = () => {
    console.log('[BarrageInput] 准备发送弹幕:', input);
    if (!input.trim() || !isPlaying) {
      console.log('[BarrageInput] 弹幕为空或视频未播放，取消发送');
      return;
    }
    
    // 防止重复发送
    const textToSend = input.trim();
    setInput('');
    console.log('[BarrageInput] 发送弹幕:', textToSend);
    onSend(textToSend);
  };

  return (
    <div className="barrage-input-container">
      <div className="barrage-input-wrapper">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendBarrage()}
          placeholder="发送弹幕 (按Enter发送)"
          className="barrage-input"
        />
        <button 
          onClick={sendBarrage}
          className="barrage-send-btn"
        >
          {getIcon('sendIcon', <Send size={16} />)}
        </button>
      </div>
    </div>
  );
};

export default BarrageInput;