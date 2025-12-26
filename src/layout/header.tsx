'use client'
import QQSVG from '@/svgs/socials/qq.svg'
import VXSVG from '@/svgs/socials/vx.svg'
import TGSVG from '@/svgs/socials/tg.svg'
import WhatsappSVG from '@/svgs/socials/whatsapp.svg'
import { Link, usePathname } from '@/i18n/navigation'
import HeartSVG from '@/svgs/heart.svg'
import HeartRedSVG from '@/svgs/heart-red.svg'
import LanguageSwitcher from '@/layout/language-switcher'
import Download from './download'
import { useServices } from '@/requests'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { isNavItemActive, usePrimaryNavItems } from './use-nav-items'

export default function Header({ className }: { className?: string }) {
	const t = useTranslations('header')
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const navItems = usePrimaryNavItems()

	const { data: services } = useServices()

	return (
		<header className={`fixed top-0 left-0 right-0 z-50 bg-bg border-b border-border md:static md:left-auto md:right-auto ${className || ''}`}>
		<div className='hidden h-10 items-center gap-2 px-2.5 md:flex overflow-hidden'>
			<div className='flex items-center gap-1 flex-shrink-0'>
				<TGSVG
					className='cursor-pointer'
					onClick={() => {
						window.open(services?.find(service => service.type === 1)?.account, '_blank')
					}}
				/>
				<WhatsappSVG
					className='cursor-pointer'
					onClick={() => {
						window.open(services?.find(service => service.type === 2)?.account, '_blank')
					}}
				/>
				<QQSVG
					className='cursor-pointer'
					onClick={() => {
						window.open(services?.find(service => service.type === 3)?.account, '_blank')
					}}
				/>
				<VXSVG
					className='cursor-pointer'
					onClick={() => {
						window.open(services?.find(service => service.type === 4)?.account, '_blank')
					}}
				/>
			</div>

			<div className='text-secondary flex items-center gap-2 text-xs overflow-x-auto scrollbar-none flex-shrink min-w-0'>
				<Link href='/guide' className='hover:text-sec-hover transition-colors whitespace-nowrap'>
					{t('guide')}
				</Link>
				<Link href='/terms' className='hover:text-sec-hover transition-colors whitespace-nowrap'>
					{t('terms')}
				</Link>
				<Link href='/privacy' className='hover:text-sec-hover transition-colors whitespace-nowrap'>
					{t('privacy')}
				</Link>
			</div>

			<span className='text-secondary ml-auto text-xs whitespace-nowrap flex-shrink-0'>
				{t('usersParticipated', { count: '203993' })}
			</span>
		</div>

			<div className='flex items-center gap-3 px-4 py-3 md:hidden'>
				<Link href='/' className='flex items-center gap-2 text-lg font-semibold'>
					<img className='h-9 w-9' src='/favicon.png' alt='1U.VIP' />
					1U.VIP
				</Link>
				<div className='ml-auto flex items-center gap-2'>
					<LanguageSwitcher />
				</div>
			</div>

		<nav className='bg-panel hidden h-20 items-center px-2 md:px-3 lg:px-6 font-semibold md:flex'>
			<div className='flex items-center flex-1 min-w-0 overflow-hidden'>
				<ul className='text-secondary nav-scroll flex items-center whitespace-nowrap overflow-x-auto flex-1 min-w-0 pr-[clamp(2.5rem,5vw,6rem)]'>
					{navItems.map(item => {
						const isSelected = isNavItemActive(item.href, pathname, searchParams)
						const isWishlist = item.href === '/wishlist'
						const hasIcon = isWishlist || item.icon

						return (
							<li key={item.href} className='flex-shrink-0'>
								<Link
									href={item.href}
									className={`hover:text-sec-hover flex items-center ${hasIcon ? 'gap-[clamp(0.25rem,0.35vw,0.5rem)]' : ''} px-[clamp(0.2rem,0.7vw,0.6rem)] py-4 transition-colors ${isSelected ? 'text-white' : ''
										}`}
								>
									{isWishlist ? (
										isSelected ? <HeartRedSVG className='h-3.5 w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 flex-shrink-0' /> : <HeartSVG className='h-3.5 w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 flex-shrink-0' />
									) : item.icon ? (
										<span className='flex-shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5 md:[&>svg]:h-4 md:[&>svg]:w-4 lg:[&>svg]:h-5 lg:[&>svg]:w-5'>
											{item.icon}
										</span>
									) : null}
									<span className='text-xs md:text-xs lg:text-base xl:text-base whitespace-nowrap leading-tight'>{item.label}</span>
								</Link>
							</li>
						)
					})}
				</ul>
			</div>

			<div className='hidden gap-1 md:gap-1.5 lg:gap-2 md:flex flex-shrink-0 flex items-center ml-1 md:ml-2'>
				<LanguageSwitcher />
				<Download />
			</div>
		</nav>
		</header>
	)
}
