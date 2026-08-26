import {
    createPlayer,
    definePlugin,
    type PlayerInstance,
    type PlayerState,
    type PluginError
} from '@cluoub-design/cluoub-video/core'
import { capturePlugin } from '@cluoub-design/cluoub-video/plugins/capture'
import { type DanmuAPI, danmuPlugin } from '@cluoub-design/cluoub-video/plugins/danmu'
import { dashPlugin } from '@cluoub-design/cluoub-video/plugins/dash'
import { hlsPlugin } from '@cluoub-design/cluoub-video/plugins/hls'
import { type SubtitleAPI, subtitlePlugin } from '@cluoub-design/cluoub-video/plugins/subtitle'
import {
    CluoubVideo,
    PlayerProvider,
    PlayerRoot,
    PlayerSlot,
    usePlayer,
    usePlayerState,
    usePluginApi
} from '@cluoub-design/cluoub-video/react'

const typedPlugin = definePlugin({
    id: 'typed-fixture',
    schema: {
        parse: (input: unknown): { label: string } => input as { label: string }
    },
    setup: (_context, config) => ({ api: config.label.length })
})

typedPlugin.configure({ label: 'fixture' })
// @ts-expect-error label is required by the configured plugin schema
typedPlugin.configure({})
// @ts-expect-error unknown plugin fields are rejected by the public config type
danmuPlugin.configure({ unexpected: true })

const player = createPlayer({ source: 'fixture.mp4', plugins: [typedPlugin.configure({ label: 'ok' })] })
const state: PlayerState = player.store.getState()
const instance: PlayerInstance = player
const pluginError: PluginError | undefined = undefined
const danmuApi: DanmuAPI | undefined = player.plugins.get(danmuPlugin)
const subtitleApi: SubtitleAPI | undefined = player.plugins.get(subtitlePlugin)

void [
    CluoubVideo,
    PlayerProvider,
    PlayerRoot,
    PlayerSlot,
    usePlayer,
    usePlayerState,
    usePluginApi,
    capturePlugin,
    dashPlugin,
    hlsPlugin,
    subtitlePlugin,
    state,
    instance,
    pluginError,
    danmuApi,
    subtitleApi
]

// @ts-expect-error source is required
createPlayer({})
