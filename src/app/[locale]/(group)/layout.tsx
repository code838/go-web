'use client'

import { Link, usePathname, useRouter } from '@/i18n/navigation'
import WalletSVG from '@/svgs/nav/wallet.svg'
import RechargeSVG from '@/svgs/nav/recharge.svg'
import WithdrawSVG from '@/svgs/nav/withdraw.svg'
import SwapSVG from '@/svgs/nav/swap.svg'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import ConfirmDialog from '@/components/confirm-dialog'

export default function Layout({ children }: { children: React.ReactNode }) {
	const t = useTranslations('accountNav')
	const tSettings = useTranslations('settings')
	const pathname = usePathname()
	const isActive = (href: string) => pathname === href
	const router = useRouter()
	const { token } = useAuth()
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

	const NAV_ITEMS_1 = useMemo(() => [
		{ label: t('wallet'), href: '/wallet', icon: WalletSVG },
		{ label: t('recharge'), href: '/recharge', icon: RechargeSVG },
		{ label: t('withdraw'), href: '/withdraw', icon: WithdrawSVG },
		{ label: t('swap'), href: '/swap', icon: SwapSVG }
	], [t])

	const NAV_ITEMS_2 = useMemo(() => [
		{ label: t('orders'), href: '/orders' },
		{ label: t('luckyRecords'), href: '/lucky-records' },
		{ label: t('inviteRecords'), href: '/invite-records' },
		{ label: t('commissionDetails'), href: '/commission-details' },
		{ label: t('swapRecords'), href: '/swap-records' },
		{ label: t('withdrawRecords'), href: '/withdraw-records' },
		{ label: t('rechargeRecords'), href: '/recharge-records' },
		{ label: t('walletDetails'), href: '/wallet-details' }
	], [t])

	useEffect(() => {
		const timer = setTimeout(() => {
			if (!useAuth.getState().token) {
				router.push('/')
			}
		}, 500)

		return () => clearTimeout(timer)
	}, [token])

	const handleLogout = () => {
		useAuth.getState().clearAuth()
		setShowLogoutConfirm(false)
		router.push('/')
	}

	return (
		<div className='flex gap-6'>
			{/* Hide navigation on mobile (lg:block makes it visible on large screens) */}
			<nav className='text-secondary hidden w-[160px] space-y-2 text-sm lg:block'>
				<ul className='space-y-1'>
					{NAV_ITEMS_1.map(item => (
						<li key={item.href}>
							<Link
								href={item.href}
								className={cn(
									'flex items-center gap-1 rounded-lg px-4 py-2',
									isActive(item.href) ? 'text-primary bg-card' : 'hover:bg-card hover:text-sec-hover'
								)}>
								{item.icon && <item.icon className='h-5 w-5' />}
								{item.label}
							</Link>
						</li>
					))}
				</ul>

				<div className='w-full border-t' />

				<ul className='space-y-1'>
					{NAV_ITEMS_2.map(item => (
						<li key={item.href}>
							<Link
								href={item.href}
								className={cn('block rounded-lg px-4 py-2', isActive(item.href) ? 'text-primary bg-card' : 'hover:bg-card hover:text-sec-hover')}>
								{item.label}
							</Link>
						</li>
					))}
				</ul>

				<div className='w-full border-t' />

			<ul className='space-y-1'>
				<li>
					<Link
						href={'/settings'}
						className={cn('block rounded-lg px-4 py-2', isActive('/settings') ? 'text-primary bg-card' : 'hover:bg-card hover:text-sec-hover')}>
						{t('settings')}
					</Link>
				</li>
				<li>
					<div
						onClick={() => setShowLogoutConfirm(true)}
						className={cn('text-red block cursor-pointer rounded-lg px-4 py-2', 'hover:bg-card')}>
						{t('logout')}
					</div>
				</li>
			</ul>
			</nav>
			{/* Full width on mobile, restricted on desktop */}
			<div className='flex-1 lg:flex-auto'>
				{children}
			</div>

			{showLogoutConfirm && (
				<ConfirmDialog
					title={tSettings('logoutConfirmTitle')}
					message={tSettings('logoutConfirmMessage')}
					confirmText={tSettings('confirm')}
					cancelText={tSettings('cancel')}
					onConfirm={handleLogout}
					onCancel={() => setShowLogoutConfirm(false)}
					variant='danger'
				/>
			)}
		</div>
	)
}
