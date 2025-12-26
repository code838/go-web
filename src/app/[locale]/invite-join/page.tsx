'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { toast } from '@/components/toast'
import { IMG_BASE_URL } from '@/consts'
import { useAuth } from '@/hooks/useAuth'
import { useBasicInfo, useInviteInfo } from '@/requests'
import CopyIcon from '@/svgs/invite/copy.svg'
import AndroidIcon from '@/svgs/invite/android.svg'
import IosIcon from '@/svgs/invite/ios.svg'
import { useAuthDialogStore } from '@/components/auth-dialogs/store'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useIsMobile } from '@/hooks/useMediaQuery'

export default function InviteJoinPage() {
	const t = useTranslations('inviteJoin')
	const { userInfo, initUserInfo } = useAuth()
	const { data: basicInfo } = useBasicInfo()
	const searchParams = useSearchParams()
	const { openDialog } = useAuthDialogStore()
	const router = useRouter()
	const isMobile = useIsMobile()
	const [isClient, setIsClient] = useState(false)

	// 从 URL 获取邀请码参数（用于注册时填充）
	const urlInviteCode = searchParams.get('inviteCode') || searchParams.get('invite') || undefined

	// 使用 useInviteInfo hook 获取邀请页面信息
	const { data: inviteLinks } = useInviteInfo()

	// 初始化用户信息
	useEffect(() => {
		initUserInfo()
	}, [initUserInfo])

	// 确保在客户端渲染
	useEffect(() => {
		setIsClient(true)
	}, [])

	// 从 inviteLink 中提取邀请码
	const extractInviteCode = (inviteLink?: string): string => {
		if (!inviteLink) return ''
		const match = inviteLink.match(/invite=([^&]+)/)
		return match ? match[1] : ''
	}

	// 优先使用 URL 参数的邀请码，否则使用用户的邀请码
	const inviteCode = urlInviteCode || extractInviteCode(userInfo?.inviteLink)
	const invitePoints = basicInfo?.invitePoints || 0

	// 获取 iOS 和 Android 的下载链接
	const iosDownloadLink = inviteLinks?.find((link) => link.type === 1)
	const androidDownloadLink = inviteLinks?.find((link) => link.type === 2)
	const iosUrl = iosDownloadLink ? `${IMG_BASE_URL}${iosDownloadLink.path}` : ''
	const androidUrl = androidDownloadLink ? `${IMG_BASE_URL}${androidDownloadLink.path}` : ''

	const handleCopyCode = async () => {
		if (!inviteCode) {
			toast.error(t('inviteCodeNotExist'))
			return
		}
		try {
			await navigator.clipboard.writeText(inviteCode)
			toast.success(t('inviteCodeCopied'))
		} catch (err) {
			console.error('Failed to copy:', err)
		}
	}

	const handleGoRegister = () => {
		if (!isClient) return

		if (isMobile) {
			// 移动端：跳转到注册页面，并带上邀请码和mode参数
			const params = new URLSearchParams()
			params.set('mode', 'register')
			if (inviteCode) {
				params.set('invite', inviteCode)
			}
			router.push(`/auth?${params.toString()}`)
		} else {
			// PC端：跳转到首页，并带上参数以触发注册弹框
			const params = new URLSearchParams()
			params.set('openRegister', 'true')
			if (inviteCode) {
				params.set('invite', inviteCode)
			}
			router.push(`/?${params.toString()}`)
		}
	}

	return (
		<div className='min-h-screen relative overflow-hidden flex flex-col'>
			{/* Main content - centered */}
			<div className='flex-1 flex items-center justify-center overflow-hidden' >
				<div className='w-full max-w-[978px] flex flex-col items-center px-4'>
					{/* Background Image - positioned above invite card */}
					<div className='relative w-[130vw] max-w-[978px] h-[520px]'>
						<img
							src='/images/invite/invite-bg.png'
							className='w-full h-full object-cover'
						/>
						{/* Content overlay on background image */}
						<div className='absolute inset-0 flex items-center justify-center mb-55'>
							<div className='w-full max-w-[640px] flex flex-col items-center'>
								{/* Logo - fixed at top */}
								<div className='relative z-10 mb-10'>
									<div className='flex items-center gap-3 justify-center'>
										<Image src='/images/invite/logo.png' alt='1U.TOP' width={120} height={40} className='[100px]' />
									</div>
								</div>

								{/* Title and description */}
								<div className='w-full text-center mb-4'>
									{/* First line: "邀请好友一起玩" + "轻松赚积分" */}
									<div className='flex flex-row items-center justify-center gap-2 mb-2'>
										{/* msg-bg with "邀请好友一起玩" */}
										<div className='relative inline-block flex-shrink-0'>
											<img
												src='/images/invite/msg-bg.png'
												className='min-w-[120px] h-[37px]'
											/>
											<div className='absolute inset-0 mt-[7px]'>
												<div
													className='text-white text-[12px] font-medium tracking-wide'
													style={{
														fontFamily: 'DOUYU, sans-serif',
														fontWeight: 400
													}}
												>
													{t('title')}
												</div>
											</div>
										</div>
										{/* "轻松赚积分" */}
										<h2
											className='text-[#8B5FFF] mb-2 text-[25px] whitespace-nowrap'
											style={{
												fontFamily: 'DOUYU, sans-serif',
												fontWeight: 800,
												color: '#6741FF',
												lineHeight: '100%',
												fontStyle: 'italic'
											}}
										>
											{t('earnPoints')}
										</h2>
									</div>
									{/* Second line: "抽致字货币大奖！" */}
									<h3
										className='text-white mb-4 text-[30px]'
										style={{
											fontFamily: 'DOUYU, sans-serif',
											textShadow: '0 0 30px rgba(255, 255, 255, 0.3), 0 2px 10px rgba(0, 0, 0, 0.5)',
											WebkitTextStroke: '1px rgba(255, 255, 255, 0.1)',
											fontWeight: 800,
											color: '#ffffff',
											lineHeight: '100%',
											fontStyle: 'italic'
										}}
									>
										{t('winPrize')}
									</h3>
									{/* Description with normal background */}
									<div className='inline-block px-4 py-1.5  bg-[#2B1B4A]/60 backdrop-blur-sm rounded-xl'>
										<p className='text-[#CEC2FF] text-[10px] md:text-xs text-center leading-relaxed'>
											{t('description', { num: invitePoints })}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* QR Code Card */}
					<div className='w-full max-w-[340px] -mt-20 z-7 relative'>
						<div className='bg-white rounded-[20px] shadow-2xl shadow-purple-500/20 overflow-visible relative'>
							{/* QR Code Section */}
							<div className='p-4 flex flex-col items-center overflow-visible'>
								{/* Invite Code */}
								<div className='text-center mb-4 md:mb-6'>
									<p className='text-[#2B2A2A] text-xs md:text-sm font-semibold mb-2 md:mb-3'>{t('inviteCode')}</p>
									<div className='flex items-center gap-2 md:gap-3 justify-center'>
										<span className='text-[#6741FF] text-[20px]'>
											{inviteCode || '------'}
										</span>
										<button
											onClick={handleCopyCode}
										>
											<CopyIcon />
										</button>
									</div>
								</div>

								{/* Decorative divider with half circles */}
								<div className='relative w-[calc(100%+2rem)] -mx-4 mb-4 md:mb-6'>
									{/* Dashed line */}
									<div className='border-t-2 border-dashed border-gray-300 mx-2'></div>

									{/* Left half circle - protruding outward */}
									<div className='absolute -left-3 top-0 -translate-y-1/2 w-6 h-6 bg-black rounded-r-full'></div>

									{/* Right half circle - protruding outward */}
									<div className='absolute -right-3 top-0 -translate-y-1/2 w-6 h-6 bg-black rounded-l-full'></div>
								</div>

								{/* QR Codes */}
								<div className='flex gap-8 mb-4 w-full justify-center'>
									{/* Android QR Code */}
									<div className='flex flex-col items-center gap-2 md:gap-3'>
										<div className='w-[100px] h-[100px] md:w-[120px] md:h-[120px] bg-[#F3F0FB] rounded-lg flex items-center justify-center p-2'>
											{androidUrl ? (
												<img
													src={androidUrl}
													alt={t('androidQRCode')}
													className='w-full h-full object-contain'
												/>
											) : (
												<div className='text-gray-400 text-xs text-center'>{t('android')}</div>
											)}
										</div>
										<div className='flex items-center gap-1'>
											<AndroidIcon className='w-4 h-4' />
											<span className='text-[#555555] text-xs md:text-sm font-semibold'>{t('android')}</span>
										</div>
									</div>

									{/* iOS QR Code */}
									<div className='flex flex-col items-center gap-2 md:gap-3'>
										<div className='w-[100px] h-[100px] md:w-[120px] md:h-[120px] bg-[#F3F0FB] rounded-lg flex items-center justify-center p-2'>
											{iosUrl ? (
												<img
													src={iosUrl}
													alt={t('iosQRCode')}
													className='w-full h-full object-contain'
												/>
											) : (
												<div className='text-gray-400 text-xs text-center'>{t('ios')}</div>
											)}
										</div>
										<div className='flex items-center gap-1'>
											<IosIcon className='w-4 h-4' />
											<span className='text-[#555555] text-xs md:text-sm font-semibold'>{t('ios')}</span>
										</div>
									</div>
								</div>

								{/* Register Button */}
								<button
									onClick={handleGoRegister}
									className='w-7/8 mx-[50px] bg-[#6741FF] text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-[#5835E6] transition-colors shadow-lg shadow-purple-500/30 text-sm md:text-base'
								>
									{t('goRegister')}
								</button>
							</div>

							{/* Bottom Section */}
							<div className='bg-[#F3F0FB] px-4 md:px-6 py-3 md:py-4'>
								<p className='text-[#6741FF] text-[10px] md:text-xs font-semibold text-center leading-relaxed'>
									{t('joinNow')}
								</p>
							</div>
						</div>
					</div>

					{/* Bottom benefits */}
					<div className='mt-4 md:mt-6 w-full max-w-[340px] bg-white/95 backdrop-blur rounded-[20px] p-3 md:p-5 shadow-lg z-6'>
						<div>
							<p className='text-[#2B2A2A]/80 text-[10px] md:text-xs font-semibold leading-relaxed'>
								{t('benefit1_part1')}
								<span className='text-[#6741FF]'>{t('benefit1_highlight')}</span>
								{t('benefit1_part2')}
							</p>
							<p className='text-[#2B2A2A]/80 text-[10px] md:text-xs font-semibold leading-relaxed'>{t('benefit2')}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Bottom decoration */}
			<div className='absolute bottom-0 left-0 right-0 pointer-events-none'>
				<Image
					src='/images/invite/invite-bottom.png'
					alt={t('bottomDecoration')}
					width={978}
					height={261}
					className='w-full h-auto'
				/>
			</div>
		</div>
	)
}

