'use client'

import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface LoadingSpinnerProps {
	/**
	 * 尺寸大小
	 * @default 'md'
	 */
	size?: 'sm' | 'md' | 'lg' | 'xl'
	/**
	 * 文本提示
	 */
	text?: string
	/**
	 * 是否全屏显示
	 * @default false
	 */
	fullScreen?: boolean
	/**
	 * 自定义类名
	 */
	className?: string
}

const sizeClasses = {
	sm: 'w-4 h-4 border-2',
	md: 'w-8 h-8 border-2',
	lg: 'w-12 h-12 border-3',
	xl: 'w-16 h-16 border-4'
}

const textSizeClasses = {
	sm: 'text-xs',
	md: 'text-sm',
	lg: 'text-base',
	xl: 'text-lg'
}

/**
 * 加载动画组件
 * 可以单独使用或作为全屏加载遮罩
 */
export function LoadingSpinner({ size = 'md', text, fullScreen = false, className }: LoadingSpinnerProps) {
	const t = useTranslations('common')
	const spinnerContent = (
		<div className={cn('flex flex-col items-center justify-center gap-3', !fullScreen && className)}>
			<div
				className={cn(
					'animate-spin rounded-full border-solid border-brand border-t-transparent',
					sizeClasses[size]
				)}
				role='status'
				aria-label={t('loading')}
			/>
			{text && (
				<p className={cn('text-secondary font-medium', textSizeClasses[size])}>
					{text}
				</p>
			)}
		</div>
	)

	if (fullScreen) {
		return (
			<div className={cn('fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm', className)}>
				{spinnerContent}
			</div>
		)
	}

	return spinnerContent
}

/**
 * 页面级加载组件
 * 用于整个页面加载状态
 */
export function PageLoading({ text, size = 'lg', fullScreen = false }: Pick<LoadingSpinnerProps, 'text' | 'size'> & { fullScreen?: boolean }) {
	const t = useTranslations('common')
	const loadingText = text || t('loadingText')
	
	if (fullScreen) {
		// 真正的全屏加载（覆盖整个视口）
		return <LoadingSpinner size={size} text={loadingText} fullScreen />
	}
	
	// 常规页面加载（在容器内居中）
	return (
		<div className='flex min-h-screen items-center justify-center'>
			<LoadingSpinner size={size} text={loadingText} />
		</div>
	)
}

/**
 * 内容区域加载组件
 * 用于页面内某个区域的加载状态
 */
export function ContentLoading({ text, size = 'md', className }: LoadingSpinnerProps) {
	const t = useTranslations('common')
	const loadingText = text || t('loadingText')
	
	return (
		<div className={cn('flex items-center justify-center py-12', className)}>
			<LoadingSpinner size={size} text={loadingText} />
		</div>
	)
}

