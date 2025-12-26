export const toUnderscoreLocale = (value: string): string => {
	if (!value) return value
	return value.replace('-', '_').toLowerCase()
}

export const toBcp47Locale = (value: string): string => {
	if (!value) return value
	const normalized = toUnderscoreLocale(value)
	const [language, region] = normalized.split('_')
	if (!region) return language
	return `${language}-${region.toUpperCase()}`
}

