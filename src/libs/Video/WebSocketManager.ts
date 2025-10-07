import {v4 as uuidv4} from 'uuid';

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private videoId: string;
  private callbacks: { [key: string]: Function } = {};
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private userId: string = ''; // 添加用户ID以识别自己发送的消息

  constructor(videoId: string) {
    this.videoId = videoId;
  }

  connect(userId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    
    // 保存用户ID
    this.userId = userId;
    
    // 在实际项目中，这里应该连接到真实的WebSocket服务器
    // 由于这是一个演示组件，我们暂时使用模拟方式
    console.log(`Connecting to WebSocket for video ${this.videoId}`);
    
    // 模拟连接过程
    setTimeout(() => {
      // 模拟连接成功
      console.log('WebSocket connected (simulated)');
      this.reconnectAttempts = 0;
      
      // 模拟发送历史弹幕
      if (this.callbacks.history) {
        // 模拟一些历史弹幕
        const historyBarrages = [
          {
            id: uuidv4(),
            text: '欢迎观看',
            userId: 'system',
            username: '系统',
            timestamp: Date.now() - 30000,
            color: '#4ecdc4',
            size: 16,
            position: 20
          },
          {
            id: uuidv4(),
            text: '弹幕测试',
            userId: 'user1',
            username: '用户1',
            timestamp: Date.now() - 20000,
            color: '#ff9ff3',
            size: 14,
            position: 50
          }
        ];
        this.callbacks.history(historyBarrages);
      }
    }, 1000);
  }

  reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    
    this.reconnectAttempts++;
    console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
    
    setTimeout(() => {
      this.connect(this.userId);
    }, 2000 * this.reconnectAttempts);
  }

  sendBarrage(text: string, userId: string, username: string, videoTime: number = 0): void {
    // 在实际项目中，这里会通过WebSocket发送弹幕
    console.log(`Sending barrage: ${text} from ${username}`);
    
    // 保存用户ID
    this.userId = userId;
    
    // 模拟发送过程
    setTimeout(() => {
      // 模拟服务器响应，将弹幕广播给所有用户（包括发送者）
      const barrage = {
        id: uuidv4(),
        text,
        userId,
        username,
        timestamp: Date.now(),
        videoTime: videoTime // 使用传递的视频时间
      };
      
      // 如果有回调函数，调用它
      if (this.callbacks.barrage) {
        this.callbacks.barrage(barrage);
      }
    }, 100);
  }

  onBarrage(callback: Function): void {
    this.callbacks.barrage = callback;
  }

  handleBarrage(barrage: any): void {
    // 防止处理自己发送的消息
    if (barrage.userId === this.userId) {
      console.log('Ignoring own barrage message');
      return;
    }
    
    if (this.callbacks.barrage) {
      this.callbacks.barrage(barrage);
    }
  }

  handleHistory(barrages: any[]): void {
    if (this.callbacks.history) {
      this.callbacks.history(barrages);
    }
  }

  onHistory(callback: Function): void {
    this.callbacks.history = callback;
  }
}