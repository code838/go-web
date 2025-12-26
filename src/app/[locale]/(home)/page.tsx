'use client'

import OpenSVG from '@/svgs/open.svg'
import HelpSVG from '@/svgs/help.svg'
import TooltipSpan from '@/components/tooltip'
import AnnouncementSVG from '@/svgs/announcement.svg'
import HotSVG from '@/svgs/hot.svg'
import ProductCard from '@/components/product-card'
import { useHome, useAnnouncement } from '@/requests'
import ComingSVG from '@/svgs/coming.svg'
import StarsSVG from '@/svgs/stars.svg'
import { ProductGridSkeleton } from '@/components/skeletons'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import DialogShell from '@/components/dialog-shell'
import SearchSVG from '@/svgs/search.svg'
import ChevronRightSVG from '@/svgs/chevron-right.svg'
import { Link } from '@/i18n/navigation'
import { useIsMobile } from '@/hooks/useMediaQuery'
import NotificationSVG from '@/svgs/notification.svg'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import Carousel from '@/components/carousel'
import WinnerAnnouncement from '@/components/winner-announcement'
import LanguageSwitcher from '@/layout/language-switcher'
import { useSearchParams } from 'next/navigation'
import { useAuthDialogStore } from '@/components/auth-dialogs/store'

export default function Page() {
	const t = useTranslations('home')
	const { userId } = useAuth()
	const [mounted, setMounted] = useState(false)
	const isMobile = useIsMobile()
	const [searchQuery, setSearchQuery] = useState('')
	const router = useRouter()
	const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false)
	const searchParams = useSearchParams()
	const { openDialog } = useAuthDialogStore()

	// 确保在客户端挂载后再获取数据，此时 zustand persist 已经恢复
	useEffect(() => {
		setMounted(true)
	}, [])

	// 检测 URL 参数，如果是 PC 端且需要打开注册弹框
	useEffect(() => {
		if (!mounted || isMobile) return
		const openRegister = searchParams.get('openRegister')
		const inviteCode = searchParams.get('invite')
		if (openRegister === 'true') {
			// 打开注册弹框
			openDialog('register', inviteCode || undefined)
			// 清除 URL 参数
			const newParams = new URLSearchParams(searchParams.toString())
			newParams.delete('openRegister')
			newParams.delete('invite')
			const newSearch = newParams.toString()
			router.replace(newSearch ? `?${newSearch}` : '/', { scroll: false })
		}
	}, [mounted, isMobile, searchParams, openDialog, router])

	const { data } = useHome(mounted && userId ? Number(userId) : undefined)
	const { data: announcement } = useAnnouncement()

	// 移动端版本
	if (isMobile) {
		return (
			<div className='space-y-3'>
				{/* 搜索栏和通知按钮 */}
				<section className='flex items-center justify-between gap-2'>
					{/* <div className='flex-1 relative'>
						<SearchSVG className='w-4 h-4 text-white/60 absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none' />
						<input
							type='text'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder={t('searchPlaceholder')}
							className='w-full bg-white/5 border border-white/10 rounded-[99px] pl-12 pr-6 py-3 text-sm text-white placeholder:text-white/60 focus:outline-none focus:border-white/20 transition-colors'
						/>
					</div> */}
						<Link href='/' className='flex items-center gap-2 text-lg font-semibold'>
							<img className='h-9 w-9' src='/favicon.png' alt='1U.VIP' />
							1U.VIP
						</Link>
						<div className='ml-auto flex items-center gap-2'>
							<LanguageSwitcher />
						</div>
						<button onClick={() => router.push('/notifications')}>
						<NotificationSVG />
					</button>
				
				</section>

				{/* Hero 横幅 */}
				<Carousel type={1} className='w-full h-[160px] rounded-2xl overflow-hidden' />

				{/* 100%公平公正声明 */}
				<section className='bg-white/5 rounded-xl flex items-center justify-center gap-2 py-3 px-4'>
					<OpenSVG className='w-5 h-5' />
					<span className='text-white/80 text-base font-semibold'>{t('fairAndJust')}</span>
					<TooltipSpan value={t('fairAndJustTooltip')}>
						<HelpSVG className='text-white w-5 h-5' />
					</TooltipSpan>
				</section>

				{/* 滚动公告 - 中奖通知 */}
				<WinnerAnnouncement />

				{/* 热门商品 */}
				<section className='pt-6'>
					<div className='flex items-center justify-between mb-8'>
						<h2 className='flex items-center gap-1'>
							<HotSVG className='text-brand w-5 h-5' />
							<span className='text-base font-semibold'>{t('hotProducts')}</span>
						</h2>
						<Link href='/zone?tab=1U专区&zoneId=1' className='flex items-center gap-1'>
							<ChevronRightSVG className='w-5 h-5 text-white' />
						</Link>
					</div>

					{data ? (
						<div className='grid grid-cols-2 gap-x-3 gap-y-8'>
							{data.hot.slice(0, 4).map(item => (
								<ProductCard key={item.productId} product={item} showCountdownLabels={false} />
							))}
						</div>
					) : (
						<ProductGridSkeleton count={4} />
					)}
				</section>

				{/* 即将揭晓 */}
				<section className='pt-6'>
					<div className='flex items-center justify-between mb-8'>
						<h2 className='flex items-center gap-1'>
							<ComingSVG className='text-brand w-5 h-5' />
							<span className='text-base font-semibold'>{t('comingSoon')}</span>
						</h2>
						<Link href='/zone?tab=coming' className='flex items-center gap-1'>
							<ChevronRightSVG className='w-5 h-5 text-white' />
						</Link>
					</div>

					{data ? (
						<div className='grid grid-cols-2 gap-x-3 gap-y-8'>
							{data.will.slice(0, 4).map(item => (
								<ProductCard key={item.productId} product={item} showCountdownLabels={false} />
							))}
						</div>
					) : (
						<ProductGridSkeleton count={4} />
					)}
				</section>

				{/* 最新上架 */}
				<section className='pt-6'>
					<div className='flex items-center justify-between mb-8'>
						<h2 className='flex items-center gap-1'>
							<StarsSVG className='text-brand w-5 h-5' />
							<span className='text-base font-semibold'>{t('newArrivals')}</span>
						</h2>
						<Link href='/zone?tab=1U专区&zoneId=1' className='flex items-center gap-1'>
							<ChevronRightSVG className='w-5 h-5 text-white' />
						</Link>
					</div>

					{data ? (
						<div className='grid grid-cols-2 gap-x-3 gap-y-8'>
							{data.new.slice(0, 4).map(item => (
								<ProductCard key={item.productId} product={item} showCountdownLabels={false} />
							))}
						</div>
					) : (
						<ProductGridSkeleton count={4} />
					)}
				</section>
			</div>
		)
	}

	// 桌面端版本（保留原有的）
	return (
		<div className='space-y-8'>
			<section className='grid h-[300px] grid-cols-3 gap-4'>
				<Carousel type={1} className='col-span-2 h-[300px] rounded-2xl overflow-hidden' />

				<div className='flex flex-col gap-4'>
					<div className='bg-card text-subtitle flex items-center justify-center gap-2 rounded-xl py-4 font-semibold'>
						<OpenSVG className='h-6 w-6' />
						<span>{t('fairAndJust')}</span>
						<TooltipSpan value={t('fairAndJustTooltip')}>
							<HelpSVG className='text-secondary h-5 w-5' />
						</TooltipSpan>
					</div>

					<div className='bg-card w-full flex-1 rounded-xl px-9 py-6'>
						<h3 className='text-primary flex items-center justify-center gap-1'>
							<AnnouncementSVG className='h-5 w-5' />
							<span>{t('announcementTitle')}</span>
						</h3>

						<div className='text-xm text-secondary mt-3 font-medium' style={{ 
							display: '-webkit-box',
							WebkitLineClamp: 5,
							WebkitBoxOrient: 'vertical',
							overflow: 'hidden',
							lineHeight: '1.5em'
						}}>
							{announcement?.content || t('announcementFullText')}
						</div>
						<button 
							className='text-xm text-brand font-medium mt-1'
							onClick={() => setShowAnnouncementDialog(true)}
						>
							{t('viewMore')}
						</button>
					</div>
				</div>
			</section>

			<section>
				<h2 className='flex items-center gap-1'>
					<HotSVG className='text-brand h-6 w-6' />
					<span className='text-[20px] font-semibold'>{t('hotProducts')}</span>
				</h2>

				{data ? (
					<div className='mt-12 grid grid-cols-3 gap-x-4 gap-y-12'>
						{data.hot.map(item => <ProductCard key={item.productId} product={item} />)}
					</div>
				) : (
					<ProductGridSkeleton count={6} />
				)}
			</section>

			<section>
				<h2 className='flex items-center gap-1'>
					<ComingSVG className='text-brand h-6 w-6' />
					<span className='text-[20px] font-semibold'>{t('comingSoon')}</span>
				</h2>

				{data ? (
					<div className='mt-12 grid grid-cols-3 gap-x-4 gap-y-12'>
						{data.will.map(item => <ProductCard key={item.productId} product={item} />)}
					</div>
				) : (
					<ProductGridSkeleton count={6} />
				)}
			</section>

			<section>
				<h2 className='flex items-center gap-1'>
					<StarsSVG className='text-brand h-6 w-6' />
					<span className='text-[20px] font-semibold'>{t('newArrivals')}</span>
				</h2>

				{data ? (
					<div className='mt-12 grid grid-cols-3 gap-x-4 gap-y-12'>
						{data.new.map(item => <ProductCard key={item.productId} product={item} />)}
					</div>
				) : (
					<ProductGridSkeleton count={6} />
				)}
			</section>

			{/* 公告详情弹框 */}
			{showAnnouncementDialog && (
				<DialogShell
					title={t('announcementTitle')}
					close={() => setShowAnnouncementDialog(false)}
				>
					<div 
						className='text-sm text-secondary max-h-[60vh] overflow-y-auto custom-thin-scrollbar'
						style={{ 
							whiteSpace: 'pre-wrap', 
							lineHeight: '1.8'
						}}
					>
						{announcement?.content || t('announcementFullText')}
					</div>
				</DialogShell>
			)}
		</div>
	)
}
