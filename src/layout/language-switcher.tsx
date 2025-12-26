'use client'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toUnderscoreLocale } from '@/lib/locale'
import { routing } from '@/i18n/routing'
import { useLanguages } from '@/requests'
import type { Language } from '@/types'

export default function LanguageSwitcher() {
	const providerLocale = useLocale()
	const locale = toUnderscoreLocale(providerLocale)
	const [open, setOpen] = useState(false)
	const ref = useRef<HTMLDivElement | null>(null)
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const { data: languages = [], isLoading } = useLanguages()

	useEffect(() => {
		function onClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false)
			}
		}
		document.addEventListener('mousedown', onClickOutside)
		return () => document.removeEventListener('mousedown', onClickOutside)
	}, [])

	const localesSet = useMemo(
		() => new Set(routing.locales.map(code => toUnderscoreLocale(code))),
		[]
	)

	// 过滤出系统支持的语言，并按系统支持的语言顺序排序
	const localeOptions = useMemo(() => {
		if (isLoading || !languages.length) {
			// 加载中或没有数据时，使用默认语言列表
			return [
				{ code: 'en_us', label: 'English' },
				{ code: 'zh_cn', label: '中文' }
			]
		}
		
		// 过滤出系统支持的语言
		const supportedLanguages = languages.filter((lang: Language) => 
			localesSet.has(toUnderscoreLocale(lang.langflag))
		)
		
		// 按照系统支持的语言顺序排序
		return routing.locales
			.map(localeCode => {
				const lang = supportedLanguages.find(
					(l: Language) => toUnderscoreLocale(l.langflag) === toUnderscoreLocale(localeCode)
				)
				return lang ? {
					code: toUnderscoreLocale(lang.langflag),
					label: lang.langname
				} : null
			})
			.filter((item): item is { code: string; label: string } => item !== null)
	}, [languages, isLoading, localesSet])

	const stripLocaleFromPath = (path: string) => {
		if (!path.startsWith('/')) return path || '/'

		const segments = path.split('/').filter(Boolean)

		while (segments.length > 0 && localesSet.has(toUnderscoreLocale(segments[0]))) {
			segments.shift()
		}

		const rest = segments.join('/')
		const normalized = rest ? `/${rest}` : '/'
		return normalized
	}

	type LocaleCode = string

	function handleSwitchLocale(nextLocale: LocaleCode) {
		const basePath = stripLocaleFromPath(pathname)
		const queryString = searchParams?.toString()
		const hash = typeof window !== 'undefined' ? window.location.hash : ''
		const href = `${basePath}${queryString ? `?${queryString}` : ''}${hash}`
		router.replace(href, { locale: nextLocale })
		setOpen(false)
	}

	return (
		<div ref={ref} className='relative'>
			<button
				onClick={() => setOpen(o => !o)}
				className='bg-button flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors'>
				<Languages  />
			</button>

			{open && (
				<div className='dropdown absolute right-0 z-10 mt-2 w-[120px] p-1 max-h-[200px] overflow-y-auto custom-scrollbar'>
					<ul className='flex flex-col'>
						{localeOptions.map(option => (
							<li key={option.code}>
								<button
									onClick={() => handleSwitchLocale(option.code)}
									className={cn(
										'block w-full rounded-md px-3 py-2 text-left text-xs text-white transition-colors hover:bg-white/5',
										locale === option.code && 'text-brand bg-white/10'
									)}>
									{option.label}
								</button>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	)
}
