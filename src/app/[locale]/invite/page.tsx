'use client'

import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { toast } from '@/components/toast'
import { useAuth } from '@/hooks/useAuth'
import { useBasicInfo } from '@/requests'
import { INVITE_URL } from '@/consts'
import ChevronLeftIcon from '@/svgs/chevron-left.svg'
import Carousel from '@/components/carousel'

export default function Page() {
	const t = useTranslations('invite')
	const router = useRouter()
	const [copiedCode, setCopiedCode] = useState(false)
	const [copiedLink, setCopiedLink] = useState(false)
	const { userInfo, initUserInfo } = useAuth()
	const { data: basicInfo } = useBasicInfo()

	// 初始化用户信息
	useEffect(() => {
		initUserInfo()
	}, [initUserInfo])

	// 从 inviteLink 中提取邀请码
	const extractInviteCode = (inviteLink?: string): string => {
		if (!inviteLink) return ''
		const match = inviteLink.match(/invite=([^&]+)/)
		return match ? match[1] : ''
	}

	// 获取完整的邀请链接
	const getFullInviteLink = (inviteLink?: string): string => {
		if (!inviteLink) return ''
		// 将 /invite 替换为 /invite-join
		const updatedLink = inviteLink.replace('/invite', '/invite-join')
		return `${INVITE_URL}${updatedLink}`
	}

	const inviteCode = extractInviteCode(userInfo?.inviteLink)
	const fullInviteLink = userInfo?.inviteLink
	const commissionEarned = basicInfo?.invitePoints || '0'
	const invitedCount = userInfo?.inviteUsers || 0
	const totalPoints = userInfo?.points || 0

	const handleCopyCode = async () => {
		if (!inviteCode) {
			toast.error(t('noInviteCode') || '邀请码不存在')
			return
		}
		try {
			await navigator.clipboard.writeText(inviteCode)
			toast.success(t('codeCopied'))
			setCopiedCode(true)
			setTimeout(() => setCopiedCode(false), 2000)
		} catch (err) {
			console.error('Failed to copy:', err)
		}
	}

	const handleCopyLink = async () => {
		if (!fullInviteLink) {
			toast.error(t('noInviteLink') || '邀请链接不存在')
			return
		}
		try {
			await navigator.clipboard.writeText(fullInviteLink)
			toast.success(t('linkCopied'))
			setCopiedLink(true)
			setTimeout(() => setCopiedLink(false), 2000)
		} catch (err) {
			console.error('Failed to copy:', err)
		}
	}

	return (
		<div className='space-y-6 pb-6 md:space-y-8'>
		{/* Mobile Header */}
		<div className='flex items-center gap-2 md:hidden'>
			<button onClick={() => router.back()} className='flex h-7 w-7 items-center justify-center rounded-lg bg-white/5'>
				<ChevronLeftIcon />
			</button>
			<h1 className='flex-1 text-center text-primary text-base font-medium pr-9'>{t('title')}</h1>
		</div>

		{/* Desktop & Mobile Hero Section */}
		<section className='flex flex-col gap-4 md:h-[300px] md:flex-row'>
			{/* Hero Image - hidden on mobile per Figma, shown on desktop */}
			<Carousel type={2} className='hidden md:flex md:flex-1 md:min-w-[540px] md:rounded-2xl md:overflow-hidden' />

			{/* Mobile Hero Image */}
			<Carousel type={2} className='relative h-40 w-full overflow-hidden rounded-2xl border border-[#1D1D1D] md:hidden' />

				{/* Info Card */}
				<div className='bg-card space-y-2 rounded-xl p-4 min-w-[380px] md:space-y-8 md:px-8 md:py-6 flex flex-col justify-around'>
					<h2 className='text-primary text-base font-semibold md:text-[20px]'>{t('subtitle')}</h2>

					<div className='space-y-2 md:space-y-4'>
						<div className='flex items-center text-sm md:text-base'>
							<span className='text-primary'>{t('invitedCount')}</span>
							<span className='text-primary ml-1 font-semibold'>{invitedCount}</span>
						</div>
						<div className='flex flex-wrap items-center gap-2 text-sm md:text-base'>
							<span className='text-primary'>{t('inviteCode')}</span>
							<span className='text-primary font-semibold mr-1'>{inviteCode || '-'}</span>
							<button
								onClick={handleCopyCode}
								disabled={!inviteCode}
								className={`inline-flex h-7 items-center justify-center rounded px-3 text-xs font-semibold leading-none transition md:h-8 md:px-4 ${copiedCode ? 'bg-brand/50' : 'bg-brand'} text-primary disabled:opacity-50 disabled:cursor-not-allowed`}
							>
								{t('copy')}
							</button>
							<button
								onClick={handleCopyLink}
								disabled={!fullInviteLink}
								className={`inline-flex h-7 items-center justify-center rounded px-2 text-xs font-semibold leading-none transition md:h-8 md:px-3 ${copiedLink ? 'bg-brand/50' : 'bg-brand'} text-primary disabled:opacity-50 disabled:cursor-not-allowed`}
							>
								{t('copyLink')}
							</button>
						</div>
						<div className='flex items-center text-sm md:text-base'>
							<span className='text-primary'>{t('commissionEarned')}</span>
							<span className='text-primary ml-1'>
								{totalPoints} {t('points')}
							</span>
						</div>

						{/* <div className='flex items-center gap-2 text-sm font-semibold'>
							<Link href='/invite-records-mobile' className='text-brand underline'>
								{t('inviteRecords')}
							</Link>
							<Link href='/invite-records-mobile?tab=commission' className='text-brand underline'>
								{t('commissionRecords')}
							</Link>
						</div> */}
					</div>
				</div>
			</section>

			{/* Invitation Rules */}
			<div className='bg-card space-y-2 rounded-xl p-4 md:space-y-4 md:px-8 md:py-6'>
				<h2 className='text-primary text-base font-medium md:text-lg'>{t('rulesTitle')}</h2>

				<div className='space-y-3 md:space-y-4'>
					<div>
						<h3 className='text-subtitle text-xs md:text-sm'>{t('rule1Title')}</h3>
						<p className='text-secondary mt-1 text-xs md:text-sm'>{t('rule1Content')}</p>
					</div>
					<div>
						<h3 className='text-subtitle text-xs md:text-sm'>{t('rule2Title')}</h3>
						<p className='text-secondary mt-1 text-xs md:text-sm'>{t('rule2Content')}</p>
					</div>
					<div>
						<h3 className='text-subtitle text-xs md:text-sm'>{t('rule3Title')}</h3>
						<p className='text-secondary mt-1 text-xs md:text-sm'>{t('rule3Content',{points:commissionEarned||'xx'})}</p>
					</div>
				</div>
			</div>

			{/* Tips */}
			<div className='bg-card space-y-2 rounded-xl p-4 md:space-y-4 md:px-8 md:py-6'>
				<h2 className='text-primary text-base font-medium md:text-lg'>{t('tipsTitle')}</h2>

				<div className='space-y-3 md:space-y-4'>
					<div>
						<h3 className='text-subtitle text-xs md:text-sm'>{t('tip1Title')}</h3>
						<p className='text-secondary mt-1 text-xs md:text-sm'>{t('tip1Content')}</p>
					</div>
					<div>
						<h3 className='text-subtitle text-xs md:text-sm'>{t('tip2Title')}</h3>
						<p className='text-secondary mt-1 text-xs md:text-sm'>{t('tip2Content')}</p>
					</div>
					<div>
						<h3 className='text-subtitle text-xs md:text-sm'>{t('tip3Title')}</h3>
						<p className='text-secondary mt-1 text-xs md:text-sm'>{t('tip3Content')}</p>
					</div>
					<div>
						<h3 className='text-subtitle text-xs md:text-sm'>{t('tip4Title')}</h3>
						<p className='text-secondary mt-1 text-xs md:text-sm'>{t('tip4Content')}</p>
					</div>
				</div>
			</div>
		</div>
	)
}
