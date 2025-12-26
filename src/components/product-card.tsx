'use client'

import { useState, useEffect } from 'react'
import PlusSVG from '@/svgs/plus.svg'
import MinusSVG from '@/svgs/minus.svg'
import HeartFilledSVG from '@/svgs/heart-filled.svg'
import HeartFilled2SVG from '@/svgs/heart-filled2.svg'
import HeartRedSVG from '@/svgs/heart-red.svg'
import HeartRed2SVG from '@/svgs/heart-red2.svg'
import { Link, useRouter } from '@/i18n/navigation'
import { Product, useOrderBuy, useManageCart } from '@/requests'
import { toFixed } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { useAuthDialogStore } from '@/components/auth-dialogs/store'
import { toast } from '@/components/toast'
import { useQueryClient } from '@tanstack/react-query'
import Countdown from '@/components/countdown'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { IMG_BASE_URL } from '@/consts'

export default function ProductCard({ product, showCircleDecoration = false, showCountdownLabels = true }: { product: Product, showCircleDecoration?: boolean, showCountdownLabels?: boolean }) {
	const t = useTranslations('productCard')
	const router = useRouter()
	const { userId } = useAuth()
	const { openDialog } = useAuthDialogStore()
	const queryClient = useQueryClient()
	const [quantity, setQuantity] = useState(1)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isInCart, setIsInCart] = useState(product.cart || false)
	const [isCountdownExpired, setIsCountdownExpired] = useState(false)
	const isMobile = useIsMobile()

	const orderBuyMutation = useOrderBuy()
	const manageCartMutation = useManageCart()

	// 当 product.cart 变化时更新本地状态
	useEffect(() => {
		setIsInCart(product.cart || false)
	}, [product.cart])

	// 监听倒计时是否结束
	useEffect(() => {
		const checkCountdownStatus = () => {
			const now = Date.now()
			const isExpired = product.endTime <= now
			setIsCountdownExpired(isExpired)
		}

		// 立即检查一次
		checkCountdownStatus()

		// 每秒检查一次
		const timer = setInterval(checkCountdownStatus, 1000)

		// 清理定时器
		return () => clearInterval(timer)
	}, [product.endTime])

	const progress = toFixed((product.joinPerson / product.totalPerson) * 100) + '%'
	const progressValue = (product.joinPerson / product.totalPerson) * 100
	const isProgressComplete = progressValue >= 100
	// 计算剩余人次
	const remainingSlots = product.totalPerson - product.joinPerson

	const handleDecrement = () => {
		if (quantity > 1) {
			setQuantity(quantity - 1)
		}
	}

	const handleIncrement = () => {
		// 限制不能超过剩余人次
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

	const handleJoinNow = async () => {
		// 检查是否登录
		if (!userId) {
			if (isMobile) {
				router.push('/auth?mode=login' as any)
			} else {
				openDialog('login')
			}
			return
		}

		// 防止重复提交
		if (isSubmitting) return

		try {
			setIsSubmitting(true)

			// 调用下单接口
			const res = await orderBuyMutation.mutateAsync({
				userId: Number(userId),
				data: [
					{
						productId: product.productId,
						num: quantity
					}
				]
			})
			console.log(res)
			if (res.data.code == 0 || res.data.code == 200) {
				router.push('/comfirm-order?orderId=' + res.data.data?.orderId!)
			} else {
				toast.error(res.data.msg!)
			}
		} catch (error: any) {
			console.error('下单失败:', error)
			toast.error(error?.response?.data?.msg)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleToggleCart = async () => {
		// 检查是否登录
		if (!userId) {
			if (isMobile) {
				router.push('/auth?mode=login' as any)
			} else {
				openDialog('login')
			}
			return
		}

		try {
			const newCartState = !isInCart

			// 调用购物车管理接口
			// type: 1-添加, 2-删除
			await manageCartMutation.mutateAsync({
				userId: Number(userId),
				productId: product.productId,
				type: newCartState ? 1 : 2,
				num: quantity
			})

			// 立即更新本地状态
			setIsInCart(newCartState)

			// 使相关缓存失效，触发数据刷新
			queryClient.invalidateQueries({ queryKey: ['home'] })
			queryClient.invalidateQueries({ queryKey: ['zone-products'] })
			queryClient.invalidateQueries({ queryKey: ['product-detail'] })

			// 显示提示
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

	// 移动端卡片
	if (isMobile) {
		const handleCardClick = (e: React.MouseEvent) => {
			// 如果点击的是按钮或心形图标，不触发卡片点击
			const target = e.target as HTMLElement
			if (target.closest('button') || target.closest('svg') || target.closest('a')) {
				return
			}
			router.push(`/product/${product.productId}?serialNumber=${product.serialNumber}${isProgressComplete && isCountdownExpired ? '&winner=true' : ''}`)
		}

		return (
			<div 
				className='bg-white/5 relative flex flex-col items-center gap-2 rounded-lg border border-white/10 p-3 pt-7 text-xs shadow-sm h-full cursor-pointer'
				onClick={handleCardClick}
			>
				
				{/* 产品图片 - 绝对定位在顶部 */}
				<figure className='absolute top-[-20px] h-10 w-10 rounded-full bg-gradient-to-b from-[#8A8A8A] to-[#5A5A5A] p-0.2 z-10'>
					<img 
						src={`${product?.logo ? (IMG_BASE_URL + product?.logo) : '/images/examples/eth.png'}`} 
						className='h-full w-full rounded-full object-cover' 
					/>
				</figure>

			{/* 标题 */}
			<div className='w-full text-center'>
				<h4 className='text-white font-medium text-xs line-clamp-1'>{product.title}</h4>
				<p className='text-secondary text-[10px] mt-0.5 line-clamp-1'>{product.subTitle}</p>
			</div>

				{/* 信息网格 - 只显示两列 */}
				<ul className='w-full grid grid-cols-2 gap-4 text-center text-[10px] mt-2'>
					<li>
						<div className='text-gold font-medium text-xs'>{product.price} USDT</div>
						<span className='text-secondary uppercase text-[9px]'>{t('productPrice')}</span>
					</li>
					<li>
						<div className='text-brand-2 font-medium text-xs'>{product.productValue}</div>
						<span className='text-secondary uppercase text-[9px]'>{t('productValue')}</span>
					</li>
				</ul>

				{/* 占位空间 */}
				<div className='flex-1' />

				{/* 进度条或倒计时 */}
				{isProgressComplete && !isCountdownExpired ? (
					<div className='w-full'>
						<Countdown endTime={product.endTime} showSeconds={false} showLabels={showCountdownLabels} />
					</div>
				) : (
					<div className='w-full -mt-2'>
						<div className='text-secondary flex justify-between text-[10px]'>
							<span>{product.joinPerson}</span>
							<span>{product.totalPerson}</span>
						</div>
						<div className='mt-1 w-full relative'>
							<div className='h-2 w-full overflow-hidden rounded-full bg-white/5'>
								<div className='bg-brand h-full rounded-full' style={{ width: progress }}></div>
							</div>
							<div className='absolute top-1/2 -translate-y-1/2' style={{ left: progress }}>
								<span className='ml-[1px] text-[8px] font-medium text-white whitespace-nowrap'>{progress}</span>
							</div>
						</div>
						<div className='text-secondary flex justify-between text-[9px] mt-1'>
							<span>{t('participants')}</span>
							<span>{t('maxParticipants')}</span>
						</div>
					</div>
				)}

			{/* 操作按钮区 */}
			<div className='w-full flex items-center justify-center gap-3 pt-1'>
				{isProgressComplete ? (
					<Link 
						href={`/product/${product.productId}?serialNumber=${product.serialNumber}${isCountdownExpired ? '&winner=true' : ''}`}
						className='bg-brand rounded px-3 py-1 text-[10px] font-semibold transition-all hover:opacity-90 w-16 text-center'
					>
						{t('view')}
					</Link>
				) : (
						<button
							className='bg-brand rounded px-3 py-1.5 text-[10px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90 w-16'
							onClick={handleJoinNow}
							disabled={isSubmitting}
						>
							{isSubmitting ? t('submitting') : t('joinNowShort')}
						</button>
					)}

					{isInCart ? (
						<HeartRed2SVG className='cursor-pointer flex-shrink-0 transition-transform hover:scale-110' onClick={handleToggleCart} />
					) : (
						<HeartFilled2SVG className='cursor-pointer flex-shrink-0 transition-transform hover:scale-110' onClick={handleToggleCart} />
					)}
				</div>
			</div>
		)
	}

	// 桌面端卡片（保留原有的）
	return (
		<div className='bg-card relative flex flex-col items-center justify-center gap-3 rounded-xl border p-8 pb-4 text-sm'>
			<figure className='absolute top-[-32px] h-[56px] w-[56px] rounded-full bg-gradient-to-b from-[#8A8A8A] to-[#5A5A5A] p-0.2'>
				<img src={`${product?.logo ? (IMG_BASE_URL + product?.logo) : '/images/examples/eth.png'}`} className='h-full w-full rounded-full object-cover' />
			</figure>

			<div>
				<h4 className='text-primary font-medium text-center'>{product.title}</h4>
				<p className='text-secondary text-sm'>{product.subTitle}</p>
			</div>

			<ul className='grid grid-cols-2 gap-16 text-center whitespace-nowrap mt-2'>
				{/* <li>
					<div className='text-primary font-medium'>{product.joinPerson}</div>
					<span className='text-secondary text-xs'>{t('participants')}</span>
				</li> */}
				{/* <li>
					<div className='text-primary font-medium'>{product.totalPerson}</div>
					<span className='text-secondary text-xs'>{t('maxParticipants')}</span>
				</li> */}
				<li>
					<div className='text-gold font-medium'>{product.price} USDT</div>
					<span className='text-secondary text-xs'>{t('productPrice')}</span>
				</li>
				<li>
					<div className='text-brand-2 font-medium'>{product.productValue}</div>
					<span className='text-secondary text-xs'>{t('productValue')}</span>
				</li>
			</ul>

			{isProgressComplete && !isCountdownExpired ? (
				<Countdown endTime={product.endTime} className="w-full" />
			) : (
				<div className='w-full -mt-2'>
					<div className='text-secondary flex justify-between text-sm'>
						<span>{product.joinPerson}</span>
						<span>{product.totalPerson}</span>
					</div>
					<div className='mt-1 w-full relative'>
						<div className='h-3 w-full overflow-hidden rounded-full bg-white/5'>
							<div className='bg-brand h-full rounded-full' style={{ width: progress }}></div>
						</div>
						<div className='absolute top-1/2 -translate-y-1/2' style={{ left: progress }}>
							<span className='ml-[1px] text-[10px] font-medium text-white whitespace-nowrap'>{progress}</span>
						</div>
					</div>
					<div className='text-secondary flex justify-between text-sm mt-1'>
						<span>{t('participants')}</span>
						<span>{t('maxParticipants')}</span>
					</div>
				</div>
			)}

			{!isProgressComplete ? <div className='flex items-center gap-4 select-none'>
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
			</div> : null}

			{!isProgressComplete ? <div className='flex items-center gap-3'>
				<Link href={`/product/${product.productId}?serialNumber=${product.serialNumber}`} className='bg-button w-[100px] rounded-xl px-3 py-2 text-center'>
					{t('details')}
				</Link>

				<button
					className='bg-brand min-w-[100px] rounded-xl px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed'
					onClick={handleJoinNow}
					disabled={isSubmitting}
				>
					{isSubmitting ? '...' : t('joinNow')}
				</button>

				{isInCart ? (
					<HeartRed2SVG className='text-card cursor-pointer transition-transform hover:scale-110' onClick={handleToggleCart} />
				) : (
					<HeartFilled2SVG className='text-card cursor-pointer transition-transform hover:scale-110' onClick={handleToggleCart} />
				)}
			</div> : <div className='flex items-center gap-3'>
				<Link 
					href={`/product/${product.productId}?serialNumber=${product.serialNumber}${isCountdownExpired ? '&winner=true' : ''}`}
					className='bg-brand w-[100px] rounded-xl px-3 py-2 text-center transition-all hover:opacity-90'
				>
					{t('view')}
				</Link>
			</div>}
		</div>
	)
}

export function ProductCardSkeleton() {
	const isMobile = useIsMobile()

	// 移动端骨架屏
	if (isMobile) {
		return (
			<div className='bg-white/5 relative flex animate-pulse flex-col items-center gap-2 rounded-lg border border-white/10 p-3 pt-7 text-xs'>
				{/* 产品图片骨架 */}
				<figure className='absolute top-[-20px] h-10 w-10 rounded-full bg-skeleton' />

				{/* 标题骨架 */}
				<div className='w-full text-center'>
					<div className='h-3 w-3/4 mx-auto rounded bg-skeleton' />
				</div>

				{/* 信息网格骨架 */}
				<ul className='w-full grid grid-cols-3 gap-2 text-center'>
					{Array.from({ length: 3 }).map((_, idx) => (
						<li key={idx} className='flex flex-col items-center gap-1'>
							<div className='h-3 w-10 rounded bg-skeleton' />
							<div className='h-2 w-12 rounded bg-skeleton' />
						</li>
					))}
				</ul>

				{/* 进度条骨架 */}
				<div className='w-full'>
					<div className='flex justify-between text-[10px] mb-1'>
						<span className='h-2 w-8 rounded bg-skeleton' />
						<span className='h-2 w-8 rounded bg-skeleton' />
					</div>
					<div className='h-2 w-full rounded-full bg-skeleton' />
				</div>

				{/* 按钮骨架 */}
				<div className='w-full flex items-center justify-center gap-3 pt-1'>
					<div className='h-6 flex-1 rounded bg-skeleton' />
					<div className='h-6 w-6 rounded-full bg-skeleton' />
				</div>
			</div>
		)
	}

	// 桌面端骨架屏
	return (
		<div className='bg-card relative flex animate-pulse flex-col items-center justify-center gap-3 rounded-xl border p-8 pb-4 text-sm'>
			<figure className='absolute top-[-32px] h-[56px] w-[56px] rounded-full bg-gradient-to-b from-[#8A8A8A] to-[#5A5A5A] p-0.2'>
				<div className='h-full w-full rounded-full bg-skeleton' />
			</figure>

			<div className='mt-6 flex w-full flex-col items-center gap-2'>
				<div className='h-4 w-40 rounded bg-skeleton' />
				<div className='h-3 w-28 rounded bg-skeleton' />
			</div>

			<ul className='grid w-full grid-cols-4 gap-3 text-center'>
				{Array.from({ length: 4 }).map((_, idx) => (
					<li key={idx} className='flex flex-col items-center gap-1'>
						<div className='h-4 w-12 rounded bg-skeleton' />
						<span className='h-3 w-16 rounded bg-skeleton' />
					</li>
				))}
			</ul>

			<div className='w-full'>
				<div className='text-secondary flex justify-between text-sm'>
					<span className='h-3 w-10 rounded bg-skeleton' />
					<span className='h-3 w-8 rounded bg-skeleton' />
				</div>
				<div className='mt-1 w-full'>
					<div className='h-3 w-full overflow-hidden rounded-full bg-skeleton'>
						<div className='h-full w-1/3 rounded-full bg-skeleton' />
					</div>
				</div>
			</div>

			<div className='flex items-center gap-4'>
				<div className='h-6 w-6 rounded bg-skeleton' />
				<span className='h-4 w-6 rounded bg-skeleton' />
				<div className='h-6 w-6 rounded bg-skeleton' />
			</div>

			<div className='flex items-center gap-3'>
				<div className='h-9 w-[100px] rounded-xl bg-skeleton' />
				<div className='h-9 w-[100px] rounded-xl bg-skeleton' />
				<div className='h-6 w-6 rounded-full bg-skeleton' />
			</div>
		</div>
	)
}