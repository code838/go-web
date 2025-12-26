import { useAuthDialogStore } from '@/components/auth-dialogs/store'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import DotsSVG from '@/svgs/dots.svg'
import USDTSVG from '@/svgs/usdt.svg'
import { thousandsSeparator, formatPrice } from '@/lib/utils'
import NotificationSVG from '@/svgs/notification.svg'
import WalletSVG from '@/svgs/nav/wallet.svg'
import AlertSVG from '@/svgs/alert.svg'
import UserSVG from '@/svgs/dropdown/user.svg'
import LogoutSVG from '@/svgs/dropdown/logout.svg'
import OrderSVG from '@/svgs/dropdown/order.svg'
import CoinSVG from '@/svgs/dropdown/coin.svg'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import BlockiesSvg from 'blockies-react-svg'
import { logout } from '@/requests/auth'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { IMG_BASE_URL } from '@/consts'
import ConfirmDialog from '@/components/confirm-dialog'
import { toast } from '@/components/toast'

export default function Account() {
	const { token } = useAuth()

	if (token) return <LoggedIn />

	return <Login />
}

function LoggedIn() {
	const t = useTranslations('account')
	const tSettings = useTranslations('settings')
	const { userInfo, userId } = useAuth()
	const [open, setOpen] = useState(false)
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
	const [isLoggingOut, setIsLoggingOut] = useState(false)
	const [position, setPosition] = useState({ top: 0, left: 0 })
	const buttonRef = useRef<HTMLDivElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const router = useRouter()

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(event.target as Node)
			) {
				setOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	useEffect(() => {
		if (open && buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect()
			setPosition({
				top: rect.bottom + window.scrollY,
				left: rect.right
			})
		}
	}, [open])

	const handleMenuClick = (action: string) => {
		setOpen(false)
	}

	const handleRecharge = () => {
		// 跳转充值页面
		router.push('/recharge')
	}

	const handleLogout = async () => {
		if (isLoggingOut) return // 防止重复点击
		
		setIsLoggingOut(true)
		try {
			await logout({ userId: Number(userId), osType: 1 })
			useAuth.getState().clearAuth()
			toast.success(tSettings('logoutSuccess'))
			router.push('/')
		} catch (error) {
			toast.error(tSettings('logoutFailed'))
			setIsLoggingOut(false)
		} finally {
			setShowLogoutConfirm(false)
		}
	}

	return (
		<section className='mt-auto text-sm'>
			<div className='gap-2 space-y-2 px-6'>
				<div className='flex items-center gap-3 px-4 py-2 font-medium cursor-pointer' onClick={() => router.push('/notifications')}>
					<div className='relative'>
						<AlertSVG />
						{/* <div className='bg-red absolute top-0 right-0 h-1.5 w-1.5 rounded-full' /> */}
					</div>
					<span>{t('notifications')}</span>
				</div>

				<div className='flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 font-medium'>
					<USDTSVG className='h-6 w-6' />
					<span>{formatPrice(userInfo?.coinsBalance.find(c => c.coinName === 'USDT')?.balance || '0', 2)}</span>

					<button className='text-brand ml-auto shrink-0' onClick={handleRecharge}>{t('recharge')}</button>
				</div>
			</div>

			<div className='flex items-center gap-3 px-8 py-6'>
				{userInfo?.photo ?
					<img src={userInfo?.photo?.includes('http') ? userInfo?.photo : IMG_BASE_URL + userInfo?.photo} className='h-[32px] w-[32px] rounded-full' /> :
					<BlockiesSvg address={String(userId)} className='h-[32px] w-[32px] rounded-full' />}
				<span>{userInfo?.nickName}</span>

				<div ref={buttonRef} className='relative ml-auto'>
					<DotsSVG onClick={() => setOpen(!open)} className='text-subtitle h-6 w-6 cursor-pointer' />
				</div>
			</div>

			{open &&
				createPortal(
					<div
						ref={dropdownRef}
						className='fixed z-50'
						style={{
							top: position.top,
							left: position.left
						}}>
						<div className='dropdown text-subtitle absolute bottom-0 left-0 w-[180px] space-y-1 p-2 text-sm'>
							<Link
								href='/wallet'
								className='hover:text-primary flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/10'
								onClick={() => handleMenuClick('wallet')}>
								<WalletSVG className='h-5 w-5' />
								{t('personalCenter')}
							</Link>
							<Link
								href='/orders'
								className='hover:text-primary flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/10'
								onClick={() => handleMenuClick('orders')}>
								<OrderSVG className='h-5 w-5' />
								{t('myOrders')}
							</Link>
							<Link
								href='/recharge-records'
								className='hover:text-primary flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/10'
								onClick={() => handleMenuClick('recharge-records')}>
								<CoinSVG className='h-5 w-5' />
								{t('rechargeRecords')}
							</Link>
							<div
								className='hover:text-primary flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/10'
								onClick={() => {
									handleMenuClick('logout')
									setShowLogoutConfirm(true)
								}}>
								<LogoutSVG className='h-5 w-5' />
								{t('logout')}
							</div>
						</div>
					</div>,
					document.body
				)}

		{showLogoutConfirm && (
			<ConfirmDialog
				title={tSettings('logoutConfirmTitle')}
				message={tSettings('logoutConfirmMessage')}
				confirmText={tSettings('confirm')}
				cancelText={tSettings('cancel')}
				onConfirm={handleLogout}
				onCancel={() => setShowLogoutConfirm(false)}
				variant='danger'
				isLoading={isLoggingOut}
			/>
		)}
		</section>
	)
}

function Login() {
	const t = useTranslations('account')
	const { openDialog } = useAuthDialogStore()
	return (
		<section className='mt-auto px-8 py-6'>
			<div className='grid grid-cols-2 gap-3'>
				<button onClick={() => openDialog('login')} className='bg-brand rounded-xl px-3 py-2 text-center text-base font-semibold text-white'>
					{t('loginButton')}
				</button>
				<button onClick={() => openDialog('register')} className='bg-button rounded-xl px-3 py-2 text-center text-white'>
					{t('registerButton')}
				</button>
			</div>
		</section>
	)
}
