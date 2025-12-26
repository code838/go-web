'use client'

import { ReactNode, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useZone } from '@/requests'
import { ReadonlyURLSearchParams } from 'next/navigation'
import { routing } from '@/i18n/routing'

export interface PrimaryNavItem {
	label: string
	href: string
	icon?: ReactNode | null
}

export function usePrimaryNavItems(): PrimaryNavItem[] {
	const t = useTranslations('header')
	const { data: zones } = useZone()

	return useMemo(() => {
		const items: PrimaryNavItem[] = [
			{
				label: t('home'),
				href: '/'
			}
		]

		if (zones && Array.isArray(zones)) {
			zones.forEach(zone => {
				items.push({
					label: zone.zoneTitle,
					href: `/zone?tab=${zone.zoneTitle}&zoneId=${zone.zoneId}`,
					icon: null
				})
			})
		}

		items.push(
			{ label: t('comingSoon'), href: '/zone?tab=coming' },
			{ label: t('latestRevealed'), href: '/latest' },
			{ label: t('inviteFriends'), href: '/invite' },
			{ label: t('wishlist'), href: '/wishlist' }
		)

		return items
	}, [zones, t])
}

const localeSet = new Set(routing.locales.map(locale => locale.toLowerCase()))

export function normalizePath(path: string) {
	if (!path) {
		return '/'
	}

	const ensured = path.startsWith('/') ? path : `/${path}`
	const segments = ensured.split('/')
	const potentialLocale = segments[1]?.toLowerCase()

	if (potentialLocale && localeSet.has(potentialLocale)) {
		segments.splice(1, 1)
	}

	const normalized = segments.join('/')

	return normalized === '' ? '/' : normalized
}

export function isNavItemActive(href: string, pathname: string, searchParams: ReadonlyURLSearchParams) {
	const normalizedPathname = normalizePath(pathname)

	if (href === '/') {
		return normalizedPathname === '/'
	}

	if (href.includes('?')) {
		const [itemPath, itemQuery] = href.split('?')
		const itemParams = new URLSearchParams(itemQuery)
		const currentTab = searchParams.get('tab')
		const itemTab = itemParams.get('tab')

		const normalizedItemPath = normalizePath(itemPath)

		return normalizedPathname === normalizedItemPath && currentTab === itemTab
	}

	const normalizedHref = normalizePath(href)

	return normalizedPathname.startsWith(normalizedHref)
}
