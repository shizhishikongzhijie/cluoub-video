import { PlayerSlotContribution, useSlotContributions } from '../react/context'
import styles from '../styles/layers.module.scss'

export const Layers = () => {
    const layers = useSlotContributions('overlay')
    return (
        <div className={styles.layersContainer}>
            {layers.map((layer) => (
                <div
                    key={layer.id}
                    id={`layer-${layer.id}`}
                    className={styles.layerItem}
                    style={{ zIndex: layer.zIndex ?? 10 }}
                >
                    <PlayerSlotContribution contribution={layer} />
                </div>
            ))}
        </div>
    )
}
