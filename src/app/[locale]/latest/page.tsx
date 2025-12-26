'use client'

import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getHistoryProducts } from '@/requests'
import type { ProductHistory } from '@/requests'
import { useTranslations } from 'next-intl'
import { LatestPageSkeleton, LatestListItemSkeleton } from '@/components/skeletons'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { IMG_BASE_URL } from '@/consts'

export default function Page() {
	const t = useTranslations('latest')
	const router = useRouter()
	const isMobile = useIsMobile()
	const [pageNo, setPageNo] = useState(1)
	const [historyProducts, setHistoryProducts] = useState<ProductHistory[]>([])
	const [loading, setLoading] = useState(false)
	const [initialLoading, setInitialLoading] = useState(true)
	const [hasMore, setHasMore] = useState(true)
	const pageSize = 10

	// 获取最新揭晓产品列表
	const fetchProducts = async (page: number) => {
		if (loading) return

		setLoading(true)
		try {
			const res = await getHistoryProducts({ pageNo: page, pageSize })
			const newProducts = res.data.data || []

			if (page === 1) {
				setHistoryProducts(newProducts)
			} else {
				setHistoryProducts(prev => [...prev, ...newProducts])
			}

			// 如果返回的数据少于 pageSize,说明没有更多数据了
			if (newProducts.length < pageSize) {
				setHasMore(false)
			}
		} catch (error) {
			console.error('Failed to fetch history products:', error)
		} finally {
			setLoading(false)
			setInitialLoading(false)
		}
	}

	// 初始加载
	useEffect(() => {
		fetchProducts(1)
	}, [])

	// 加载更多
	const handleLoadMore = () => {
		const nextPage = pageNo + 1
		setPageNo(nextPage)
		fetchProducts(nextPage)
	}

	// 初始加载时显示骨架屏
	if (initialLoading) {
		return <LatestPageSkeleton />
	}

	// 获取最新的一条数据用于顶部展示
	const latestProduct = historyProducts?.[0]
	const remainingProducts = historyProducts?.slice(1) || []

	// 移动端版本
	if (isMobile) {
		return (
			<div className='space-y-3'>
			{/* 页面标题 */}
			<section>
				<h1 className='text-center text-[20px] font-semibold text-[#6741FF] mb-8'>{t('title')}</h1>
			</section>

				{/* 最新揭晓商品 - 顶部特殊展示 */}
				{latestProduct && (
					<section className='bg-white/5 rounded-lg p-7 relative cursor-pointer hover:bg-white/10 transition-colors' onClick={() => router.push(`/product/${latestProduct.productId}?serialNumber=${latestProduct.serialNumber}&winner=true`)}>
						{/* 商品标题 */}
						<div className='text-center mb-2'>
							<h2 className='text-white text-xs font-medium'>({t('periodNumber', { number: latestProduct.serialNumber })}) {latestProduct.title}</h2>
						</div>

						{/* 统计信息 */}
						<div className='flex justify-center items-center gap-3 mb-2 px-3'>
							<div className='text-center'>
								<div className='text-white text-xs font-medium'>{latestProduct.joinPerson}</div>
								<div className='text-[#6E6E70] text-[10px] uppercase'>{t('participants')}</div>
							</div>
							<div className='text-center'>
								<div className='text-white text-xs font-medium'>{latestProduct.totalPerson}</div>
								<div className='text-[#6E6E70] text-[10px] uppercase'>{t('maxParticipants')}</div>
							</div>
							<div className='text-center'>
								<div className='text-[#1AF578] text-xs font-medium'>{latestProduct.productValue}</div>
								<div className='text-[#6E6E70] text-[10px] uppercase'>{t('productValue')}</div>
							</div>
						</div>

						{/* 商品图片 - 居中显示 */}
						<div className='absolute top-[-20px] left-1/2 transform -translate-x-1/2'>
							<div className='w-10 h-10 rounded-full bg-gradient-to-b from-[#8A8A8A] to-[#5A5A5A] p-0.2'>
								<img src={latestProduct?.logo ? (IMG_BASE_URL + latestProduct?.logo) : '/images/examples/eth.png'} className='w-full h-full rounded-full object-cover' />
							</div>
						</div>

						{/* 获奖信息 */}
						<div className='text-center space-y-2 pt-3'>
							<div className='text-white text-sm font-semibold'>
								{t('congratulations')} <span className='text-brand'>{latestProduct.owner}</span> {t('wonProduct')}
							</div>
							<div className='text-white text-sm font-semibold'>
								{t('luckyCodeLabel')}<span className='text-brand-3'>{latestProduct.ownerCoding}</span>
							</div>
							<div className='space-y-0'>
								<div className='text-white/80 text-xs'>
									{t('revealTimeLabel')}{dayjs(latestProduct.endTime).format('YYYY/M/D HH:mm:ss')}
								</div>
							</div>
						</div>
					</section>
				)}

				{/* 历史列表 */}
				<section className='space-y-2'>
					{remainingProducts && remainingProducts.length > 0 ? (
						<>
							{remainingProducts.map((product, index) => (
								<div key={`${product.productId}-${product.serialNumber}-${index}`}
									className='bg-white/5 rounded-lg p-3' onClick={() => router.push(`/product/${product.productId}?serialNumber=${product.serialNumber}&winner=true`)}>
									{/* 商品标题和时间 */}
									<div className='flex justify-between items-center mb-2'>
										<h3 className='text-white/80 text-xs font-medium'>
											({t('periodNumber', { number: product.serialNumber })}) {product.title}
										</h3>
										<span className='text-[#6E6E70] text-xs'>
											{dayjs(product.endTime).format('YYYY/M/D HH:mm:ss')}
										</span>
									</div>

									{/* 商品信息行 */}
									<div className='flex justify-between items-center gap-2 mb-2'>
										{/* 商品图片和价格信息 */}
										<div className='flex items-center gap-2 flex-1 min-w-0'>
											<div className='w-10 h-10 rounded-full bg-gradient-to-b from-[#8A8A8A] to-[#5A5A5A] p-0.2 flex-shrink-0'>
												<img src={product?.logo ? (IMG_BASE_URL + product?.logo) : '/images/examples/eth.png'} className='w-full h-full rounded-full object-cover' />
											</div>

											{/* 价格和价值信息 */}
											<div className='flex flex-col items-start min-w-0'>
												<div className='text-white/80 text-xs truncate w-full'>{t('priceLabel')}<span className='text-gold'>{product.price}U</span></div>
												<div className='text-white/80 text-xs truncate w-full'>{t('valueLabel')}<span className='text-brand-2'>{product.productValue}</span></div>
											</div>
										</div>

										{/* 获奖人信息 */}
										<div className='flex flex-col items-center flex-shrink-0' style={{ width: '80px' }}>
											<div className='text-[#6E6E70] text-[10px] mb-0.5'>{t('winnerLabel')}</div>
											<div className='flex items-center gap-1 min-w-0 max-w-full'>
												<div className='w-4 h-4 rounded-full bg-gradient-to-b from-[#8A8A8A] to-[#5A5A5A] overflow-hidden flex-shrink-0'>
													{product.ownerImage ? (
														<img src={IMG_BASE_URL + product.ownerImage} className='w-full h-full object-cover' alt='winner avatar' />
													) : (
														<div className='w-full h-full'></div>
													)}
												</div>
												<span className='text-white text-xs font-medium truncate min-w-0' title={product.owner}>{product.owner}</span>
											</div>
										</div>

										{/* 幸运编码 */}
										<div className='flex flex-col items-center flex-shrink-0' style={{ width: '70px' }}>
											<div className='text-[#6E6E70] text-[10px] mb-0.5'>{t('luckyCode')}</div>
											<div className='text-[#67E8F2] text-xs font-medium truncate' title={product.ownerCoding}>{product.ownerCoding}</div>
										</div>
									</div>
								</div>
							))}
							{loading && (
								<LatestListItemSkeleton />
							)}
						</>
					) : (
						!latestProduct && (
							<div className='text-center py-12 text-white/60 text-sm'>
								{t('noRecords')}
							</div>
						)
					)}
				</section>

				{/* 加载更多按钮 */}
				{hasMore && historyProducts.length > 0 && (
					<div className='text-center pt-4'>
						<button
							onClick={handleLoadMore}
							disabled={loading}
							className='bg-white/5 border border-white/10 rounded-lg px-6 py-2 text-sm text-white/80 disabled:opacity-50 hover:bg-white/10 transition-colors'
						>
							{loading ? t('loading') : t('loadMore')}
						</button>
					</div>
				)}
			</div>
		)
	}

	// 桌面端版本（保持原有样式）
	return (
		<div className='space-y-8'>
			{/* <h1 className='text-[24px]'>{t('title')}</h1> */}
			<p className='text-subtitle' dangerouslySetInnerHTML={{ __html: t('totalRevealed', { count: `<span class="text-brand-3 mx-1 font-semibold">${historyProducts?.length || 0}</span>` }) }} />

			<ul className='space-y-3'>
				{historyProducts && historyProducts.length > 0 ? (
					<>
						{historyProducts.map((product, index) => (
							<li key={`${product.productId}-${product.serialNumber}-${index}`} className='bg-card grid gap-3 items-center rounded-3xl border p-6 font-medium cursor-pointer hover:bg-card/80 transition-colors' style={{ gridTemplateColumns: 'minmax(110px, 1fr) 80px 100px 80px 120px 140px 120px' }} onClick={() => router.push(`/product/${product.productId}?serialNumber=${product.serialNumber}&winner=true`)}>
								{/* 商品信息 */}
								<div className='flex items-center gap-3 min-w-0'>
									<figure className='grident-to-b h-14 w-14 rounded-full from-[#8A8A8A] to-[#5A5A5A] p-0.2 flex-shrink-0'>
										<img src={product?.logo ? (IMG_BASE_URL + product?.logo) : '/images/examples/eth.png'} className='h-full w-full rounded-full object-cover' />
									</figure>
									<div className='min-w-0 flex-1'>
										<h4 className='text-primary text-sm truncate'>({t('periodNumber', { number: product.serialNumber })}) {product.title}</h4>
										<p className='text-secondary text-xs truncate'>{product.subTitle}</p>
									</div>
								</div>

							{/* 价格 */}
							<div className='flex flex-col items-center justify-center'>
								<div className='text-secondary text-xs mb-1'>{t('price')}</div>
								<div className='text-gold text-sm truncate'>{product.price} U</div>
							</div>

							{/* 商品价值 */}
							<div className='flex flex-col items-center justify-center'>
								<div className='text-secondary text-xs mb-1'>{t('productValue')}</div>
								<div className='text-brand-2 text-sm truncate'>{product.productValue}</div>
							</div>

							{/* 参与人次 */}
							<div className='flex flex-col items-center justify-center'>
								<div className='text-secondary text-xs mb-1'>{t('participants')}</div>
								<div className='text-primary text-sm'>{product.totalPerson}</div>
							</div>

							{/* 幸运编码 */}
							<div className='flex flex-col items-center justify-center'>
								<div className='text-secondary text-xs mb-1'>{t('luckyCode')}</div>
								<div className='text-brand-3 text-sm truncate' title={product.ownerCoding}>{product.ownerCoding}</div>
							</div>

								{/* 获奖者 */}
								<div className='flex flex-col items-center justify-center min-w-0 w-full'>
									<div className='text-secondary text-xs mb-1'>{t('winner')}</div>
									<div className='flex items-center gap-2 min-w-0 w-full justify-center'>
										<div className='h-5 w-5 rounded-full bg-gradient-to-b from-[#8A8A8A] to-[#5A5A5A] overflow-hidden flex-shrink-0'>
											{product.ownerImage ? (
												<img src={IMG_BASE_URL + product.ownerImage} className='w-full h-full object-cover' alt='winner avatar' />
											) : (
												<div className='w-full h-full'></div>
											)}
										</div>
										<span className='text-primary text-sm truncate min-w-0 block' style={{ maxWidth: '90px' }} title={product.owner}>{product.owner}</span>
									</div>
								</div>

							{/* 揭晓时间 */}
							<div className='flex flex-col items-center justify-center'>
								<div className='text-secondary text-xs mb-1'>{t('revealTime')}</div>
								<div className='text-primary text-sm whitespace-nowrap'>{dayjs(product.endTime).format('YYYY/MM/DD HH:mm')}</div>
							</div>
							</li>
						))}
						{loading && (
							<LatestListItemSkeleton />
						)}
					</>
				) : (
					<div className='text-center py-12 text-subtitle'>
						{t('noRecords')}
					</div>
				)}
			</ul>

			{hasMore && historyProducts.length > 0 && (
				<div className='text-center'>
					<button
						onClick={handleLoadMore}
						disabled={loading}
						className='text-primary bg-button rounded-lg px-4 py-2 text-xs disabled:opacity-50'
					>
						{loading ? t('loading') : t('loadMore')}
					</button>
				</div>
			)}
		</div>
	)
}
