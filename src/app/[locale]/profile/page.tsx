'use client'

import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { useAuthDialogStore } from '@/components/auth-dialogs/store'
import { useIsMobile } from '@/hooks/useMediaQuery'
import BlockiesSvg from 'blockies-react-svg'
import ChevronSVG from '@/svgs/chevron.svg'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { LoadingSpinner } from '@/components/loading-spinner'
import { useState } from 'react'
import { IMG_BASE_URL } from '@/consts'

// Import mine icons
import InviteSVG from '@/svgs/mine/invite.svg'
import SafeSVG from '@/svgs/mine/safe.svg'
import ServiceSVG from '@/svgs/mine/service.svg'
import AboutUsSVG from '@/svgs/mine/aboutus.svg'
import LanguageSVG from '@/svgs/mine/language.svg'
import ChevronRightSVG from '@/svgs/mine/chevron-right.svg'
import CoinRecIcon from '@/svgs/mine/coin-rec.svg'

export default function ProfilePage() {
	const t = useTranslations('profile')
	const tWallet = useTranslations('wallet')
	const tAccount = useTranslations('accountNav')
	const tAuth = useTranslations('auth')
	const router = useRouter()
	const { userInfo, userId, token, isHydrated } = useAuth()
	const { openDialog } = useAuthDialogStore()
	const isMobile = useIsMobile()
	const [isBalanceExpanded, setIsBalanceExpanded] = useState(false)

	const handleNavigation = (path: string) => {
		router.push(path as any)
	}

	const handleLogin = () => {
		if (isMobile) {
			router.push('/auth?mode=login' as any)
		} else {
			openDialog('login')
		}
	}

	// Get USDT balance from coinsBalance
	const usdtBalance = userInfo?.coinsBalance?.find(coin => coin.coinName === 'USDT')?.balance || '0'
	const points = userInfo?.points || '0'
	const coinsBalance = userInfo?.coinsBalance || []

	// Show loading state while hydrating
	if (!isHydrated) {
		return (
			<div className='min-h-screen pb-24 lg:pb-8'>
				<div className='flex flex-col gap-6'>
					<div className='flex items-center justify-center py-20'>
						<LoadingSpinner size='lg' text={t('loading')} />
					</div>
				</div>
			</div>
		)
	}

	// Render logged-out state
	if (!token) {
		return (
			<div className='min-h-screen  pb-24 lg:pb-8'>
				<div className='flex flex-col gap-6'>
					{/* User Info Card - Not logged in */}
					<div className='flex items-center gap-3 rounded-xl bg-white/5 p-3'>
						{/* Avatar */}
						<div className='h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-white/5'>
							<div className='h-full w-full bg-gradient-to-br from-purple-500 to-blue-500' />
						</div>

						{/* User Info */}
						<div className='flex flex-1 flex-col justify-center'>
							<h2 className='text-base font-medium text-white'>
								--
							</h2>
							<p className='text-sm text-[#6E6E70]'>
								{t('pleaseLoginToView')}
							</p>
						</div>

						{/* Login Button */}
						<button
							onClick={handleLogin}
							className='rounded-lg bg-[#6741FF] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5634E6]'
						>
							{tAuth('login.submit')}
						</button>

						{/* Arrow */}
						<ChevronRightSVG className='h-6 w-6 flex-shrink-0 text-white' />
					</div>

					{/* Operations Grid */}
					<div className='grid grid-cols-4 gap-3 rounded-xl bg-white/5 px-4 py-6'>
						<button
							onClick={handleLogin}
							className='flex flex-col items-center gap-2'
						>
							<div className='flex h-12 w-12 items-center justify-center'>
								<Image src='/images/recharge.png' alt='Recharge' width={48} height={48} />
							</div>
							<span className='text-xs text-white/80'>{tWallet('recharge')}</span>
						</button>

						<button
							onClick={handleLogin}
							className='flex flex-col items-center gap-2'
						>
							<div className='flex h-12 w-12 items-center justify-center'>
								<Image src='/images/withdraw.png' alt='Withdraw' width={48} height={48} />
							</div>
							<span className='text-xs text-white/80'>{tWallet('withdraw')}</span>
						</button>

						<button
							onClick={handleLogin}
							className='flex flex-col items-center gap-2'
						>
							<div className='flex h-12 w-12 items-center justify-center'>
								<Image src='/images/swap.png' alt='Swap' width={48} height={48} />
							</div>
							<span className='text-xs text-white/80'>{tWallet('swap')}</span>
						</button>

						<button
							onClick={handleLogin}
							className='flex flex-col items-center gap-2'
						>
							<div className='flex h-12 w-12 items-center justify-center'>
								<Image src='/images/record.png' alt='Records' width={48} height={48} />
							</div>
							<span className='text-xs text-white/80'>{t('records')}</span>
						</button>
					</div>

					{/* Invite Card */}
					<div
						className='flex cursor-pointer items-center gap-3 rounded-xl bg-white/5 px-4 py-4'
						onClick={() => handleNavigation('/invite')}
					>
						<div className='flex h-6 w-6 items-center justify-center'>
							<InviteSVG className='h-6 w-6' />
						</div>
						<span className='flex-1 text-sm text-white'>{t('inviteRewards')}</span>
						<ChevronRightSVG className='h-5 w-5 text-white/60' />
					</div>

					{/* Settings Menu */}
					<div className='flex flex-col rounded-xl bg-white/5'>
						{/* Account & Security */}
						<MenuItem
							icon={<SafeSVG className='h-5 w-5' />}
							label={t('accountSecurity')}
							onClick={() => handleNavigation('/account-security')}
							showBorder
						/>

						{/* Language */}
						<MenuItem
							icon={<LanguageSVG className='h-5 w-5' />}
							label={t('language')}
							onClick={() => handleNavigation('/language-settings')}
							showBorder
						/>

						{/* Customer Service */}
						<MenuItem
							icon={<ServiceSVG className='h-5 w-5' />}
							label={t('customerService')}
							onClick={() => { }}
							showBorder
						/>

						{/* About Us */}
						<MenuItem
							icon={<AboutUsSVG className='h-5 w-5' />}
							label={t('aboutUs')}
							onClick={() => handleNavigation('/about-us')}
						/>
					</div>
				</div>
			</div>
		)
	}

	// Render logged-in state
	return (
		<div className='min-h-screen  pb-24 lg:pb-8'>
			<div className='flex flex-col gap-6'>
				{/* User Info Card */}
				<div className='flex items-center gap-3 rounded-xl bg-white/5 p-3'>
					{/* Avatar */}
					<div className='h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-white/5'>
						{userInfo?.photo ? (
							<img 
								src={userInfo.photo.includes('http') ? userInfo.photo : IMG_BASE_URL + userInfo.photo} 
								alt='Avatar'
								className='h-full w-full object-cover' 
							/>
						) : userId ? (
							<BlockiesSvg address={String(userId)} className='h-full w-full' />
						) : (
							<div className='h-full w-full bg-gradient-to-br from-purple-500 to-blue-500' />
						)}
					</div>

					{/* User Info */}
					<div className='flex flex-1 flex-col justify-center'>
						<h2 className='text-base font-medium text-white'>
							{userInfo?.nickName || 'Sandy.eth'}
						</h2>
						<p className='text-sm text-[#6E6E70]'>
							ID: {userId || ''}
						</p>
					</div>

					{/* Free Coins Button */}
					<button
						onClick={() => handleNavigation('/help-friend')}
						className='flex items-center gap-1 rounded-lg px-3 py-1.5 hover:opacity-80 flex-shrink-0'
						style={{ background: 'linear-gradient(127.37deg, #E445C3 14.45%, #9074FF 82.97%)' }}
					>
						<CoinRecIcon className='h-4 w-4' />
						<span className='text-xs font-medium text-white whitespace-nowrap'>{tWallet('freeCoins')}</span>
					</button>

					{/* Arrow */}
					<button
						onClick={() => handleNavigation('/settings')}
						className='flex-shrink-0'
					>
						<ChevronRightSVG className='h-6 w-6 text-white' />
					</button>
				</div>

				{/* Balance Card */}
				<div
					className='flex flex-col rounded-xl bg-white/5 overflow-hidden cursor-pointer'
					onClick={() => setIsBalanceExpanded(!isBalanceExpanded)}
				>
					{/* Top section - Balance and Points */}
					<div className='flex flex-row items-center py-3 px-4'>
						<div className='flex flex-row  items-center px-4 flex-1' >
							<p className='text-xs text-white/80'>
							USDT：{parseFloat(usdtBalance).toFixed(0)} 
							</p>
						</div>
						<div className='flex flex-row  items-center px-4 flex-1' >
							<p className='text-xs text-white/80'>
								{tWallet('points')}：{points}
							</p>
						</div>
					</div>
					{/* Expanded Content - Shows all coins */}
					{isBalanceExpanded && (
						<div className='grid grid-cols-2 px-4 pb-2'>
							{coinsBalance.filter(coin => coin.coinName !== 'USDT').map((coin, index) => (
								<div
									key={coin.coinId}
									className='flex flex-row items-center px-4 py-1'
								>
									<p className='text-xs text-white/80'>
										{coin.coinName}：{parseFloat(coin.balance).toFixed(coin.coinName === 'USDT' ? 2 : 4)}
									</p>
								</div>
							))}
						</div>
					)}

					{/* Arrow at bottom center */}
					<div className='flex justify-center items-center py-2'>
						<ChevronSVG
							className={cn(
								'h-5 w-5 text-white/60 transition-transform duration-300',
								isBalanceExpanded ? 'rotate-180' : ''
							)}
						/>
					</div>
				</div>

				{/* Operations Grid */}
				<div className='grid grid-cols-4 gap-3 rounded-xl bg-white/5 px-4 py-4'>
					<button
						onClick={() => handleNavigation('/recharge')}
						className='flex flex-col items-center gap-2'
					>
						<div className='flex h-12 w-12 items-center justify-center'>
							<Image src='/images/recharge.png' alt='Recharge' width={48} height={48} />
						</div>
						<span className='text-xs text-white/80'>{tWallet('recharge')}</span>
					</button>

					<button
						onClick={() => handleNavigation('/withdraw')}
						className='flex flex-col items-center gap-2'
					>
						<div className='flex h-12 w-12 items-center justify-center'>
							<Image src='/images/withdraw.png' alt='Withdraw' width={48} height={48} />
						</div>
						<span className='text-xs text-white/80'>{tWallet('withdraw')}</span>
					</button>

					<button
						onClick={() => handleNavigation('/swap')}
						className='flex flex-col items-center gap-2'
					>
						<div className='flex h-12 w-12 items-center justify-center'>
							<Image src='/images/swap.png' alt='Swap' width={48} height={48} />
						</div>
						<span className='text-xs text-white/80'>{tWallet('swap')}</span>
					</button>

					<button
						onClick={() => handleNavigation(isMobile ? '/records' : '/wallet-details')}
						className='flex flex-col items-center gap-2'
					>
						<div className='flex h-12 w-12 items-center justify-center'>
							<Image src='/images/record.png' alt='Records' width={48} height={48} />
						</div>
						<span className='text-xs text-white/80'>{t('records')}</span>
					</button>
				</div>

				{/* Invite Card */}
				<div
					className='flex cursor-pointer items-center gap-3 rounded-xl bg-white/5 px-4 py-4'
					onClick={() => handleNavigation('/invite')}
				>
					<div className='flex h-6 w-6 items-center justify-center'>
						<InviteSVG className='h-6 w-6' />
					</div>
					<span className='flex-1 text-sm text-white'>{t('inviteRewards')}</span>
					<ChevronRightSVG className='h-5 w-5 text-white/60' />
				</div>

				{/* Settings Menu */}
				<div className='flex flex-col rounded-xl bg-white/5'>
					{/* Account & Security */}
					<MenuItem
						icon={<SafeSVG className='h-5 w-5' />}
						label={t('accountSecurity')}
						onClick={() => handleNavigation('/account-security')}
						showBorder
					/>

					{/* Language */}
					<MenuItem
						icon={<LanguageSVG className='h-5 w-5' />}
						label={t('language')}
						onClick={() => handleNavigation('/language-settings')}
						showBorder
					/>

					{/* Customer Service */}
					<MenuItem
						icon={<ServiceSVG className='h-5 w-5' />}
						label={t('customerService')}
						onClick={() => handleNavigation('/customer-service')}
						showBorder
					/>

					{/* About Us */}
					<MenuItem
						icon={<AboutUsSVG className='h-5 w-5' />}
						label={t('aboutUs')}
						onClick={() => handleNavigation('/about-us')}
					/>
				</div>
			</div>
		</div>
	)
}

interface MenuItemProps {
	icon: React.ReactNode
	label: string
	onClick: () => void
	showBorder?: boolean
}

function MenuItem({ icon, label, onClick, showBorder }: MenuItemProps) {
	return (
		<button
			onClick={onClick}
			className={cn(
				'flex items-center gap-3 px-4 py-4 transition-colors hover:bg-white/5',
				showBorder && 'border-b border-[#0E0E10]'
			)}
		>
			<div className='flex h-5 w-5 items-center justify-center flex-shrink-0'>
				{icon}
			</div>
			<span className='flex-1 text-left text-sm text-white'>{label}</span>
			<ChevronRightSVG className='h-5 w-5 flex-shrink-0 text-white/60' />
		</button>
	)
}

