'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { isNavItemActive, normalizePath, usePrimaryNavItems } from './use-nav-items'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

// Import SVG icons
import HomeSVG from '@/svgs/tabbar/home.svg'
import HomeActiveSVG from '@/svgs/tabbar/home-active.svg'
import ShopSVG from '@/svgs/tabbar/shop.svg'
import ShopActiveSVG from '@/svgs/tabbar/shop-active.svg'
import LatestSVG from '@/svgs/tabbar/latest.svg'
import LatestActiveSVG from '@/svgs/tabbar/latest-active.svg'
import WishlistSVG from '@/svgs/tabbar/wishlist.svg'
import WishlistActiveSVG from '@/svgs/tabbar/wishlist-active.svg'
import UserSVG from '@/svgs/tabbar/user.svg'
import UserActiveSVG from '@/svgs/tabbar/user-active.svg'

type TabKey = 'home' | 'shop' | 'latest' | 'wishlist' | 'user'

interface TabConfig {
	key: TabKey
	href: string
	label: string
}

export default function MobileTabBar() {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const navItems = usePrimaryNavItems()
	const t = useTranslations('header')

	const tabs = useMemo<TabConfig[]>(() => {
		// 找到第一个专区链接作为 "U 购" 的默认链接
		const firstZoneItem = navItems.find(item => item.href.includes('zone') && item.href.includes('zoneId'))
		const shopHref = firstZoneItem?.href || '/zone?tab=coming'

		return [
			{ key: 'home', href: '/', label: t('home') },
			{ key: 'shop', href: shopHref, label: t('shop') },
			{ key: 'latest', href: '/latest', label: t('latestRevealed') },
			{ key: 'wishlist', href: '/wishlist', label: t('wishlist') },
			{ key: 'user', href: '/profile', label: t('profile') }
		]
	}, [navItems, t])

	const getIcon = (key: TabKey, isActive: boolean) => {
		switch (key) {
			case 'home':
				return isActive ? <HomeActiveSVG className='h-6 w-6' /> : <HomeSVG className='h-6 w-6' />
			case 'shop':
				return isActive ? <ShopActiveSVG className='h-6 w-6' /> : <ShopSVG className='h-6 w-6' />
			case 'wishlist':
				return isActive ? <WishlistActiveSVG className='h-6 w-6' /> : <WishlistSVG className='h-6 w-6' />
			case 'user':
				return isActive ? <UserActiveSVG className='h-6 w-6' /> : <UserSVG className='h-6 w-6' />
			default:
				return null
		}
	}

	return (
		<nav className='lg:hidden' aria-label='Mobile primary navigation'>
			<div className='fixed inset-x-0 bottom-0 z-40 overflow-hidden'>
				{/* Curved Background SVG - Responsive */}
				<div className='absolute inset-x-0 bottom-0 overflow-hidden pointer-events-none'>
					<svg 
						width="393" 
						height="102" 
						viewBox="0 0 393 102" 
						fill="none" 
						xmlns="http://www.w3.org/2000/svg"
						className='w-full h-auto pointer-events-none'
						preserveAspectRatio="xMidYMid slice"
					>
						<path 
							d="M196.5 0.5C207.659 0.5 213.776 5.77976 219.585 11.1631C225.389 16.5414 230.938 22.0918 240.865 22.0918H387.49C390.19 22.0918 392.5 24.6578 392.5 27.9844V100.999H0.5C0.499941 73.9198 0.5 40.6445 0.5 27.9844C0.500083 24.6578 2.81041 22.0918 5.50977 22.0918H152.135C162.062 22.0918 167.611 16.5414 173.415 11.1631C179.224 5.77975 185.341 0.500005 196.5 0.5Z" 
							fill="#141414" 
							stroke="#1D1D1D"
						/>
					</svg>
				</div>

				{/* Tab content - Responsive layout */}
				<div className='relative px-4 pb-2 sm:px-6' >
					<div className='flex items-center justify-between max-w-md mx-auto'>
						{/* Left tabs: home and shop */}
						<div className='flex items-center justify-around flex-1 max-w-[140px]' style={{ paddingTop: '50px' }}>
						{tabs
							.filter(tab => tab.key === 'home' || tab.key === 'shop')
							.map(tab => {
								// Special handling for shop: activate on any /zone path
								const isActive = tab.key === 'shop' 
									? normalizePath(pathname) === '/zone' 
									: isNavItemActive(tab.href, pathname, searchParams)

								return (
									<div key={tab.key} className='flex flex-col items-center'>
										<Link
											href={tab.href}
											className={cn(
												'flex flex-col items-center gap-1 p-2 text-[12px] font-normal transition-colors',
												isActive ? 'text-[#6741FF]' : 'text-[#6E6E70]'
											)}>
											{getIcon(tab.key, isActive)}
											<span className='whitespace-nowrap'>{tab.label}</span>
										</Link>
									</div>
								)
							})}
						</div>

						{/* Middle spacer for center button */}
						<div className='flex-shrink-0 w-16' />

						{/* Right tabs: wishlist and user */}
						<div className='flex items-center justify-around flex-1 max-w-[140px]' style={{ paddingTop: '50px' }}>
							{tabs
								.filter(tab => tab.key === 'wishlist' || tab.key === 'user')
								.map(tab => {
									const isActive = isNavItemActive(tab.href, pathname, searchParams)

									return (
										<div key={tab.key} className='flex flex-col items-center'>
											<Link
												href={tab.href}
												className={cn(
													'flex flex-col items-center gap-1 p-2 text-[12px] font-normal transition-colors',
													isActive ? 'text-[#6741FF]' : 'text-[#6E6E70]'
												)}>
												{getIcon(tab.key, isActive)}
												<span className='whitespace-nowrap'>{tab.label}</span>
											</Link>
										</div>
									)
								})}
						</div>
					</div>

					{/* Latest button - positioned within the curved notch */}
					{tabs
						.filter(tab => tab.key === 'latest')
						.map(tab => {
							const isActive = isNavItemActive(tab.href, pathname, searchParams)

							return (
								<div key={tab.key} className='absolute left-1/2 -translate-x-1/2 top-7 flex flex-col items-center z-10'>
									<Link
										href={tab.href}
										className={cn(
											'flex flex-col items-center gap-1 text-[12px] font-normal transition-all duration-200 hover:scale-105',
											isActive ? 'text-[#6741FF]' : 'text-[#6E6E70]'
										)}>
										{/* Center button - SVG already includes background and shadow */}
										<div className='relative mb-1 transition-all duration-200 hover:scale-105'>
											{/* Dynamic Latest icon based on active state */}
											{isActive ? 
												<LatestActiveSVG className='w-[50px] h-[50px]' /> : 
												<LatestSVG className='w-[50px] h-[50px]' />
											}
										</div>
										<span className='whitespace-nowrap font-medium'>{tab.label}</span>
									</Link>
								</div>
							)
						})}
				</div>
			</div>
		</nav>
	)
}
