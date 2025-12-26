'use client'

import { useMemo, use, useState, useEffect, useRef } from 'react'
import SearchSVG from '@/svgs/search.svg'
import ChevronSVG from '@/svgs/chevron.svg'
import ProductCard from '@/components/product-card'
import { useWillProducts, useZoneProducts, useZone, useHomeBuys, useCoins, getWillProducts, getZoneProducts } from '@/requests'
import type { Product } from '@/types'
import { useTranslations } from 'next-intl'
import { ZonePageSkeleton } from '@/components/skeletons'
import { useAuth } from '@/hooks/useAuth'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useRouter } from '@/i18n/navigation'
import { motion, AnimatePresence } from 'motion/react'

type ZonePageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

// 移除了硬编码的 VALID_TABS，现在使用动态的专区数据

export default function ZonePage(props: ZonePageProps) {
	const t = useTranslations('zone')
	const router = useRouter()
	const searchParams = use(props.searchParams)
	const { userId } = useAuth()
	const { data: zones } = useZone()
	const { data: coins } = useCoins()
	const tab = searchParams?.tab as string
	const zoneId = useMemo(() => {
		const id = searchParams?.zoneId
		return id ? Number(id) : undefined
	}, [searchParams?.zoneId])

	// 排序选项（使用翻译）
	const SORT_OPTIONS = useMemo(() => [
		// { value: 'name-asc' as const, label: t('sortNameAsc') },
		// { value: 'name-desc' as const, label: t('sortNameDesc') },
		{ value: '1' as const, label: t('sortLatest') },
		{ value: '2' as const, label: t('sortRemaining') },
		// { value: 'price-desc' as const, label: t('sortPriceDesc') },
		// { value: 'price-asc' as const, label: t('sortPriceAsc') }
	], [t])

	type SortOption = (typeof SORT_OPTIONS)[number]['value']

	const [sortBy, setSortBy] = useState<SortOption>('1')
	const [isDropdownOpen, setIsDropdownOpen] = useState(false) 
	const dropdownRef = useRef<HTMLDivElement>(null)

	const isMobile = useIsMobile()
	const [selectedCoinId, setSelectedCoinId] = useState(0)
	const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false)
	const tokenDropdownRef = useRef<HTMLDivElement>(null)

	// 构建币种选项列表，前面添加"全部"选项
	const tokenOptions = useMemo(() => {
		const coinOptions = coins?.map(coin => ({ coinId: coin.coinId, coinName: coin.coinName })) || []
		return [{ coinId: 0, coinName: t('allTokens') }, ...coinOptions]
	}, [coins, t])

	const activeCoinId = useMemo(() => {
		return selectedCoinId === 0 ? undefined : selectedCoinId
	}, [selectedCoinId])
	
	// 将sortBy转换为orderBy数字
	const orderBy = useMemo(() => {
		return sortBy === '1' ? 1 : sortBy === '2' ? 2 : undefined
	}, [sortBy])

	// 根据 tab 类型调用不同的接口
	const isComing = tab === 'coming'

	// 分页状态管理
	const [currentPage, setCurrentPage] = useState(1)
	const [allProducts, setAllProducts] = useState<Product[]>([])
	const [totalCount, setTotalCount] = useState(0)
	const [hasMore, setHasMore] = useState(true)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const pageSize = 50

	// 获取即将揭晓产品列表
	const { data: willProducts, isLoading: isLoadingWill, refetch: refetchWillProducts } = useWillProducts(
		{ 
			pageNo: currentPage, 
			pageSize,
			coinId: activeCoinId,
			orderBy
		},
		{ enabled: isComing && currentPage === 1 }
	)

	// 获取专区商品列表
	const { data: zoneProducts, isLoading: isLoadingZone, refetch: refetchZoneProducts } = useZoneProducts(
		{ 
			pageNo: currentPage, 
			pageSize, 
			zoneId: zoneId!, 
			userId: userId ? Number(userId) : undefined,
			coinId: activeCoinId,
			orderBy
		},
		{ enabled: !isComing && !!zoneId && currentPage === 1 }
	)

	// 根据类型选择对应的产品数据
	const currentPageData = isComing ? willProducts : zoneProducts
	const isLoading = isComing ? isLoadingWill : isLoadingZone

	// 当筛选条件变化时，重置分页和产品列表
	useEffect(() => {
		setCurrentPage(1)
		setAllProducts([])
		setTotalCount(0)
		setHasMore(true)
	}, [isComing, zoneId, orderBy, activeCoinId])

	// 处理第一页数据加载
	useEffect(() => {
		if (currentPage === 1 && currentPageData) {
			const productsList = currentPageData.list || []
			const count = currentPageData.totalCount || 0
			setAllProducts(productsList)
			setTotalCount(count)
			setHasMore(productsList.length < count)
		}
	}, [currentPageData, currentPage])

	// 加载更多数据
	const loadMore = async () => {
		if (isLoadingMore || !hasMore) return
		
		setIsLoadingMore(true)
		const nextPage = currentPage + 1
		
		try {
			if (isComing) {
				const res = await getWillProducts({
					pageNo: nextPage,
					pageSize,
					coinId: activeCoinId,
					orderBy
				})
				const newProducts = res.data.data || []
				const count = res.data.totalCount || 0
				
				if (newProducts.length > 0) {
					setAllProducts(prev => {
						const updated = [...prev, ...newProducts]
						setHasMore(updated.length < count)
						return updated
					})
					setTotalCount(count)
					setCurrentPage(nextPage)
				} else {
					setHasMore(false)
				}
			} else if (zoneId) {
				const res = await getZoneProducts({
					pageNo: nextPage,
					pageSize,
					zoneId: zoneId!,
					userId: userId ? Number(userId) : undefined,
					coinId: activeCoinId,
					orderBy
				})
				const newProducts = res.data.data || []
				const count = res.data.totalCount || 0
				
				if (newProducts.length > 0) {
					setAllProducts(prev => {
						const updated = [...prev, ...newProducts]
						setHasMore(updated.length < count)
						return updated
					})
					setTotalCount(count)
					setCurrentPage(nextPage)
				} else {
					setHasMore(false)
				}
			}
		} catch (error) {
			console.error('加载更多失败:', error)
			setHasMore(false)
		} finally {
			setIsLoadingMore(false)
		}
	}

	// 最终使用的产品列表
	const products = allProducts

	// 获取购买滚动数据
	const { data: homeBuysData } = useHomeBuys()
	const [currentBuyIndex, setCurrentBuyIndex] = useState(0)
	const buyers = homeBuysData?.buys || []

	// 生成标签数据（包括动态专区和即将揭晓）
	const tabsData = useMemo(() => {
		const tabs: Array<{ key: string; label: string; href: string; zoneId?: number }> = []
		
		// 添加动态专区
		if (zones && Array.isArray(zones)) {
			zones.forEach(zone => {
				tabs.push({
					key: zone.zoneTitle,
					label: zone.zoneTitle,
					href: `/zone?tab=${zone.zoneTitle}&zoneId=${zone.zoneId}`,
					zoneId: zone.zoneId
				})
			})
		}
		
		// 添加即将揭晓
		tabs.push({
			key: 'coming',
			label: t('comingTitle'),
			href: '/zone?tab=coming'
		})
		
		return tabs
	}, [zones, t])


	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false)
			}
			if (tokenDropdownRef.current && !tokenDropdownRef.current.contains(event.target as Node)) {
				setIsTokenDropdownOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	// 自动滚动购买信息
	useEffect(() => {
		if (buyers.length <= 1) return

		const interval = setInterval(() => {
			setCurrentBuyIndex(prev => (prev + 1) % buyers.length)
		}, 5000) // 每5秒切换一次，减少频率避免晃眼

		return () => clearInterval(interval)
	}, [buyers.length])

	// 如果正在加载，显示骨架屏
	if (isLoading) {
		return <ZonePageSkeleton />
	}

	// 移动端版本
	if (isMobile) {
		return (
			<div className='space-y-3'>
				{/* 标签切换栏 */}
				<section className='flex items-center gap-2 overflow-x-auto scrollbar-hide'>
					{tabsData.map((tabItem) => {
						const isActive = tab === tabItem.key
						
						return (
							<button
								key={tabItem.key}
								onClick={() => router.push(tabItem.href)}
								className={`whitespace-nowrap px-0 py-0 text-base text-lg font-semibold transition-colors ${
									isActive ? 'text-[#6741FF]' : 'text-[#6E6E70]'
								}`}>
								{tabItem.label}
							</button>
						)
					})}
				</section>

				{/* 筛选器部分 */}
				<section className='flex items-center gap-3'>
					{/* Token 选择器 */}
					<div className='flex-1 relative' ref={tokenDropdownRef}>
						<button
							onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
							className='w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center justify-between'>
							<span className='text-sm font-medium text-white/80'>
								{tokenOptions.find(option => option.coinId === selectedCoinId)?.coinName ?? t('allTokens')}
							</span>
							<ChevronSVG className={`h-4 w-4 text-white transition-transform ${isTokenDropdownOpen ? 'rotate-180' : ''}`} />
						</button>
						
						{isTokenDropdownOpen && (
							<div className='absolute top-full left-0 right-0 mt-1 bg-[#1D1D1D] border border-white/10 rounded-lg shadow-lg z-12 overflow-hidden'>
								{tokenOptions.map((option) => (
									<button
										key={option.coinId}
										onClick={() => {
											setSelectedCoinId(option.coinId)
											setIsTokenDropdownOpen(false)
										}}
										className={`w-full px-4 py-2 text-left text-sm font-medium hover:bg-white/5 transition-colors ${
											selectedCoinId === option.coinId ? 'text-[#6741FF] bg-white/10' : 'text-white'
										}`}>
										{option.coinName ?? t('allTokens')}
									</button>
								))}
							</div>
						)}
					</div>

					{/* 排序选择器 */}
					<div className='flex-1 relative' ref={dropdownRef}>
						<button
							onClick={() => setIsDropdownOpen(!isDropdownOpen)}
							className='w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center justify-between'>
							<span className='text-sm font-medium text-white/80 truncate'>
								{t('sortBy')}: {SORT_OPTIONS.find(option => option.value === sortBy)?.label}
							</span>
							<ChevronSVG className={`h-4 w-4 text-white transition-transform flex-shrink-0 ml-1 ${isDropdownOpen ? 'rotate-180' : ''}`} />
						</button>

						{isDropdownOpen && (
							<div className='absolute top-full left-0 right-0 mt-1 bg-[#1D1D1D] border border-white/10 rounded-lg shadow-lg z-12 overflow-hidden'>
								{SORT_OPTIONS.map(option => (
									<button
										key={option.value}
										onClick={() => {
											setSortBy(option.value)
											setIsDropdownOpen(false)
										}}
										className={`w-full px-4 py-2 text-left text-sm font-medium hover:bg-white/5 transition-colors ${
											sortBy === option.value ? 'text-[#6741FF] bg-white/10' : 'text-white'
										}`}>
										{option.label}
									</button>
								))}
							</div>
						)}
					</div>
				</section>

				{/* 滚动公告栏 */}
				<section className='bg-white/5 rounded-xl flex items-center justify-center gap-2 py-3 px-4 overflow-hidden'>
					<div className='flex-1 overflow-hidden'>
						{buyers.length === 0 ? (
							<div className='text-[#6E6E70] text-[10px] text-center whitespace-nowrap'>
								{t('buyAnnouncementPrefix')} <span className='text-brand'>@012.eth</span> {t('buyAnnouncementMiddle')} <span className='text-gold'>SOL{t('buyAnnouncementProduct')}</span> {t('buyAnnouncementSuffix')}
							</div>
						) : (
							<AnimatePresence mode="wait">
								<motion.div
									key={currentBuyIndex}
									initial={{ y: 20, opacity: 0 }}
									animate={{ y: 0, opacity: 1 }}
									exit={{ y: -20, opacity: 0 }}
									transition={{ duration: 0.3 }}
									className='text-[#6E6E70] text-[10px] text-center whitespace-nowrap overflow-hidden text-ellipsis'
								>
									{t('buyAnnouncementPrefix')} <span className='text-brand'>{buyers[currentBuyIndex].nickName}</span> {t('buyAnnouncementMiddle')} <span className='text-gold'>{buyers[currentBuyIndex].productName}</span> {t('buyAnnouncementSuffix')}
								</motion.div>
							</AnimatePresence>
						)}
					</div>
				</section>

				{/* 商品网格 */}
				<section className='pt-6'>
					<div className='grid grid-cols-2 gap-x-3 gap-y-8'>
						{products && products.length > 0 ? (
							products.map((product) => (
								<ProductCard key={product.productId} product={product} showCircleDecoration={isComing} />
							))
						) : (
							<div className='col-span-2 text-center py-12 text-white/60 text-sm'>
								{t('noProducts')}
							</div>
						)}
					</div>
					{/* 加载更多按钮 */}
					{products && products.length > 0 && hasMore && (
						<div className='flex justify-center mt-8'>
							<button
								onClick={loadMore}
								disabled={isLoadingMore}
								className='px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
								{isLoadingMore ? t('loading') : t('loadMore')}
							</button>
						</div>
					)}
				</section>
			</div>
		)
	}

	// 桌面端版本
	return (
		<div className='space-y-8'>
			{/* <h1 className='text-[24px]'>{tab === 'coming' ? t('comingTitle') : t('title', { zone: tab })}</h1> */}
			<div className='flex items-center gap-3'>
			<p className='text-subtitle' dangerouslySetInnerHTML={{ __html: t('totalProducts', { count: `<span class="text-brand-3 mx-1 font-semibold">${totalCount || 0}</span>` }) }} />

				{/* Token 筛选器 */}
				<div className='relative  ml-auto' ref={tokenDropdownRef}>
					<button
						onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
						className='bg-card w-[200px] rounded-lg border border-white/10 px-4 py-2 flex items-center justify-between text-sm outline-none hover:border-white/20'>
						<span className='text-white/80'>
							{tokenOptions.find(option => option.coinId === selectedCoinId)?.coinName ?? t('allTokens')}
						</span>
						<ChevronSVG className={`h-4 w-4 text-white transition-transform ${isTokenDropdownOpen ? 'rotate-180' : ''}`} />
					</button>
					
					{isTokenDropdownOpen && (
						<div className='bg-card absolute top-full left-0 right-0 mt-1 border border-white/10 rounded-lg shadow-lg z-12 overflow-hidden backdrop-blur'>
							{tokenOptions.map((option) => (
								<button
									key={option.coinId}
									onClick={() => {
										setSelectedCoinId(option.coinId)
										setIsTokenDropdownOpen(false)
									}}
									className={`w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors ${
										selectedCoinId === option.coinId ? 'text-brand bg-white/10' : 'text-white'
									}`}>
									{option.coinName ?? t('allTokens')}
								</button>
							))}
						</div>
					)}
				</div>

				<div className='relative text-sm' ref={dropdownRef}>
					<button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className='flex items-center gap-2 rounded-lg px-4 py-2 text-sm hover:border-white/20'>
						<span className='text-secondary'>{t('sortBy')}:</span>
						<span>{SORT_OPTIONS.find(option => option.value === sortBy)?.label}</span>
						<ChevronSVG className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
					</button>

					{isDropdownOpen && (
						<div className='bg-card absolute top-full right-0 z-10 mt-1 w-48 rounded-lg border border-white/10 shadow-lg backdrop-blur'>
							{SORT_OPTIONS.map(option => (
								<button
									key={option.value}
									onClick={() => {
										setSortBy(option.value)
										setIsDropdownOpen(false)
									}}
									className={`w-full px-4 py-2 text-left text-sm hover:bg-white/5 ${sortBy === option.value ? 'text-brand bg-white/10' : 'text-white'}`}>
									{option.label}
								</button>
							))}
						</div>
					)}
				</div>
			</div>

		<div className='grid grid-cols-3 gap-4 gap-y-12 mt-12'>
			{products && products.length > 0 ? (
				products.map((product) => (
					<ProductCard key={product.productId} product={product} showCircleDecoration={isComing} />
				))
			) : (
				<div className='col-span-3 text-center py-12 text-subtitle'>
					{t('noProducts')}
				</div>
			)}
		</div>
		
		{/* 加载更多按钮 */}
		{products && products.length > 0 && hasMore && (
			<div className='flex justify-center mt-8'>
				<button
					onClick={loadMore}
					disabled={isLoadingMore}
					className='px-6 py-2 bg-card border border-white/10 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
					{isLoadingMore ? t('loading') : t('loadMore')}
				</button>
			</div>
		)}
		</div>
	)
}
