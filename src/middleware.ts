import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { toUnderscoreLocale } from './lib/locale'

const intlMiddleware = createMiddleware(routing)
const localeSet = new Set(routing.locales.map(locale => toUnderscoreLocale(locale)))

export default function middleware(request: Parameters<typeof intlMiddleware>[0]) {
	const url = request.nextUrl.clone()
	const originalPathname = url.pathname

	const segments = originalPathname.split('/').filter(Boolean)
	let localeEncountered = false
	let changed = false

	const normalizedSegments = segments.reduce<string[]>((acc, segment) => {
		const normalized = toUnderscoreLocale(segment)

		if (localeSet.has(normalized)) {
			if (!localeEncountered) {
				localeEncountered = true
				if (segment !== normalized) {
					changed = true
				}
				acc.push(normalized)
			} else {
				changed = true
				// Skip duplicate locale segments
			}
		} else {
			acc.push(segment)
		}

		return acc
	}, [])

	const normalizedPathname = '/' + normalizedSegments.join('/')

	if (changed || normalizedPathname !== originalPathname) {
		url.pathname = normalizedPathname === '/' ? '/' : normalizedPathname
		return NextResponse.redirect(url)
	}

	return intlMiddleware(request)
}

export const config = {
	matcher: ['/', '/([a-z]{2}(?:_[a-z]{2})?)/:path*', '/((?!privacy-policy|terms-of-service|api/|_next|_vercel|.*\\..*).*)']
}
