'use client'

import { useState, useEffect } from 'react'

/**
 * 媒体查询 Hook
 * @param query - 媒体查询字符串，例如 '(max-width: 1024px)'
 * @returns boolean - 是否匹配查询条件
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false)

	useEffect(() => {
		const mediaQuery = window.matchMedia(query)
		
		// 初始设置
		setMatches(mediaQuery.matches)

		// 监听变化
		const handleChange = (e: MediaQueryListEvent) => {
			setMatches(e.matches)
		}

		// 添加监听器
		mediaQuery.addEventListener('change', handleChange)

		// 清理
		return () => {
			mediaQuery.removeEventListener('change', handleChange)
		}
	}, [query])

	return matches
}

/**
 * 移动端检测 Hook
 * @returns boolean - 是否为移动设备（宽度 < 1024px）
 */
export function useIsMobile(): boolean {
	return useMediaQuery('(max-width: 1199px)')
}

/**
 * 平板检测 Hook
 * @returns boolean - 是否为平板设备（宽度 >= 768px 且 < 1024px）
 */
export function useIsTablet(): boolean {
	return useMediaQuery('(min-width: 768px) and (max-width: 1199px)')
}

/**
 * 桌面端检测 Hook
 * @returns boolean - 是否为桌面设备（宽度 >= 1024px）
 */
export function useIsDesktop(): boolean {
	return useMediaQuery('(min-width: 1200px)')
}

