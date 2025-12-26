'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import ChevronLeftIcon from '@/svgs/chevron-left.svg'
import ChevronRightSVG from '@/svgs/mine/chevron-right.svg'

export default function AboutUsPage() {
	const t = useTranslations('aboutUs')
	const router = useRouter()

	return (
		<div className='flex min-h-screen flex-col gap-6 pb-6'>
		{/* Header */}
		<div className='flex items-center gap-2'>
			<button onClick={() => router.back()} className='flex h-7 w-7 items-center justify-center rounded-lg bg-white/5'>
				<ChevronLeftIcon />
			</button>
			<h1 className='flex-1 text-center text-primary text-base font-medium pr-9'>{t('title')}</h1>
		</div>

			{/* Content */}
			<div className='flex flex-col rounded-xl pt-7 overflow-hidden'>
				{/* Logo and Version */}
				<div className='bg-card flex flex-col items-center gap-6 border-b border-[#0E0E10] py-16'>
					{/* Logo */}
					<img src={'/favicon.png'} className='flex h-20 w-20 items-center justify-center rounded-full ' />

					{/* Version */}
					<span className='text-secondary text-base -mt-6'>{t('version')}</span>
				</div>

				{/* Menu Items */}
				<div className='bg-card flex flex-col'>
					{/* Privacy Policy */}
					<Link href='/privacy' className='flex items-center justify-between border-b border-[#0E0E10] px-6 py-4'>
						<span className='text-primary flex-1 text-sm font-medium'>{t('privacyPolicy')}</span>
						<ChevronRightSVG className='h-6 w-6 text-white' />
					</Link>

					{/* Terms of Service */}
					<Link href='/terms' className='flex items-center justify-between border-b border-[#0E0E10] px-6 py-4'>
						<span className='text-primary flex-1 text-sm font-medium'>{t('termsOfService')}</span>
						<ChevronRightSVG className='h-6 w-6 text-white' />
					</Link>

					{/* Version Update */}
					{/* <button className='flex items-center justify-between px-6 py-4'>
						<span className='text-primary flex-1 text-left text-sm font-medium'>{t('versionUpdate')}</span>
						<ChevronRightSVG className='h-6 w-6 text-white' />
					</button> */}
				</div>
			</div>
		</div>
	)
}

