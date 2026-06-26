import React from 'react'
import { useStore } from 'zustand'

import type { PlayerInstance } from '../core/types'
import styles from '../styles/layers.module.scss'

interface LayersProps {
    player: PlayerInstance
}

export const Layers: React.FC<LayersProps> = ({ player }) => {
    // 订阅 Zustand Store 中的 layers 数据
    // 只有当 uiRegistry.layers 发生变化时（比如弹幕插件加载了），组件才会重渲染
    const layers = useStore(player.store, (state) => state.uiRegistry.layers)

    return (
        <div className={styles.layersContainer}>
            {layers.map((layer) => (
                // 每个 Layer 都是绝对定位覆盖在视频上的
                <div
                    key={layer.id}
                    id={`layer-${layer.id}`}
                    className={styles.layerItem}
                    style={{ zIndex: layer.zIndex || 10 }} // 支持插件自定义层级
                >
                    {layer.component}
                </div>
            ))}
        </div>
    )
}
