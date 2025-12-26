'use client'

import { useRouter } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import ChevronLeftSVG from '@/svgs/chevron-left.svg'
import CheckedSVG from '@/svgs/checked.svg'
import { cn } from '@/lib/utils'
import { toUnderscoreLocale } from '@/lib/locale'
import { useLanguages } from '@/requests'
import { useMemo, useState } from 'react'
import { routing } from '@/i18n/routing'
import type { Language } from '@/types'

interface LanguageOption {
	code: string
	label: string
	nativeLabel: string
}

// 从 localStorage 读取缓存的语言列表
function getCachedLanguages(): LanguageOption[] | null {
	if (typeof window === 'undefined') return null
	try {
		const cached = localStorage.getItem('languages_cache')
		const cacheTime = localStorage.getItem('languages_cache_time')
		if (cached && cacheTime) {
			const age = Date.now() - parseInt(cacheTime, 10)
			// 如果缓存数据在7天内，使用缓存
			if (age < 1000 * 60 * 60 * 24 * 7) {
				const data = JSON.parse(cached) as Language[]
				return data.map((lang: Language) => ({
					code: toUnderscoreLocale(lang.langflag),
					label: lang.langname,
					nativeLabel: lang.langname
				}))
			}
		}
	} catch (e) {
		// 忽略错误
	}
	return null
}

export default function LanguageSettingsPage() {
	const t = useTranslations('languageSettings')
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const currentLocale = toUnderscoreLocale(useLocale())
	const { data: languagesData = [], isLoading } = useLanguages()
	
	// 使用缓存的初始数据
	const [cachedLanguages] = useState<LanguageOption[] | null>(() => getCachedLanguages())

	// 直接使用接口返回的所有语言
	const languages = useMemo<LanguageOption[]>(() => {
		// 如果有接口数据，优先使用接口数据
		if (languagesData.length > 0) {
			return languagesData.map((lang: Language) => ({
				code: toUnderscoreLocale(lang.langflag),
				label: lang.langname,
				nativeLabel: lang.langname
			}))
		}
		
		// 如果有缓存数据，使用缓存数据
		if (cachedLanguages && cachedLanguages.length > 0) {
			return cachedLanguages
		}
		
		// 最后使用默认语言列表
		return [
			{ code: 'en_us', label: 'English', nativeLabel: 'English' },
			{ code: 'zh_cn', label: 'Chinese', nativeLabel: '简体中文' }
		]
	}, [languagesData, cachedLanguages])

	const handleSwitchLocale = (nextLocale: LanguageOption['code']) => {
		// Don't switch if it's already the current locale
		if (nextLocale === currentLocale) return
		
		const queryString = searchParams?.toString()
		const hash = typeof window !== 'undefined' ? window.location.hash : ''
		const href = `/profile${queryString ? `?${queryString}` : ''}${hash}`
		router.replace(href, { locale: nextLocale })
	}

	const handleBack = () => {
		router.back()
	}

	return (
		<div className='min-h-screen  pb-24 lg:pb-8'>
			{/* Header */}
			<div className='sticky top-0 z-10 flex items-center gap-2 bg-[#0E0E10]/80  backdrop-blur-sm'>
				<button
					onClick={handleBack}
					className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-white/10'
				>
					<ChevronLeftSVG />
				</button>
				<h1 className='flex-1 text-center text-lg font-medium text-white pr-10'>{t('title')}</h1>
			</div>

			{/* Language Options */}
			<div className='mt-6 rounded-xl bg-white/5'>
				{languages.map((language, index) => {
					const isSelected = currentLocale === language.code
					const isLast = index === languages.length - 1
					
					return (
						<button
							key={language.code}
							onClick={() => handleSwitchLocale(language.code)}
							className={cn(
								'flex w-full items-center justify-between px-2 py-4 text-left transition-colors hover:bg-white/5',
								!isLast && 'border-b border-[#0E0E10]'
							)}
						>
							<div className='flex flex-col'>
								<span className='text-sm font-medium text-white'>
									{language.nativeLabel}
								</span>
								{language.code === 'en_us' && (
									<span className='text-xs text-white/60'>
										{language.label}
									</span>
								)}
							</div>
							
							{isSelected && (
								<div className='flex h-6 w-6 items-center justify-center rounded-full bg-[#6741FF]'>
									<CheckedSVG />
								</div>
							)}
						</button>
					)
				})}
			</div>

			{/* Description */}
			{/* <div className='mx-4 mt-4 rounded-xl bg-white/5 px-4 py-3'>
				<p className='text-xs text-white/60'>
					{t('description')}
				</p>
			</div> */}
		</div>
	)
}
