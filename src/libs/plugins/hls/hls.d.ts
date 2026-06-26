// hls.js 是可选 peerDependency（仅 HLS 源需要），构建时被外部化、运行时由使用方提供。
// 此处提供最小 ambient 声明，使未安装 hls.js 时类型检查仍可通过；
// 实际类型以使用方安装的 hls.js 为准。
declare module 'hls.js' {
    const Hls: any
    export default Hls
}
