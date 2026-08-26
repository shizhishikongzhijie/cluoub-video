/* eslint-disable react-refresh/only-export-components */
import './index.css'

import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import { HeadlessDemo } from './HeadlessDemo'

const Demo = () => {
    const [route, setRoute] = useState(window.location.hash)
    useEffect(() => {
        const onHashChange = () => setRoute(window.location.hash)
        window.addEventListener('hashchange', onHashChange)
        return () => window.removeEventListener('hashchange', onHashChange)
    }, [])
    const headless = route === '#/headless'
    return (
        <>
            <nav className="demo-nav" aria-label="Demo 切换">
                <a href="#/default" aria-current={headless ? undefined : 'page'}>
                    默认播放器
                </a>
                <a href="#/headless" aria-current={headless ? 'page' : undefined}>
                    Headless
                </a>
            </nav>
            {headless ? <HeadlessDemo /> : <App />}
        </>
    )
}

createRoot(document.getElementById('root')!).render(
    // <StrictMode>
    <Demo />
    //</StrictMode>
)
