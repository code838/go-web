'use client'

import { useProtocol } from '@/requests'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import ChevronLeftIcon from '@/svgs/chevron-left.svg'
import { useIsMobile } from '@/hooks/useMediaQuery'

export default function TermsPage() {
	const t = useTranslations('terms')
	const router = useRouter()
	const isMobile = useIsMobile()
	const { data: protocols, isLoading, error } = useProtocol()

	// 查找用户协议 (type: 1)
	const termsProtocol = protocols?.find(p => p.type === 1)

	// 清理HTML内容，移除可能影响页面样式的标签
	const cleanedContent = useMemo(() => {
		if (!termsProtocol?.content) return ''

		let content = termsProtocol.content

		// 移除DOCTYPE、html、head、style、body等标签
		content = content.replace(/<!DOCTYPE[^>]*>/gi, '')
		content = content.replace(/<html[^>]*>/gi, '')
		content = content.replace(/<\/html>/gi, '')
		content = content.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
		content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
		content = content.replace(/<body[^>]*>/gi, '')
		content = content.replace(/<\/body>/gi, '')

		return content.trim()
	}, [termsProtocol?.content])

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand"></div>
			</div>
		)
	}

	if (error || !termsProtocol) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-primary mb-4">
						{t('errorTitle')}
					</h1>
					<p className="text-secondary">
						{t('errorMessage')}
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className='flex min-h-screen flex-col gap-6 pb-6'>
			{/* Header */}
			{isMobile && (
				<div className='flex items-center gap-2'>
					<button onClick={() => router.back()} className='flex h-7 w-7 items-center justify-center rounded-lg bg-white/5'>
						<ChevronLeftIcon />
					</button>
					<h1 className='text-primary text-base font-medium'>{t('title')}</h1>
				</div>
			)}

			{/* Content */}
			<div className="w-full">
				<div
					className="bg-card rounded-xl border border-white/10 overflow-hidden p-8"
					style={{
						color: '#ffffff',
						fontFamily: 'inherit',
						lineHeight: '1.8'
					}}
					dangerouslySetInnerHTML={{ __html: cleanedContent }}
				/>
			</div>
		</div>
	)
}
