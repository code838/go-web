'use client'

import PlusSVG from '@/svgs/plus.svg'
import MinusSVG from '@/svgs/minus.svg'
import HeartBtn from '@/components/heart-btn'
import ChevronSVG from '@/svgs/chevron.svg'
import USDTSVG from '@/svgs/tokens/usdt.svg'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { cn, toFixed } from '@/lib/utils'
import dayjs from 'dayjs'
import { useProductBuyUsers, useProductHistoryDraws, useProductDetail, useManageCart, useOrderBuy, useProductCalcResult } from '@/requests'
import { useTranslations } from 'next-intl'
import type { BuyUser, ProductHistory } from '@/requests'
import { useAuth } from '@/hooks/useAuth'
import { useAuthDialogStore } from '@/components/auth-dialogs/store'
import { toast } from '@/components/toast'
import { useQueryClient } from '@tanstack/react-query'
import { PageLoading } from '@/components/loading-spinner'
import { useIsMobile } from '@/hooks/useMediaQuery'
import Countdown from '@/components/countdown'
import { IMG_BASE_URL } from '@/consts'

export default function Page() {
	const t = useTranslations('productDetail')
	const searchParams = useSearchParams()
	const params = useParams()
	const productId = Number(params.id)
	const serialNumber = Number(searchParams.get('serialNumber')) || 1
	const isWinnerView = searchParams.get('winner') === 'true'
	const tabs = isWinnerView ? [t('participantRecords'), t('calculationResult')] : [t('participantRecords'), t('recentDraws')]
	const [activeTab, setActiveTab] = useState(tabs[0])
	const router = useRouter()
	const { userId } = useAuth()
	const { openDialog } = useAuthDialogStore()
	const queryClient = useQueryClient()
	const [mounted, setMounted] = useState(false)
	const isMobile = useIsMobile()

	// 确保在客户端挂载后再获取数据
	useEffect(() => {
		setMounted(true)
	}, [])

	// 获取商品详情
	const { data: productDetail, isLoading: productLoading } = useProductDetail({
		productId,
		serialNumber,
		userId: mounted && userId ? Number(userId) : undefined
	})

	// 数量和心愿单状态
	const [quantity, setQuantity] = useState(1)
	const [isInCart, setIsInCart] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)

	// 初始化心愿单状态
	useEffect(() => {
		if (productDetail) {
			setIsInCart(productDetail.cart || false)
		}
	}, [productDetail])

	// Mutations
	const manageCartMutation = useManageCart()
	const orderBuyMutation = useOrderBuy()

	// 分页状态
	const [buyUsersPage, setBuyUsersPage] = useState(1)
	const [historyDrawsPage, setHistoryDrawsPage] = useState(1)
	const pageSize = 10

	// 数据累加状态
	const [allBuyUsers, setAllBuyUsers] = useState<BuyUser[]>([])
	const [allHistoryDraws, setAllHistoryDraws] = useState<ProductHistory[]>([])

	// 获取参与记录
	const { data: buyUsersData, isLoading: buyUsersLoading } = useProductBuyUsers({
		productId,
		pageNo: buyUsersPage,
		pageSize,
		userId: mounted && userId ? Number(userId) : undefined
	})

	// 获取近期开奖
	const { data: historyDrawsData, isLoading: historyDrawsLoading } = useProductHistoryDraws({
		productId,
		pageNo: historyDrawsPage,
		pageSize
	})

	// 获取计算结果（中奖页面）
	const { data: calcResultData, isLoading: calcResultLoading } = useProductCalcResult({
		productId,
		serialNumber
	})

	// 累加数据
	useEffect(() => {
		if (buyUsersData && buyUsersData.length > 0) {
			setAllBuyUsers(prev => {
				const newData = buyUsersPage === 1 ? buyUsersData : [...prev, ...buyUsersData]
				return newData
			})
		}
	}, [buyUsersData, buyUsersPage])

	useEffect(() => {
		if (historyDrawsData && historyDrawsData.length > 0) {
			setAllHistoryDraws(prev => {
				const newData = historyDrawsPage === 1 ? historyDrawsData : [...prev, ...historyDrawsData]
				return newData
			})
		}
	}, [historyDrawsData, historyDrawsPage])

	// 加载更多函数
	const handleLoadMoreBuyUsers = () => {
		setBuyUsersPage(prev => prev + 1)
	}

	const handleLoadMoreHistoryDraws = () => {
		setHistoryDrawsPage(prev => prev + 1)
	}

	// 判断是否还有更多数据
	const hasMoreBuyUsers = buyUsersData && buyUsersData.length === pageSize
	const hasMoreHistoryDraws = historyDrawsData && historyDrawsData.length === pageSize

	// 计算进度和剩余人次
	const progress = productDetail ? toFixed((productDetail.joinPerson / productDetail.totalPerson) * 100) + '%' : '0%'
	const progressValue = productDetail ? (productDetail.joinPerson / productDetail.totalPerson) * 100 : 0
	const isProgressComplete = progressValue >= 100
	const remainingSlots = productDetail ? productDetail.totalPerson - productDetail.joinPerson : 0

	// 数量加减
	const handleDecrement = () => {
		if (quantity > 1) {
			setQuantity(quantity - 1)
		}
	}

	const handleIncrement = () => {
		if (quantity < remainingSlots) {
			setQuantity(quantity + 1)
		} else {
			toast.warning(t('maxParticipantLimit', { count: remainingSlots }))
		}
	}

	const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		// 允许空值以便用户可以清除输入
		if (value === '') {
			setQuantity(0)
			return
		}
		// 只允许数字
		const num = parseInt(value, 10)
		if (!isNaN(num)) {
			// 限制范围
			if (num > remainingSlots) {
				setQuantity(remainingSlots)
				toast.warning(t('maxParticipantLimit', { count: remainingSlots }))
			} else if (num < 1) {
				setQuantity(1)
			} else {
				setQuantity(num)
			}
		}
	}

	const handleQuantityInputBlur = () => {
		// 失焦时，如果值为0或空，重置为1
		if (quantity === 0) {
			setQuantity(1)
		}
	}

	// 切换心愿单
	const handleToggleCart = async () => {
		if (!userId) {
			if (isMobile) {
				router.push('/auth?mode=login')
			} else {
				openDialog('login')
			}
			return
		}

		try {
			const newCartState = !isInCart

			await manageCartMutation.mutateAsync({
				userId: Number(userId),
				productId: productId,
				type: newCartState ? 1 : 2,
				num: quantity
			})

			// 立即更新本地状态以获得即时反馈
			setIsInCart(newCartState)

			// 使商品详情缓存失效，触发重新获取（包含 userId）
			queryClient.invalidateQueries({
				queryKey: ['product-detail', productId, serialNumber, userId ? Number(userId) : undefined]
			})
			// 同时刷新首页数据，确保首页的心愿单状态也同步
			queryClient.invalidateQueries({ queryKey: ['home'] })

			if (newCartState) {
				toast.success(t('addedToWishlist'))
			} else {
				toast.info(t('removedFromWishlist'))
			}
		} catch (error: any) {
			console.error('操作失败:', error)
			toast.error(error?.response?.data?.msg || t('operationFailed'))
		}
	}

	// 立即参与
	const handleJoinNow = async () => {
		if (!userId) {
			if (isMobile) {
				router.push('/auth?mode=login')
			} else {
				openDialog('login')
			}
			return
		}

		if (isSubmitting) return

		try {
			setIsSubmitting(true)

			const res = await orderBuyMutation.mutateAsync({
				userId: Number(userId),
				data: [
					{
						productId: productId,
						num: quantity
					}
				]
			})

			if (res.data.code == 0 || res.data.code == 200) {
				router.push('/comfirm-order?orderId=' + res.data.data?.orderId!)
			} else {
				toast.error(res.data.msg!)
			}
		} catch (error: any) {
			console.error('下单失败:', error)
			toast.error(error?.response?.data?.msg || t('orderFailed'))
		} finally {
			setIsSubmitting(false)
		}
	}

	if (productLoading) {
		return <PageLoading text={t('loading')} />
	}

	if (!productDetail) {
		return (
			<div className='flex justify-center items-center h-screen'>
				<p className='text-secondary'>{t('noData')}</p>
			</div>
		)
	}

	// 移动端版本
	if (isMobile) {
		return (
			<div className='flex flex-col gap-4'>
				{/* 顶部标题栏 */}
				<div className='flex items-center justify-between'>
					{/* 左侧返回按钮 */}
					<button 
						onClick={() => router.back()} 
						className='flex items-center justify-center w-8 h-8 transition-transform hover:scale-110'
					>
						<ChevronSVG className='w-5 h-5 rotate-90 text-white' />
					</button>
					
					{/* 中间标题 */}
					<h1 className='flex-1 text-xl font-semibold text-[#6741FF] text-center'>{t('productDetail')}</h1>
					
					{/* 右侧心愿单按钮 */}
					{!isWinnerView ? (
						<div onClick={handleToggleCart} className='cursor-pointer transition-transform hover:scale-110 w-8 h-8 flex items-center justify-center'>
							<HeartBtn liked={isInCart} />
						</div>
					) : (
						<div className='w-8 h-8' />
					)}
				</div>
				<div className={`relative min-h-screen ${!isWinnerView && !isProgressComplete ? 'pb-[180px]' : 'pb-24'}`}>
					{/* 背景渐变和装饰 */}
					{/* <div className='absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-[rgba(103,65,255,0.25)] to-transparent pointer-events-none' /> */}
					<div className='absolute right-[63px] top-[-54px] w-[157px] h-[150px] rounded-full bg-[#67E8F2] blur-[200px] pointer-events-none' />

					{/* 主内容 */}
					<div className='relative space-y-3 pt-12'>
					{/* 商品信息卡片 */}
					<div className='bg-white/5 relative rounded-lg px-6 pt-16 pb-3'>
						{/* 标题 */}
						<h2 className='text-white text-base font-medium mb-1 text-center'>
							{t('productTitleWithPeriod', { name: productDetail.title, period: productDetail.serialNumber })}
						</h2>
						<p className='text-secondary text-xs text-center mb-2'>{productDetail.subTitle}</p>

						{/* 统计信息网格 */}
							<div className='flex justify-center items-center gap-3 mb-2 px-6'>
								<div className='flex-1 text-center'>
									<div className='text-white text-xs font-medium'>{productDetail.totalPerson}</div>
									<div className='text-[#6E6E70] text-[10px] uppercase'>{t('maxParticipants')}</div>
								</div>
								<div className='flex-1 text-center'>
									<div className='text-[#E5AD54] text-xs font-medium'>{productDetail.price}U</div>
									<div className='text-[#6E6E70] text-[10px] uppercase'>{t('productPrice')}</div>
								</div>
								<div className='flex-1 text-center'>
									<div className='text-[#1AF578] text-xs font-medium'>{productDetail.productValue}</div>
									<div className='text-[#6E6E70] text-[10px] uppercase'>{t('productValue')}</div>
								</div>
							</div>

							{/* 中奖信息 - 只在中奖视图显示 */}
							{isWinnerView && (
								<>
									{/* 揭晓时间戳 */}
									{/* <div className='text-white/80 text-xs font-medium text-center mb-2'>
										{dayjs(productDetail.endTime).format('YYYY/M/D HH:mm:ss')}
									</div> */}
									
									{/* 中奖信息区域 */}
									<div className='flex flex-col items-center justify-center gap-2.5 py-3 w-[220px] mx-auto'>
										<p className='text-white text-sm font-semibold text-center'>
											🎉 {t('congratulations')} <span className='text-[#6741FF]'>{productDetail.owner || ''}</span> {t('wonProduct')}
										</p>
										<p className='text-white text-sm font-semibold text-center'>
											{t('luckyCode')}：<span className='text-[#67E8F2]'>{productDetail.ownerCoding || ''}</span>
										</p>
										<div className='flex flex-col items-center'>
											<p className='text-white/80 text-xs font-medium text-center'>
												{t('announceTime')}：{dayjs(productDetail.endTime).format('YYYY/M/D HH:mm:ss')}
											</p>
										</div>
									</div>
								</>
							)}

							{/* 商品图片 - 绝对定位在顶部 */}
							<div className='absolute top-[-48px] left-1/2 -translate-x-1/2'>
								<div className='w-24 h-24 rounded-full bg-gradient-to-b from-[#8A8A8A] to-[#5A5A5A] p-0.2'>
									<img
										src={`${productDetail?.logo ? (IMG_BASE_URL + productDetail?.logo) : '/images/examples/eth.png'}`}
										className='w-full h-full rounded-full object-cover'
									/>
								</div>
							{/* 中奖者头像 - 右下角 */}
							{isWinnerView && productDetail.owner && (
								<div className='absolute right-0 bottom-0 w-8 h-8 rounded-full border-2 border-white/10'>
									<img
										src={productDetail.ownerImage ? `${IMG_BASE_URL}${productDetail.ownerImage}` : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${productDetail.owner}`}
										alt='winner avatar'
										className='w-full h-full rounded-full object-cover'
									/>
								</div>
							)}
							</div>

							{/* 进度条和倒计时 */}
							{!isWinnerView && (
								<div className='w-full space-y-2 px-4'>
									{/* 进度条 */}
									<div className='w-full pb-2'>
										<div className='flex justify-between items-center mb-1'>
											<span className='text-[#6E6E70] text-sm font-medium'>{t('progress')}</span>
											<span className='text-[#6E6E70] text-xs font-medium'>{progress}</span>
										</div>
										<div className='w-full h-3 rounded-full bg-white/5 overflow-hidden'>
											<div
												className='h-full rounded-full bg-[#6741FF] shadow-[0_0_2px_0_rgba(103,65,255,1)]'
												style={{ width: progress }}
											/>
										</div>
									</div>
									
									{/* 倒计时 - 只在进度100%时显示 */}
									{isProgressComplete && (
										<Countdown endTime={productDetail.endTime} />
									)}
								</div>
							)}
						</div>

						{/* 标签切换 */}
						<div className='flex items-center gap-3 h-6'>
							{tabs.map(tab => (
								<button
									key={tab}
									onClick={() => setActiveTab(tab)}
									className={cn(
										'text-sm font-semibold transition-colors',
										activeTab === tab ? 'text-[#6741FF]' : 'text-[#6E6E70]'
									)}
								>
									{tab}
								</button>
							))}
						</div>

						{/* 参与记录 */}
						{activeTab === tabs[0] && (
							<div className='space-y-2'>
								{/* 表格 */}
								<div className='bg-transparent rounded-xl overflow-hidden space-y-2'>
									{/* 表头 */}
									<div className='flex items-center justify-between px-4 py-2 rounded-t-xl'>
										<div className='flex-1 text-center text-xs font-medium text-[#6E6E70]'>{t('purchaseTime')}</div>
										<div className='flex-1 text-center text-xs font-medium text-[#6E6E70]'>{t('buyer')}</div>
										<div className='flex-1 text-center text-xs font-medium text-[#6E6E70]'>{t('purchaseCount')}</div>
									</div>

									{/* 表格内容 */}
									{buyUsersLoading && buyUsersPage === 1 ? (
										<div className='bg-white/5 rounded-lg py-3 text-center text-xs text-white/80'>{t('loading')}</div>
									) : allBuyUsers.length === 0 ? (
										<div className='bg-white/5 rounded-lg py-3 text-center text-xs text-white/80'>{t('noData')}</div>
									) : (
										allBuyUsers.slice(0, 5).map((user, idx) => (
											<div key={idx} className='bg-white/5 rounded-lg flex items-center justify-between px-3 py-3'>
												<div className='flex-1 text-center text-xs font-medium text-white/80'>
													{(() => {
														const now = dayjs()
														const buyTime = dayjs(user.time)
														const diffSeconds = now.diff(buyTime, 'second')
														const diffMinutes = now.diff(buyTime, 'minute')
														const diffHours = now.diff(buyTime, 'hour')
														const diffDays = now.diff(buyTime, 'day')

														if (diffSeconds < 60) return t('secondsAgo', { count: diffSeconds })
														if (diffMinutes < 60) return t('minutesAgo', { count: diffMinutes })
														if (diffHours < 24) return t('hoursAgo', { count: diffHours })
														if (diffDays === 1) return t('daysHoursAgo', { days: 1, hours: diffHours % 24 })
														return t('daysAgo', { count: diffDays })
													})()}
												</div>
												<div className='flex-1 flex items-center justify-center gap-1'>
													<img
														src={user.image?`${IMG_BASE_URL}${user.image}` : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.nickName}`}
														alt='avatar'
														className='w-4 h-4 rounded-full'
													/>
													<span className='text-xs font-medium text-white/80 truncate max-w-[60px]'>{user.nickName}</span>
												</div>
												<div className='flex-1 text-center text-xs font-medium text-white/80'>x{user.num}</div>
											</div>
										))
									)}
								</div>

								{hasMoreBuyUsers && (
									<button
										onClick={handleLoadMoreBuyUsers}
										disabled={buyUsersLoading}
										className='w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white/80 disabled:opacity-50 hover:bg-white/10 transition-colors'
									>
										{buyUsersLoading ? t('loading') : t('loadMore')}
									</button>
								)}
							</div>
						)}

					{/* 近期开奖 */}
					{activeTab === tabs[1] && !isWinnerView && (
						<div className='space-y-2'>
							{/* 表格容器 */}
							<div className='rounded-xl space-y-2'>
								{/* 表头 */}
								<div className='flex items-stretch rounded-t-xl'>
									<div className='flex-1 flex items-center justify-center py-2 px-4'>
										<span className='text-xs font-medium text-[#6E6E70]'>{t('period')}</span>
									</div>
									<div className='flex-1 flex items-center justify-center py-2 px-4'>
										<span className='text-xs font-medium text-[#6E6E70]'>{t('luckyNumber')}</span>
									</div>
									<div className='flex-1 flex items-center justify-center py-2 px-2'>
										<span className='text-xs font-medium text-[#6E6E70]'>{t('winnerShort')}</span>
									</div>
								</div>

								{/* 表格内容 */}
								{historyDrawsLoading && historyDrawsPage === 1 ? (
									<div className='bg-white/5 rounded-lg py-3 text-center text-xs text-white/80'>{t('loading')}</div>
								) : allHistoryDraws.length === 0 ? (
									<div className='bg-white/5 rounded-lg py-3 text-center text-xs text-white/80'>{t('noData')}</div>
								) : (
									allHistoryDraws.map((draw, idx) => (
										<div key={idx} className='bg-white/5 rounded-lg flex items-stretch'>
											{/* 期数 */}
											<div className='flex-1 flex items-center justify-center py-3 px-2'>
												<span className='text-xs font-medium text-white/80'>
													{t('periodNumber', { number: draw.serialNumber })}
												</span>
											</div>
											
											{/* 幸运号码 */}
											<div className='flex-1 flex items-center justify-center py-3 px-2'>
												<span className='text-xs font-medium text-[#67E8F2]'>
													{draw.ownerCoding}
												</span>
											</div>
											
										{/* 中奖者 */}
										<div className='flex-1 flex items-center justify-center gap-1 py-3 px-2'>
											<img 
												src={draw.ownerImage ? `${IMG_BASE_URL}${draw.ownerImage}` : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${draw.owner}`} 
												alt='avatar' 
												className='w-4 h-4 rounded-full' 
											/>
											<span className='text-xs font-medium text-white/80 truncate'>
												{draw.owner}
											</span>
										</div>
										</div>
									))
								)}
							</div>

							{hasMoreHistoryDraws && (
								<button
									onClick={handleLoadMoreHistoryDraws}
									disabled={historyDrawsLoading}
									className='w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white/80 disabled:opacity-50 hover:bg-white/10 transition-colors'
								>
									{historyDrawsLoading ? t('loading') : t('loadMore')}
								</button>
							)}
						</div>
					)}

						{/* 计算结果（中奖页面） */}
						{activeTab === tabs[1] && isWinnerView && (
							<div className='space-y-3'>
								{/* 计算规则 */}
								<div className='bg-white/5 rounded-xl p-4 space-y-1'>
									<h3 className='text-white/80 text-[10px] font-semibold'>{t('calculationRule')}</h3>
									<p className='text-[#6E6E70] text-[10px] font-semibold leading-relaxed whitespace-pre-line'>
										{t('calculationRuleText')}
									</p>
								</div>

								{/* 购买记录表格 */}
								{calcResultData?.buyList && calcResultData.buyList.length > 0 && (
									<div className='bg-transparent rounded-xl overflow-hidden space-y-2'>
										<div className='flex items-stretch'>
											<div className='flex-1 flex items-center justify-center py-2 px-4'>
												<span className='text-xs font-medium text-[#6E6E70]'>{t('purchaseTime')}</span>
											</div>
											<div className='flex-1 flex items-center justify-center py-2 px-4'>
												<span className='text-xs font-medium text-[#6E6E70]'>{t('purchasedProduct')}</span>
											</div>
											<div className='flex-1 flex items-center justify-center py-2 px-2'>
												<span className='text-xs font-medium text-[#6E6E70]'>{t('buyer')}</span>
											</div>
										</div>

										{calcResultData.buyList.map((item, idx) => (
											<div key={idx} className='bg-white/5 rounded-lg flex items-stretch'>
												{/* 购买时间 */}
												<div className='flex-1 flex flex-col items-center justify-center py-3 px-2'>
													<span className='text-[10px] font-medium text-white/80'>
														{dayjs(item.buyTime).format('YYYY/M/D HH:mm:ss')}
													</span>
													<span className='text-[10px] font-medium text-[#6E6E70]'>
														（{item.timeStamp}）
													</span>
												</div>
												
												{/* 购买商品 */}
												<div className='flex-1 flex items-center justify-center gap-1 py-3 px-2'>
													<img
														src={item.productImage ? `${IMG_BASE_URL}${item.productImage}` : '/images/examples/eth.png'}
														alt='product'
														className='w-4 h-4 rounded-full'
													/>
													<span className='text-[10px] font-medium text-white/80 truncate'>
														{item.productName}
													</span>
												</div>
												
												{/* 购买者 */}
												<div className='flex-1 flex items-center justify-center gap-1 py-3 px-2'>
													<img
														src={item.userImage ? `${IMG_BASE_URL}${item.userImage}` : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${item.nickName}`}
														alt='avatar'
														className='w-4 h-4 rounded-full'
													/>
													<span className='text-xs font-medium text-white/80 truncate'>
														{item.nickName}
													</span>
												</div>
											</div>
										))}
									</div>
								)}

								{/* 计算结果 */}
								{calcResultData?.calcResult && (
									<div className='bg-white/5 rounded-xl p-4 space-y-2 relative overflow-hidden'>
										{/* 装饰性模糊圆 */}
										<div className='absolute right-[60px] bottom-[20px] w-[95px] h-[101px] rounded-full bg-[#67E8F2] blur-[200px] pointer-events-none' />
										
										<div className='relative'>
											<h3 className='text-white/80 text-sm font-semibold'>{t('calculationResultTitle')}</h3>
											<p className='text-white/80 text-sm font-semibold'>{t('sum', { value: calcResultData.calcResult.sumTime })}</p>
											<p className='text-white/80 text-sm font-semibold'>{t('remainder', { sum: calcResultData.calcResult.sumTime, total: calcResultData.calcResult.totalPerson, remainder: calcResultData.calcResult.remainder })}</p>
											<p className='text-white/80 text-sm font-semibold'>{t('calculation', { remainder: calcResultData.calcResult.remainder, result: calcResultData.calcResult.result })}</p>
											<p className='text-white/80 text-sm font-semibold'>{t('finalResult', { code: '' })} <span className='text-[#67E8F2]'>{calcResultData.calcResult.result}</span></p>
										</div>
									</div>
								)}
							</div>
						)}
					</div>

					{/* 底部操作栏 - 只在未满员时显示 */}
					{!isWinnerView && !isProgressComplete && (
						<div className='fixed bottom-[80px] left-0 right-0 bg-white/5 backdrop-blur-md px-3 py-3 flex items-center justify-between gap-2 z-40'>
							{/* 总计金额 - 黄色加粗 */}
							<div className='text-sm font-medium text-white'>
								{t('total')}<span className='text-[#E5AD54] text-lg font-semibold'>{(Number(productDetail.price) || 0) * quantity}U</span>
							</div>

							<div className='flex items-center gap-3'>
								{/* 数量调节器 */}
								<div className='flex items-center justify-center gap-3'>
									{/* 减号按钮 */}
									<button
										onClick={handleDecrement}
										disabled={quantity <= 1}
										className={`w-6 h-6 flex items-center justify-center transition-opacity ${quantity > 1 ? 'cursor-pointer opacity-100' : 'opacity-50 cursor-not-allowed'
											}`}
									>
										<MinusSVG className='w-6 h-6 text-white' />
									</button>

									{/* 数字输入框 */}
									<input
										type="text"
										inputMode="numeric"
										pattern="[0-9]*"
										value={quantity || ''}
										onChange={handleQuantityInputChange}
										onBlur={handleQuantityInputBlur}
										className='w-10 h-6 bg-white/5 border border-white/10 rounded text-center text-sm font-semibold text-white focus:outline-none focus:border-brand transition-colors'
									/>

									{/* 加号按钮 */}
									<button
										onClick={handleIncrement}
										disabled={quantity >= remainingSlots}
										className={`w-6 h-6 flex items-center justify-center transition-opacity ${quantity < remainingSlots ? 'cursor-pointer opacity-100' : 'opacity-50 cursor-not-allowed'
											}`}
									>
										<PlusSVG className='w-6 h-6 text-white' />
									</button>
								</div>

								{/* 立即参与按钮 */}
								<div className='p-[2px] bg-gradient-to-b from-[#A088FF] to-[#6741FF] rounded-lg border-white/10'>
									<button
										onClick={handleJoinNow}
										disabled={isSubmitting}
										className='w-24 bg-[#6741FF] rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90'
									>
										{isSubmitting ? '...' : t('joinNowShort')}
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		)
	}

	// 桌面端版本
	return (
		<div className='flex justify-center'>
			<div className='mx-auto w-full max-w-[1000px] space-y-8 px-4'>
				<button onClick={() => router.back()} className='bg-button text-primary inline-flex items-center rounded-lg py-1 pr-3 pl-2 text-xs hover:opacity-80 transition-opacity'>
					<ChevronSVG className='h-4 w-4 rotate-90' />
					<span>{t('back')}</span>
				</button>

				<div className='mx-auto flex w-[760px] gap-x-10'>
					<figure className='to-brand h-[240px] w-[240px] shrink-0 rounded-3xl bg-gradient-to-b from-[#D2C6FF] outline-4 outline-white/10'>
						<img className='h-full w-full rounded-3xl object-cover' src={`${productDetail?.logo ? (IMG_BASE_URL + productDetail?.logo) : '/images/examples/eth.png'}`} />
					</figure>

					<div className='w-[370px] shrink-0 space-y-2.5'>
						<h3 className='text-primary flex items-center gap-2 text-2xl font-medium'>
							<span>{t('productTitleWithPeriod', { name: productDetail.title, period: productDetail.serialNumber })}</span>
							{!isWinnerView && (
								<div onClick={handleToggleCart} className='cursor-pointer transition-transform hover:scale-110'>
									<HeartBtn liked={isInCart} />
								</div>
							)}
						</h3>
						<p className='text-secondary'>{productDetail.subTitle || t('productDescription')}</p>

						{!isWinnerView && (
							<>
								<ul className='flex gap-3 text-center'>
									<li>
										<div className='text-primary font-medium'>{productDetail.joinPerson}</div>
										<span className='text-secondary text-xs'>{t('participants')}</span>
									</li>
									<li>
										<div className='text-primary font-medium'>{productDetail.totalPerson}</div>
										<span className='text-secondary text-xs'>{t('maxParticipants')}</span>
									</li>
									<li>
										<div className='text-brand-2 font-medium'>{productDetail.productValue}</div>
										<span className='text-secondary text-xs'>{t('productValue')}</span>
									</li>
								</ul>

								<div className='w-full'>
									<div className='text-secondary flex justify-between text-sm'>
										<span>{t('progress')}</span>
										<span>{progress}</span>
									</div>
									<div className='mt-1 w-full'>
										<div className='h-3 w-full overflow-hidden rounded-full bg-white/5'>
											<div className='bg-brand h-full rounded-full' style={{ width: progress }}></div>
										</div>
									</div>
								</div>

								<div className='flex items-center gap-4 select-none'>
									<MinusSVG
										className={`h-6 w-6 ${quantity > 1 ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
										onClick={handleDecrement}
									/>

									<input
										type="text"
										inputMode="numeric"
										pattern="[0-9]*"
										value={quantity || ''}
										onChange={handleQuantityInputChange}
										onBlur={handleQuantityInputBlur}
										className='w-12 text-center text-sm font-semibold bg-white/5 border border-white/10 rounded px-2 py-1 focus:outline-none focus:border-brand transition-colors'
									/>

									<PlusSVG
										className={`h-6 w-6 ${quantity < remainingSlots ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
										onClick={handleIncrement}
									/>
								</div>

								<div className='flex items-center gap-3'>
									<button className='bg-button text-primary flex h-10 min-w-[100px] px-3 items-center justify-center gap-1 rounded-xl'>
										<USDTSVG className='h-4 w-4' />
										<span className='text-gold font-semibold'>{productDetail.price} U</span>
									</button>
									<button
										className='bg-brand text-primary h-10 min-w-[100px] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed'
										onClick={handleJoinNow}
										disabled={isSubmitting}
									>
										{isSubmitting ? '...' : t('joinNow')}
									</button>
								</div>
							</>
						)}

						{isWinnerView && (
							<>
								<div className='flex items-center gap-3'>
									<span className='text-secondary text-xs'>{t('productValue')}</span>
									<span className='text-brand-2 text-xl font-medium'>{productDetail.productValue}</span>
								</div>

								<div className='bg-card flex w-full flex-col gap-2.5 rounded-xl border border-border p-3'>
									<p className='text-secondary text-sm'>
										🎉 {t('congratulations')} <span className='text-[#6741FF]'>{productDetail.owner || ''}</span> {t('wonProduct')}
									</p>
									<p className='text-primary text-sm font-semibold'>{t('luckyCode')}：<span className='text-[#67E8F2]'>{productDetail.ownerCoding || ''}</span></p>
								</div>

								<div className='flex flex-col gap-1'>
									<p className='text-secondary text-xs'>{t('announceTime')}：{dayjs(productDetail.endTime).format('YYYY/MM/DD HH:mm:ss')}</p>
									{/* <p className='text-secondary text-xs'>{t('announceTime')}：{dayjs(productDetail.startTime).format('YYYY/MM/DD HH:mm:ss')}</p> */}
								</div>
							</>
						)}
					</div>
				</div>

				<ul className='flex gap-x-4'>
					{tabs.map(tab => (
						<li key={tab} className={cn('text-secondary cursor-pointer font-semibold', activeTab === tab && 'text-brand')} onClick={() => setActiveTab(tab)}>
							{tab}
						</li>
					))}
				</ul>

				{activeTab === tabs[0] && (
					<div className='space-y-3'>
						<table className='table'>
							<thead>
								<tr>
									<th>{t('purchaseTime')}</th>
									<th>{t('buyer')}</th>
									<th>{t('purchaseCount')}</th>
								</tr>
							</thead>
							<tbody>
								{buyUsersLoading && buyUsersPage === 1 ? (
									<tr>
										<td colSpan={3} className='text-center'>{t('loading')}</td>
									</tr>
								) : allBuyUsers.length === 0 ? (
									<tr>
										<td colSpan={3} className='text-center'>{t('noData')}</td>
									</tr>
								) : (
									allBuyUsers.map((user, idx) => (
										<tr key={idx}>
											<td className='whitespace-nowrap'>{dayjs(user.time).format('YYYY/MM/DD HH:mm:ss')}</td>
											<td>
												<div className='flex items-center justify-center gap-2'>
													<img
														src={user.image ? `${IMG_BASE_URL}${user.image}` : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.nickName}`}
														alt='avatar'
														className='h-6 w-6 rounded-full'
													/>
													<span className='text-secondary text-sm'>{user.nickName}</span>
												</div>
											</td>
											<td>x{user.num}</td>
										</tr>
									))
								)}
							</tbody>
						</table>

						{hasMoreBuyUsers && (
							<button
								onClick={handleLoadMoreBuyUsers}
								disabled={buyUsersLoading}
								className='bg-button text-primary mx-auto flex items-center gap-2 rounded-lg px-4 py-2 text-xs hover:opacity-80 disabled:opacity-50'
							>
								<span>{buyUsersLoading ? t('loading') : t('loadMore')}</span>
							</button>
						)}
					</div>
				)}

				{activeTab === tabs[1] && !isWinnerView && (
					<div className='space-y-3'>
						<div className='bg-card rounded-xl'>
							<table className='w-full'>
								<thead>
									<tr className='bg-card'>
										<th className='py-4 px-3 text-center text-sm font-medium text-secondary'>{t('period')}</th>
										<th className='py-4 px-3 text-center text-sm font-medium text-secondary'>{t('drawTime')}</th>
										<th className='py-4 px-3 text-center text-sm font-medium text-secondary'>{t('product')}</th>
										<th className='py-4 px-3 text-center text-sm font-medium text-secondary'>{t('productValue')}</th>
										<th className='py-4 px-3 text-center text-sm font-medium text-secondary'>{t('luckyCode')}</th>
										<th className='py-4 px-3 text-center text-sm font-medium text-secondary'>{t('winner')}</th>
										<th className='py-4 px-3'></th>
									</tr>
								</thead>
								<tbody>
									{historyDrawsLoading && historyDrawsPage === 1 ? (
										<tr>
											<td colSpan={7} className='py-4 text-center'>{t('loading')}</td>
										</tr>
									) : allHistoryDraws.length === 0 ? (
										<tr>
											<td colSpan={7} className='py-4 text-center'>{t('noData')}</td>
										</tr>
									) : (
										allHistoryDraws.map((draw, idx) => (
											<tr key={idx} className='border-t border-border'>
												<td className='py-4 px-3 text-center text-sm text-subtitle'>{t('periodNumber', { number: draw.serialNumber })}</td>
												<td className='py-4 px-3 text-center text-sm text-subtitle whitespace-nowrap'>{dayjs(draw.endTime).format('YYYY/M/D HH:mm')}</td>
												<td className='py-4 px-3'>
													<div className='flex items-center justify-center gap-2'>
														<img src={draw.logo ? `${IMG_BASE_URL}${draw.logo}` : '/images/examples/eth.png'} alt={draw.coinName} className='h-6 w-6 rounded-full border border-border' />
														<span className='text-sm text-subtitle'>{draw.title||'-'}</span>
													</div>
												</td>
												<td className='py-4 px-3 text-center text-sm text-subtitle'>{draw.productValue}</td>
												<td className='py-4 px-3 text-center text-sm text-subtitle'>{draw.ownerCoding}</td>
												<td className='py-4 px-3'>
													<div className='flex items-center justify-center gap-2'>
														<img src={draw.ownerImage ? `${IMG_BASE_URL}${draw.ownerImage}` : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${draw.owner}`} alt='avatar' className='h-6 w-6 rounded-full' />
														<span className='text-sm text-subtitle'>{draw.owner}</span>
													</div>
												</td>
												<td className='py-4 px-3 text-center'>
													<button onClick={() => router.push(`/product/${draw.productId}?serialNumber=${draw.serialNumber}&winner=true`)} className='text-brand text-sm font-medium hover:opacity-80'>
														{t('view')}
													</button>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>

						{hasMoreHistoryDraws && (
							<button
								onClick={handleLoadMoreHistoryDraws}
								disabled={historyDrawsLoading}
								className='bg-button text-primary mx-auto flex items-center gap-2 rounded-lg px-4 py-2 text-xs hover:opacity-80 disabled:opacity-50'
							>
								<span>{historyDrawsLoading ? t('loading') : t('loadMore')}</span>
							</button>
						)}
					</div>
				)}

				{activeTab === tabs[1] && isWinnerView && (
					<div className='space-y-6'>
						{/* 计算规则 */}
						<div className='bg-card w-[760px] space-y-3 rounded-3xl p-6'>
							<h3 className='text-subtitle text-base font-semibold'>{t('calculationRule')}</h3>
							<p className='text-secondary text-sm font-semibold leading-relaxed whitespace-pre-line'>
								{t('calculationRuleText')}
							</p>
						</div>

						{/* 购买记录表格 */}
						<div className='w-[760px]'>
							<div className='bg-card overflow-hidden rounded-xl'>
								<table className='w-full'>
									<thead>
										<tr className='bg-card'>
											<th className='py-2 px-4 text-center text-sm font-medium text-secondary'>{t('purchaseTime')}</th>
											<th className='py-2 px-4 text-center text-sm font-medium text-secondary'>{t('timeValue')}</th>
											<th className='py-2 px-4 w-[220px] text-center text-sm font-medium text-secondary'>{t('purchasedProduct')}</th>
											<th className='py-2 px-4 min-w-[160px] text-center text-sm font-medium text-secondary'>{t('buyer')}</th>
										</tr>
									</thead>
									<tbody>
										{calcResultLoading ? (
											<tr>
												<td colSpan={4} className='py-4 text-center'>{t('loading')}</td>
											</tr>
										) : !calcResultData?.buyList || calcResultData.buyList.length === 0 ? (
											<tr>
												<td colSpan={4} className='py-4 text-center'>{t('noData')}</td>
											</tr>
										) : (
											calcResultData.buyList.map((item, idx) => (
												<tr key={idx} className='border-t border-border'>
													<td className='py-2 px-4 text-center text-xs font-medium text-subtitle whitespace-nowrap'>
														{dayjs(item.buyTime).format('YYYY/M/D HH:mm:ss')}
													</td>
													<td className='py-2 px-4 text-center text-sm font-medium text-subtitle whitespace-nowrap'>{item.timeStamp}</td>
													<td className='py-2 px-4 w-[220px]'>
														<div className='flex items-center justify-center gap-1'>
															<img
																src={item.productImage ? `${IMG_BASE_URL}${item.productImage}` : '/images/examples/eth.png'}
																alt={item.productName}
																className='h-6 w-6 rounded-full border border-border'
															/>
															<span className='text-xs font-medium text-subtitle'>
																{t('productTitleWithPeriod', { period: item.serialNumber, name: item.productName })}
															</span>
														</div>
													</td>
													<td className='py-2 px-4 min-w-[160px]'>
														<div className='flex items-center justify-center gap-1'>
															<img
																src={item.userImage ? `${IMG_BASE_URL}${item.userImage}` : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${item.nickName}`}
																alt='avatar'
																className='h-6 w-6 rounded-full'
															/>
															<span className='text-sm font-medium text-subtitle'>{item.nickName}</span>
														</div>
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</div>

						{/* 计算结果 */}
						{calcResultData?.calcResult && (
							<div className='bg-card w-[760px] space-y-3 rounded-3xl p-6'>
								<h3 className='text-subtitle text-base font-semibold'>{t('calculationResultTitle')}</h3>
								<div className='space-y-0'>
									<p className='text-subtitle text-sm font-semibold'>{t('sum', { value: calcResultData.calcResult.sumTime })}</p>
									<p className='text-subtitle text-sm font-semibold'>{t('remainder', { sum: calcResultData.calcResult.sumTime, total: calcResultData.calcResult.totalPerson, remainder: calcResultData.calcResult.remainder })}</p>
									<p className='text-subtitle text-sm font-semibold'>{t('calculation', { remainder: calcResultData.calcResult.remainder, result: calcResultData.calcResult.result })}</p>
									<p className='text-subtitle text-sm font-semibold'>{t('finalResult', { code: '' })} <span className='text-[#67E8F2]'>{calcResultData.calcResult.result}</span></p>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
