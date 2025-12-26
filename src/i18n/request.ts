import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'
import { toBcp47Locale, toUnderscoreLocale } from '@/lib/locale'

type LocaleEntry = {
	routing: string
	underscore: string
	bcp: string
}

const localeEntries: LocaleEntry[] = routing.locales.map(locale => {
	const underscore = toUnderscoreLocale(locale)

	return {
		routing: locale,
		underscore,
		bcp: toBcp47Locale(locale)
	}
})

const underscoreToEntry = new Map(localeEntries.map(entry => [entry.underscore, entry]))
const fallbackEntry =
	underscoreToEntry.get(toUnderscoreLocale(routing.defaultLocale)) ?? localeEntries[0]

const resolveLocaleEntry = (value?: string | null): LocaleEntry => {
	if (!value) {
		return fallbackEntry
	}

	const underscore = toUnderscoreLocale(value)

	return underscoreToEntry.get(underscore) ?? fallbackEntry
}

export default getRequestConfig(async ({ requestLocale }) => {
	const entry = resolveLocaleEntry(await requestLocale)

	return {
		locale: entry.bcp,
		messages: (await import(`../../messages/${entry.underscore}.json`)).default
	}
})
