import '@/styles/globals.css'

import type { Metadata } from 'next'
import Layout from '@/layout'
import Head from '@/layout/head'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import { toBcp47Locale, toUnderscoreLocale } from '@/lib/locale'

const title = '1U VIP',
	description = '',
	keywords = ''

export const metadata: Metadata = {
	title,
	description,
	keywords,
	openGraph: {
		title,
		description
	},
	twitter: {
		title,
		description
	}
}

export default async function RootLayout({
	children,
	params
}: Readonly<{
	children: React.ReactNode
	params: Promise<{ locale: string }>
}>) {
	const { locale: rawLocale } = await params
	const normalizedLocale = toUnderscoreLocale(rawLocale)
	const matchedLocale = routing.locales.find(locale => toUnderscoreLocale(locale) === normalizedLocale)

	if (!matchedLocale) {
		notFound()
	}

	const providerLocale = toBcp47Locale(matchedLocale)

	setRequestLocale(providerLocale)
	const messages = await getMessages({ locale: providerLocale })

	return (
		<html lang={providerLocale} suppressHydrationWarning>
			<Head />

			<body>
				<NextIntlClientProvider locale={providerLocale} messages={messages}>
					<Layout>{children}</Layout>
				</NextIntlClientProvider>
			</body>
		</html>
	)
}
