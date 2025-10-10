import {useEffect} from 'react';
import {PlayerCore} from '../core';

/**
 * 自定义Hook，用于处理视频元素相关的事件
 * @param videoRef 视频元素的引用
 * @param playerCore 播放器核心实例
 * @param isMuted 当前是否静音
 * @param volume 当前音量
 * @param currentTime 当前播放时间
 */
export const useVideoEvents = (
  videoRef: React.RefObject<HTMLVideoElement>,
  playerCore: PlayerCore,
  isMuted: boolean,
  volume: number,
  currentTime: number
) => {
  // 监听视频播放状态并同步到video元素
  useEffect(() => {
    const video = videoRef.current;
    if (!video || playerCore.videoType === 'dash') return; // DASH模式下由dash.js控制播放

    // 同步播放状态
    if (playerCore.isPlaying) {
      video.play().catch(e => console.error("播放失败:", e));
    } else {
      video.pause();
    }
  }, [playerCore.isPlaying, playerCore.videoType]);

  // 监听音量状态并同步到video元素
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 在DASH模式下，我们仍然需要设置基础的音量属性
    video.muted = isMuted;
    video.volume = volume;
  }, [isMuted, volume]);

  // 监听时间跳转并同步到video元素
  useEffect(() => {
    const video = videoRef.current;
    if (!video || playerCore.videoType === 'dash') return; // DASH模式下由dash.js控制跳转

    // 只有当差异较大时才跳转，避免频繁更新
    if (Math.abs(video.currentTime - currentTime) > 0.1) {
      video.currentTime = currentTime;
    }
  }, [currentTime, playerCore.videoType]);

  // 监听视频播放状态变化（来自video元素）
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // DASH模式下，我们仍然需要监听一些基本事件，但播放控制由dash.js处理
        const isDashMode = playerCore.videoType === 'dash';

        const handlePlay = () => {
            if (!isDashMode) playerCore.play();
        };
        const handlePause = () => {
            if (!isDashMode) playerCore.pause();
        };
        const handleMute = () => playerCore.setMuted(video.muted);
        const handleVolumeChange = () => {
            // 只有当音量真正改变时才通知PlayerCore
            if (video.volume !== volume || video.muted !== isMuted) {
                playerCore.setVolume(video.volume);
            }
        };
        const handleTimeUpdate = () => {
            playerCore.setTimeUpdate(video.currentTime);
        };
        const handleLoadedMetadata = () => {
            playerCore.setDuration(video.duration);
        };

        // 无论什么模式，我们都需要监听这些事件来获取正确的状态
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        const muteListener = () => handleMute();
        const volumeListener = () => handleVolumeChange();
        video.addEventListener('volumechange', muteListener);
        video.addEventListener('volumechange', volumeListener);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('volumechange', muteListener);
            video.removeEventListener('volumechange', volumeListener);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [playerCore, volume, isMuted]);
};