'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import HelpSVG from '@/svgs/help.svg'
import BrandBtn from '@/components/brand-btn'
import { useRouter } from '@/i18n/navigation'
import { useOrderDetail, usePayOrder, useCancelOrder } from '@/requests'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/components/toast'
import { useTranslations } from 'next-intl'
import { useIsMobile } from '@/hooks/useMediaQuery'
import MinusSVG from '@/svgs/minus.svg'
import PlusSVG from '@/svgs/plus.svg'
import { IMG_BASE_URL } from '@/consts'
import { LoadingSpinner } from '@/components/loading-spinner'
import TooltipSpan from '@/components/tooltip'
import ChevronBackIcon from '@/svgs/chevron-back.svg'

export default function Page() {
	const t = useTranslations('confirmOrder')
	const router = useRouter()
	const searchParams = useSearchParams()
	const orderId = searchParams.get('orderId')
	const { userId } = useAuth()
	const isMobile = useIsMobile()

	const [isPayingSubmitting, setIsPayingSubmitting] = useState(false)
	const [isCancelingSubmitting, setIsCancelingSubmitting] = useState(false)
	const [remainingTime, setRemainingTime] = useState<number | null>(null)

	// 获取订单详情
	const { data: orderDetail, isLoading, error } = useOrderDetail({
		userId: Number(userId),
		isOwner: false,
		orderId: orderId || ''
	})

	const payOrderMutation = usePayOrder()
	const cancelOrderMutation = useCancelOrder()

	// 计算剩余时间
	useEffect(() => {
		if (!orderDetail?.lastPayTime) return

		const updateRemainingTime = () => {
			const now = Date.now()
			const remaining = Math.max(0, orderDetail.lastPayTime! - now)
			setRemainingTime(remaining)

			if (remaining === 0) {
				toast.warning(t('orderTimeout'))
			}
		}

		updateRemainingTime()
		const timer = setInterval(updateRemainingTime, 1000)

		return () => clearInterval(timer)
	}, [orderDetail?.lastPayTime, t])

	// 格式化剩余时间
	const formatRemainingTime = (ms: number) => {
		const minutes = Math.floor(ms / 60000)
		const seconds = Math.floor((ms % 60000) / 1000)
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
	}

	// 获取订单状态文本
	const getStatusText = (status: number) => {
		switch (status) {
			case 1:
				return t('statusPending')
			case 2:
				return t('statusPaid')
			case 3:
				return t('statusCancelled')
			default:
				return t('statusUnknown')
		}
	}

	// 处理支付
	const handlePay = async () => {
		if (!userId || !orderId) return
		if (isPayingSubmitting) return

		try {
			setIsPayingSubmitting(true)
			const res = await payOrderMutation.mutateAsync({
				userId: Number(userId),
				orderId
			})

			// 检查响应数据结构
			const responseData = res?.data || res
			const code = responseData?.code
			
			if (code === 0 || code === 200) {
				toast.success(t('paymentSuccess'))
				// 手机模式跳转到records页面并定位到云购tab
				if (isMobile) {
					router.push('/records?tab=shopping')
				} else {
					router.push('/payment-result?orderId=' + orderId)
				}
			} else {
				toast.error(responseData?.msg || t('paymentFailed'))
			}
		} catch (error: any) {
			console.error('支付失败:', error)
			toast.error(error?.response?.data?.msg || error?.message || t('paymentFailedRetry'))
		} finally {
			setIsPayingSubmitting(false)
		}
	}

	// 处理取消订单
	const handleCancel = async () => {
		if (!userId || !orderId) return
		if (isCancelingSubmitting) return

		try {
			setIsCancelingSubmitting(true)
			const res = await cancelOrderMutation.mutateAsync({
				userId: Number(userId),
				orderId
			})

			// 检查响应数据结构
			const responseData = res?.data || res
			const code = responseData?.code
			
			if (code === 0 || code === 200) {
				toast.success(t('cancelSuccess'))
				// 手机模式跳转到records页面，桌面模式跳转到orders页面
				if (isMobile) {
					router.push('/records?tab=shopping')
				} else {
					router.push('/orders')
				}
			} else {
				toast.error(responseData?.msg || t('cancelFailed'))
			}
		} catch (error: any) {
			console.error('取消订单失败:', error)
			toast.error(error?.response?.data?.msg || error?.message || t('cancelFailedRetry'))
		} finally {
			setIsCancelingSubmitting(false)
		}
	}

	// 加载状态
	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-[400px]'>
				<LoadingSpinner size='lg' text={t('loading')} />
			</div>
		)
	}

	// 错误状态
	if (error || !orderDetail) {
		return (
			<div className='flex flex-col items-center justify-center h-[400px] gap-4'>
				<div className='text-secondary'>{t('loadFailed')}</div>
				<button className='bg-brand rounded-lg px-4 py-2' onClick={() => router.back()}>
					{t('back')}
				</button>
			</div>
		)
	}

	// 获取商品列表（支持多商品）
	const products = orderDetail.products || []
	const totalQuantity = products.reduce((sum, product) => sum + Number(product.productAmount || 0), 0)

	// Mobile version
	if (isMobile) {
		return (
		<div className='pb-24'>
			{/* Header */}
			<section className='mb-3'>
				<div className='flex items-center gap-2'>
					<button
						onClick={() => router.back()}
						className='flex h-7 w-7 items-center justify-center rounded-lg bg-white/5'>
						<ChevronBackIcon />
					</button>
					<h1 className='flex-1 text-center text-[20px] font-semibold text-[#6741FF] pr-9'>{t('title')}</h1>
				</div>
			</section>

				{/* Product List */}
				<section className='space-y-3 mb-32'>
					{products.map((product, idx) => (
						<div key={idx} className='bg-white/5 rounded-lg p-3 flex items-center gap-2'>
							{/* Product Image */}
							<div className='flex-shrink-0'>
								<figure className='h-10 w-10 rounded-full bg-gradient-to-b from-[#8A8A8A] to-[#5A5A5A] p-0.2'>
									{product.logo ? (
										<img src={`${IMG_BASE_URL}${product.logo}`} className='h-full w-full rounded-full object-cover' alt={product.productName} />
									) : (
										<img src='/images/examples/eth.png' className='h-full w-full rounded-full object-cover' alt={product.productName} />
									)}
								</figure>
							</div>

							{/* Product Info */}
							<div className='flex-1 min-w-0'>
								<h4 className='text-white text-sm font-medium mb-1'>{product.productName}</h4>
								<div className='flex items-center gap-2 text-white/80 text-xs'>
									<span>{t('price')}：{product.price}U</span>
									<span>{t('productValue')}：{product.productValue}</span>
								</div>
							</div>

							{/* Status & Quantity */}
							<div className='flex-shrink-0 flex flex-col items-end gap-1'>
								<div className='text-[#6E6E70] text-xs'>
									{getStatusText(orderDetail.status)}
								</div>
								<div className='flex items-center gap-2'>
									<span className='text-white text-sm font-semibold'>x {product.productNum}</span>
								</div>
							</div>
						</div>
					))}
				</section>

				{/* Fixed Countdown Notice - 10px above action bar */}
				{orderDetail.status === 1 && remainingTime !== null && (
					<div className='fixed inset-x-0 bottom-[160px] z-50 px-3'>
						<div className='bg-white/5 rounded-xl p-3 flex flex-col items-center gap-1'>
							<div className='flex items-center gap-1'>
								<span className='text-white/80 text-xs font-semibold'>{formatRemainingTime(remainingTime)}</span>
								<TooltipSpan value={t('timeoutNotice')} normalWord={true} offsetLeft={-30} tooltipWidth={140}>
									<HelpSVG className='text-white h-3.5 w-3.5' />
								</TooltipSpan>
							</div>
							<p className='text-[#6E6E70] text-[10px]'>{t('timeoutNotice')}</p>
						</div>
					</div>
				)}

				{/* Fixed Bottom Action Bar */}
				<div className='fixed inset-x-0 bottom-[80px] z-50 bg-white/5 border-t border-white/10 px-3 py-3'>
					<div className='flex items-center justify-between gap-2'>
						{/* Total Price */}
						<div className='text-[#E5AD54] text-base font-semibold'>
							{orderDetail.amount || '0'} USDT
						</div>

						{/* Action Buttons */}
						<div className='flex items-center gap-2'>
							{orderDetail.status === 1 && (
								<>
									<button
										onClick={handleCancel}
										disabled={isCancelingSubmitting}
										className='bg-[#303030] rounded-lg px-3 py-2 disabled:opacity-50'
									>
										<span className='text-white text-sm font-semibold'>
											{isCancelingSubmitting ? t('processing') : t('cancel')}
										</span>
									</button>
									<button
										onClick={handlePay}
										disabled={isPayingSubmitting}
										className='bg-gradient-to-b from-[#A088FF] to-[#6741FF] border-[3px] border-white/10 rounded-lg px-4 py-2 disabled:opacity-50'
									>
										<span className='text-white text-sm font-semibold'>
											{isPayingSubmitting ? t('processing') : t('confirmPayment')}
										</span>
									</button>
								</>
							)}
						{orderDetail.status === 2 && (
							<button 
								className='bg-gradient-to-b from-[#A088FF] to-[#6741FF] border-[3px] border-white/10 rounded-lg px-4 py-2' 
								onClick={() => router.push('/records?tab=shopping')}
							>
								<span className='text-white text-sm font-semibold'>{t('viewOrder')}</span>
							</button>
						)}
							{orderDetail.status === 3 && (
								<button 
									className='bg-[#303030] rounded-lg px-4 py-2' 
									onClick={() => router.back()}
								>
									<span className='text-white text-sm font-semibold'>{t('back')}</span>
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		)
	}

	// Desktop version
	return (
		<div className='space-y-8'>
			<div className='flex items-center justify-between'>
				<h1 className='text-[24px]'>{t('title')}</h1>

				{orderDetail.status === 1 && remainingTime !== null && (
					<div className='flex gap-1 items-center'>
						<span className='font-semibold text-gold'>{formatRemainingTime(remainingTime)}</span>
						<TooltipSpan value={t('timeoutNotice')} normalWord={true} offsetLeft={-30} tooltipWidth={140}>
							<HelpSVG className='text-subtitle h-5 w-5' />
						</TooltipSpan>
					</div>
				)}
			</div>

			{/* 订单号信息 */}
			{products.length > 0 && (
				<div className='bg-card rounded-xl border p-4'>
					<div className='text-secondary text-sm'>
						{t('orderNumber')}: <span className='text-primary'>{orderDetail.orderId}</span>
					</div>
				</div>
			)}

			{/* 商品列表 */}
			<ul className='space-y-4'>
				{products.map((product, idx) => (
					<li key={idx} className='bg-card flex items-center justify-between gap-3 rounded-3xl border p-6 font-medium'>
						<div className='flex flex-1 items-center gap-3'>
							<figure className='h-[52px] w-[52px] rounded-full bg-gradient-to-b from-[#8A8A8A] to-[#5A5A5A] p-0.2'>
								{product.logo ? (
									<img src={`${IMG_BASE_URL}${product.logo}`} className='h-full w-full rounded-full object-cover' alt={product.productName} />
								) : (
									<img src='/images/examples/eth.png' className='h-full w-full rounded-full object-cover' alt={product.productName} />
								)}
							</figure>
							<div className='w-[200px]'>
								<h4 className='text-primary text-sm'>（{t('periodNumber', {number: product.serialNumber})}）{product.productName}</h4>
								{/* <p className='text-secondary text-xs'>{t('period')}: {product.serialNumber}</p> */}
							</div>
						</div>

						<div className='flex-1 flex flex-col items-center justify-center'>
							<div className='text-secondary text-xs'>{t('price')}</div>
							<div className='text-gold text-sm'>{product.price} U</div>
						</div>
						<div className='flex-1 flex flex-col items-center justify-center'>
							<div className='text-secondary text-xs'>{t('productValue')}</div>
							<div className='text-brand-2 text-sm'>{product.productValue}</div>
						</div>

						<div className='flex-1 flex flex-col items-center justify-center'>
							<div className='text-secondary text-xs'>{t('quantity')}</div>
							<div className='text-primary text-sm'>{product.productAmount}</div>
						</div>

						<div className='flex-1 flex flex-col items-center justify-center'>
							<div className='text-secondary text-xs'>{t('status')}</div>
							<div className='text-primary text-sm'>{getStatusText(orderDetail.status)}</div>
						</div>
					</li>
				))}
			</ul>

			{/* 底部操作栏 */}
			<div className='flex items-center justify-between'>
				<h1 className='text-[24px]'></h1>
				<div className='text-secondary flex items-center text-sm'>
					<span className='text-primary ml-1 text-base'>
						{t('total')}
						<span className='text-gold font-semibold'>{orderDetail.amount || '0'} USDT</span>
					</span>
					{orderDetail.status === 1 && (
						<>
							<button
								className='bg-button w-[72px] rounded-lg px-2 py-1 text-[#fff] ml-3 disabled:opacity-50 disabled:cursor-not-allowed'
								onClick={handleCancel}
								disabled={isCancelingSubmitting}
							>
								{isCancelingSubmitting ? t('processing') : t('cancel')}
							</button>
							<BrandBtn className='ml-3' onClick={handlePay} disabled={isPayingSubmitting}>
								{isPayingSubmitting ? t('processing') : t('confirmPayment')}
							</BrandBtn>
						</>
					)}
				{orderDetail.status === 2 && (
					<button 
						className='bg-brand rounded-lg px-4 py-2 ml-3' 
						onClick={() => {
							if (isMobile) {
								router.push('/records?tab=shopping')
							} else {
								router.push('/orders')
							}
						}}
					>
						{t('viewOrder')}
					</button>
				)}
					{orderDetail.status === 3 && (
						<button className='bg-button rounded-lg px-4 py-2 ml-3' onClick={() => router.back()}>
							{t('back')}
						</button>
					)}
				</div>
			</div>
		</div>
	)
}
