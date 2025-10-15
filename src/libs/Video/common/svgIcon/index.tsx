import type {SVGProps} from 'react'
import {forwardRef, useEffect, useState} from 'react'

import 'index.css'
import type {SvgIconProps} from './types'

const SvgIcon = forwardRef<SVGSVGElement, SvgIconProps & SVGProps<SVGSVGElement>>((props, ref) => {
  const { src, size = 24, primary = false, noBackground = false, className = '', ...restProps } = props

  const [svgContent, setSvgContent] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)

  // 判断src是URL还是SVG字符串
  const isUrl = src.startsWith('http') || src.startsWith('/')

  // 构建类名
  const iconClass = [
    'svg-icon',
    primary ? 'primary' : '',
    noBackground ? 'no-background' : '',
    loading ? 'loading' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  // 构建样式
  const iconStyle = {
    width: size,
    height: size,
    ...restProps.style
  }

  useEffect(() => {
    if (!isUrl) {
      // 直接使用SVG字符串
      setSvgContent(src)
      return
    }

    // 从URL获取SVG内容
    const fetchSvg = async () => {
      setLoading(true)
      setError(false)

      try {
        const response = await fetch(src)
        const svgText = await response.text()
        setSvgContent(svgText)
      } catch (err) {
        console.error('Failed to load SVG:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchSvg()
  }, [src, isUrl])

  if (loading) {
    return (
      <span className={iconClass} style={iconStyle}>
        <svg className={'svg-content'} viewBox="0 0 24 24" {...restProps} ref={ref}>
          {/* 加载状态 */}
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </span>
    )
  }

  if (error) {
    return (
      <span className={iconClass} style={iconStyle}>
        <svg className={'svg-content'} viewBox="0 0 24 24" {...restProps} ref={ref}>
          {/* 错误状态 */}
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      </span>
    )
  }

  // 渲染SVG内容
  return (
    <span
      className={iconClass}
      style={iconStyle}
      dangerouslySetInnerHTML={{
        __html: svgContent.replace(/<svg([^>]*>)/i, `<svg class="${'svg-content'}" $1`)
      }}
    />
  )
})

SvgIcon.displayName = 'SvgIcon'

export default SvgIcon
