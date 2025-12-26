'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useServices } from '@/requests'
import ChevronLeftSVG from '@/svgs/chevron-left.svg'
import ChevronRightSVG from '@/svgs/chevron-right.svg'
import QQSVG from '@/svgs/socials/qq.svg'
import VXSVG from '@/svgs/socials/vx.svg'
import TGSVG from '@/svgs/socials/tg.svg'
import WhatsappSVG from '@/svgs/socials/whatsapp.svg'

type FAQ = {
	id: string
	question: string
	answer: string
	category: 'all' | 'account' | 'product'
}

type Category = 'all' | 'account' | 'product'

export default function CustomerServicePage() {
	const t = useTranslations('customerService')
	const router = useRouter()
	const [activeCategory, setActiveCategory] = useState<Category>('all')
	const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
	
	const { data: services } = useServices()

	// FAQ数据
	const faqs: FAQ[] = [
		{
			id: 'withdrawDelay',
			question: t('faq.withdrawDelay.question'),
			answer: t('faq.withdrawDelay.answer'),
			category: 'account'
		},
		{
			id: 'withdrawRejected',
			question: t('faq.withdrawRejected.question'),
			answer: t('faq.withdrawRejected.answer'),
			category: 'account'
		},
		{
			id: 'withdrawCancel',
			question: t('faq.withdrawCancel.question'),
			answer: t('faq.withdrawCancel.answer'),
			category: 'account'
		},
		{
			id: 'howToParticipate',
			question: t('faq.howToParticipate.question'),
			answer: t('faq.howToParticipate.answer'),
			category: 'product'
		},
		{
			id: 'luckyCode',
			question: t('faq.luckyCode.question'),
			answer: t('faq.luckyCode.answer'),
			category: 'product'
		}
	]

	// 根据分类筛选FAQ
	const filteredFAQs = faqs.filter(faq => 
		activeCategory === 'all' || faq.category === activeCategory
	)

	// 切换FAQ展开状态
	const toggleFAQ = (id: string) => {
		setExpandedFAQ(expandedFAQ === id ? null : id)
	}

	// 分类选项
	const categories = [
		{ key: 'all' as Category, label: t('categoryAll') },
		{ key: 'account' as Category, label: t('categoryAccount') },
		{ key: 'product' as Category, label: t('categoryProduct') }
	]

	return (
		<div className='min-h-screen pb-24'>
			{/* Header */}
			<div className='sticky top-0 z-10 flex items-center gap-2 bg-[#0E0E10]/80 pb-4 backdrop-blur-sm'>
				<button
					onClick={() => router.back()}
					className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-white/10'
				>
					<ChevronLeftSVG />
				</button>
				<h1 className='flex-1 text-center text-lg font-semibold text-white/80 pr-10'>{t('title')}</h1>
			</div>

			{/* Decorative Circle */}
			<div className='absolute right-16 top-28 h-24 w-24 rounded-full bg-[#6741FF] opacity-60 blur-[250px]' />

			<div className='px-4 py-6 space-y-6'>
				{/* FAQ Section */}
				<div className='space-y-6'>
					<h2 className='text-base font-medium text-[#6741FF]'>{t('faqTitle')}</h2>

					{/* Category Filters */}
					<div className='flex gap-2'>
						{categories.map((category) => (
							<button
								key={category.key}
								onClick={() => setActiveCategory(category.key)}
								className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
									activeCategory === category.key
										? 'bg-[#6741FF] text-white'
										: 'bg-white/5 text-[#6E6E70]'
								}`}
							>
								{category.label}
							</button>
						))}
					</div>

					{/* FAQ List */}
					<div className='space-y-3'>
						{filteredFAQs.map((faq) => (
							<div
								key={faq.id}
								className='rounded-lg bg-white/5 border border-[#1D1D1D] overflow-hidden'
							>
								<button
									onClick={() => toggleFAQ(faq.id)}
									className='flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5'
								>
									<span className='flex-1 text-sm font-medium text-white/80'>
										{faq.question}
									</span>
									<ChevronRightSVG 
										className={`h-5 w-5 text-white/60 transition-transform ${
											expandedFAQ === faq.id ? 'rotate-90' : ''
										}`}
									/>
								</button>
								
								{expandedFAQ === faq.id && (
									<div className='border-t border-[#1D1D1D] px-4 py-3'>
										<p className='text-sm text-white/60 leading-relaxed'>
											{faq.answer}
										</p>
									</div>
								)}
							</div>
						))}
					</div>

					{filteredFAQs.length === 0 && (
						<div className='text-center py-8'>
							<p className='text-white/40'>{t('noFAQs')}</p>
						</div>
					)}
				</div>

				{/* Contact Us Section */}
				<div className='space-y-6 border-t border-[#1D1D1D] pt-6'>
					<h2 className='text-base font-medium text-[#6741FF]'>{t('contactUs')}</h2>
					
					<div className='flex items-center gap-3'>
						{/* Telegram */}
						<button
							onClick={() => {
								const telegramService = services?.find(service => service.type === 1)
								if (telegramService?.account) {
									window.open(telegramService.account, '_blank')
								}
							}}
							className='flex items-center justify-center'
						>
							<TGSVG />
						</button>

						{/* WhatsApp */}
						<button
							onClick={() => {
								const whatsappService = services?.find(service => service.type === 2)
								if (whatsappService?.account) {
									window.open(whatsappService.account, '_blank')
								}
							}}
							className='flex items-center justify-center'
						>
							<WhatsappSVG />
						</button>

						{/* QQ */}
						<button
							onClick={() => {
								const qqService = services?.find(service => service.type === 3)
								if (qqService?.account) {
									window.open(qqService.account, '_blank')
								}
							}}
							className='flex items-center justify-center'
						>
							<QQSVG />
						</button>

						{/* WeChat */}
						<button
							onClick={() => {
								const wechatService = services?.find(service => service.type === 4)
								if (wechatService?.account) {
									window.open(wechatService.account, '_blank')
								}
							}}
							className='flex items-center justify-center'
						>
							<VXSVG />
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
