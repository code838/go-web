'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import BrandBtn from '@/components/brand-btn'
import Checkbox from '@/components/checkbox'
import ClearWishlistDialog from '@/components/clear-wishlist-dialog'
import MinusSVG from '@/svgs/minus.svg'
import PlusSVG from '@/svgs/plus.svg'
import NodataSVG from '@/svgs/nodata.svg'
import { useRouter } from '@/i18n/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useCartList, useManageCart, useOrderBuy } from '@/requests/index'
import type { CartItem } from '@/requests/index'
import { toast } from '@/components/toast'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { IMG_BASE_URL } from '@/consts'
import { ContentLoading } from '@/components/loading-spinner'
import { cn } from '@/lib/utils'
import CheckedSVG from '@/components/checkbox/checked.svg'
import UncheckedSVG from '@/components/checkbox/unchecked.svg'

export default function Page() {
	const t = useTranslations('wishlist')
	const tOrder = useTranslations('confirmOrder')
	const router = useRouter()
	const { userId } = useAuth()
	const isMobile = useIsMobile()
	const [showClearDialog, setShowClearDialog] = useState(false)
	const [mounted, setMounted] = useState(false)

	// 确保在客户端挂载后再获取数据，此时 zustand persist 已经恢复
	useEffect(() => {
		setMounted(true)
	}, [])

	// Fetch cart list - only when mounted and userId exists
	const userIdNum = mounted && userId ? Number(userId) : 0
	const { data: cartItems = [], isLoading, refetch } = useCartList(userIdNum)
	const { mutateAsync: manageCart } = useManageCart()
	const { mutateAsync: orderBuy } = useOrderBuy()
	const [isCheckoutSubmitting, setIsCheckoutSubmitting] = useState(false)
	
	// 加载状态管理
	const [isSelectAllLoading, setIsSelectAllLoading] = useState(false)
	const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set()) // 存储正在加载的商品ID
	const [editingQuantities, setEditingQuantities] = useState<Record<number, string>>({}) // 存储正在编辑的数量

	// Check if all items are selected
	const isAllSelected = useMemo(() => {
		return cartItems.length > 0 && cartItems.every(item => item.selected === 1)
	}, [cartItems])

	// Calculate selected items count and total price
	const { selectedCount, totalPrice } = useMemo(() => {
		let count = 0
		let total = 0
		cartItems.forEach((item) => {
			if (item.selected === 1) {
				count += item.num
				total += Number(item.price) * item.num
			}
		})
		return { selectedCount: count, totalPrice: total }
	}, [cartItems])

	// Show loading state if not mounted yet or data is loading
	const showLoading = !mounted || isLoading

	// Handle select all
	const handleSelectAll = async () => {
		console.log('handleSelectAll called', { userId, isSelectAllLoading, cartItemsLength: cartItems.length, isAllSelected })
		
		if (!userId) {
			console.log('handleSelectAll: No userId')
			return
		}
		if (isSelectAllLoading) {
			console.log('handleSelectAll: Already loading')
			return
		}
		if (cartItems.length === 0) {
			console.log('handleSelectAll: No cart items')
			return
		}

		setIsSelectAllLoading(true)
		try {
			// 根据当前状态决定是选中还是取消选中
			const shouldSelectAll = !isAllSelected
			console.log('handleSelectAll: shouldSelectAll', shouldSelectAll, 'isAllSelected', isAllSelected)
			
			const itemsToUpdate = shouldSelectAll 
				? cartItems.filter(item => item.selected === 0)
				: cartItems.filter(item => item.selected === 1)

			console.log('handleSelectAll: itemsToUpdate', itemsToUpdate.length)

			if (itemsToUpdate.length === 0) {
				// 没有需要更新的商品，直接返回
				console.log('handleSelectAll: No items to update')
				setIsSelectAllLoading(false)
				return
			}

			// 批量更新所有需要更新的商品
			const updatePromises = itemsToUpdate.map(item =>
				manageCart({
					userId: Number(userId),
					type: shouldSelectAll ? 4 : 5, // 4: 选中, 5: 取消选中
					productId: item.productId,
					selected: shouldSelectAll ? 1 : 0
				}).catch(err => {
					console.error(`Failed to update item ${item.productId}:`, err)
					throw err
				})
			)

			console.log('handleSelectAll: Starting updates', updatePromises.length)
			// 等待所有更新完成
			await Promise.all(updatePromises)
			console.log('handleSelectAll: All updates completed')
			
			// 等待refetch完成，确保数据更新
			console.log('handleSelectAll: Refetching data')
			const refetchResult = await refetch()
			console.log('handleSelectAll: Refetch completed', refetchResult)
			if (refetchResult.error) {
				console.error('Refetch failed:', refetchResult.error)
				toast.error(t('operationFailed'))
			}
		} catch (error) {
			console.error('Select all failed:', error)
			toast.error(t('operationFailed'))
		} finally {
			// 确保loading状态被清除
			console.log('handleSelectAll: Clearing loading state')
			setIsSelectAllLoading(false)
		}
	}

	// Handle individual item selection
	const handleSelectItem = async (item: CartItem) => {
		if (!userId || loadingItems.has(item.productId)) return

		setLoadingItems(prev => new Set(prev).add(item.productId))
		try {
			const newSelected = item.selected === 1 ? 0 : 1
			await manageCart({
				userId: Number(userId),
				type: newSelected === 1 ? 4 : 5, // 4: 选中, 5: 取消选中
				productId: item.productId,
				selected: newSelected
			})
			refetch()
		} catch (error) {
			toast.error(t('operationFailed'))
		} finally {
			setLoadingItems(prev => {
				const next = new Set(prev)
				next.delete(item.productId)
				return next
			})
		}
	}

	// Handle remove item
	const handleRemoveItem = async (item: CartItem) => {
		if (!userId || loadingItems.has(item.productId)) return

		setLoadingItems(prev => new Set(prev).add(item.productId))
		try {
			await manageCart({
				userId: Number(userId),
				type: 2, // 删除
				productId: item.productId
			})
			toast.success(t('removeSuccess'))
			refetch()
		} catch (error) {
			toast.error(t('removeFailed'))
		} finally {
			setLoadingItems(prev => {
				const next = new Set(prev)
				next.delete(item.productId)
				return next
			})
		}
	}

	// Handle quantity change
	const handleQuantityChange = async (item: CartItem, delta: number) => {
		if (!userId || loadingItems.has(item.productId)) return

		// 如果当前数量为1且是减少操作，则删除商品
		if (item.num === 1 && delta === -1) {
			handleRemoveItem(item)
			return
		}

		const newQuantity = Math.max(1, item.num + delta)
		if (newQuantity === item.num) return

		// 暂时注释加载动画
		// setLoadingItems(prev => new Set(prev).add(item.productId))
		try {
			await manageCart({
				userId: Number(userId),
				type: 3, // 修改数量
				productId: item.productId,
				num: newQuantity
			})
			refetch()
		} catch (error) {
			toast.error(t('updateQuantityFailed'))
		} finally {
			// 暂时注释加载动画
			// setLoadingItems(prev => {
			// 	const next = new Set(prev)
			// 	next.delete(item.productId)
			// 	return next
			// })
		}
	}

	// Handle manual quantity input - 本地状态更新
	const handleQuantityInputChange = (item: CartItem, value: string) => {
		if (loadingItems.has(item.productId)) return

		// 允许空值和纯数字输入
		if (value === '' || /^\d+$/.test(value)) {
			setEditingQuantities(prev => ({
				...prev,
				[item.productId]: value
			}))
		}
	}

	// Handle quantity input blur - 提交到服务器
	const handleQuantityInputBlur = async (item: CartItem) => {
		if (!userId || loadingItems.has(item.productId)) return
		
		const editingValue = editingQuantities[item.productId]
		
		// 如果没有编辑过，直接返回
		if (editingValue === undefined) return

		// 清除编辑状态
		setEditingQuantities(prev => {
			const next = { ...prev }
			delete next[item.productId]
			return next
		})

		// 如果为空或无效，重置为1
		if (editingValue === '' || parseInt(editingValue, 10) < 1) {
			if (item.num !== 1) {
				// 暂时注释加载动画
				// setLoadingItems(prev => new Set(prev).add(item.productId))
				try {
					await manageCart({
						userId: Number(userId),
						type: 3,
						productId: item.productId,
						num: 1
					})
					refetch()
				} catch (error) {
					toast.error(t('updateQuantityFailed'))
				} finally {
					// 暂时注释加载动画
					// setLoadingItems(prev => {
					// 	const next = new Set(prev)
					// 	next.delete(item.productId)
					// 	return next
					// })
				}
			}
			return
		}

		// 验证数量
		const num = parseInt(editingValue, 10)
		const remainingSlots = item.totalPerson - item.joinPerson
		const newQuantity = Math.min(num, remainingSlots)

		if (newQuantity !== num) {
			toast.warning(t('maxParticipantLimit', { count: remainingSlots }))
		}

		// 如果数量没变，不调用API
		if (newQuantity === item.num) return

		// 暂时注释加载动画
		// setLoadingItems(prev => new Set(prev).add(item.productId))
		try {
			await manageCart({
				userId: Number(userId),
				type: 3,
				productId: item.productId,
				num: newQuantity
			})
			refetch()
		} catch (error) {
			toast.error(t('updateQuantityFailed'))
		} finally {
			// 暂时注释加载动画
			// setLoadingItems(prev => {
			// 	const next = new Set(prev)
			// 	next.delete(item.productId)
			// 	return next
			// })
		}
	}

	// Handle quantity input key press - 支持回车提交
	const handleQuantityInputKeyPress = (item: CartItem, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.currentTarget.blur() // 触发 blur 事件来提交
		}
	}

	// Handle clear button click - check if any items are selected
	const handleClearClick = () => {
		const hasSelected = cartItems.some(item => item.selected === 1)
		if (!hasSelected) {
			toast.warning(t('noSelection'))
			return
		}
		// Show confirmation dialog
		setShowClearDialog(true)
	}

	// Handle confirmed clear action
	const handleConfirmClear = async () => {
		if (!userId) return

		try {
			// Remove selected items
			const selectedItems = cartItems.filter(item => item.selected === 1)
			for (const item of selectedItems) {
				await manageCart({
					userId: Number(userId),
					type: 2, // 删除
					productId: item.productId
				})
			}
			toast.success(t('clearSuccess'))
			refetch()
			setShowClearDialog(false)
		} catch (error) {
			toast.error(t('clearFailed'))
		}
	}

	// Handle cancel clear action
	const handleCancelClear = () => {
		setShowClearDialog(false)
	}

	// Get status text
	const getStatusText = (status: number) => {
		switch (status) {
			case 1:
				return t('statusOngoing')
			case 2:
				return t('statusEnded')
			case 3:
				return t('statusComing')
			default:
				return '-'
		}
	}

	// Handle checkout
	const handleCheckout = async () => {
		if (!userId) return
		if (selectedCount === 0) {
			toast.warning(t('noSelection'))
			return
		}
		if (isCheckoutSubmitting) return

		try {
			setIsCheckoutSubmitting(true)
			
			// 收集选中的商品
			const selectedItems = cartItems.filter(item => item.selected === 1)
			const orderData = selectedItems.map(item => ({
				productId: item.productId,
				num: item.num
			}))

			// 调用下单接口
			const res = await orderBuy({
				userId: Number(userId),
				data: orderData
			})

			if (res.data.code === 0 || res.data.code === 200) {
				// 获取订单ID并跳转到确认订单页面
				const orderId = res.data.data.orderId
				router.push(`/comfirm-order?orderId=${orderId}`)
			} else {
				toast.error(res.data.msg || t('checkoutFailed'))
			}
		} catch (error: any) {
			console.error('下单失败:', error)
			toast.error(error?.response?.data?.msg || t('checkoutFailedRetry'))
		} finally {
			setIsCheckoutSubmitting(false)
		}
	}

	// Loading state
	if (showLoading) {
		return (
			<div className='space-y-8'>
				{/* <h1 className='text-[24px]'>{t('title')}</h1> */}
				<ContentLoading text={t('loading')} />
			</div>
		)
	}

	// Empty state
	if (!cartItems || cartItems.length === 0) {
		return (
			<div className='space-y-8'>
				{/* <h1 className='text-[24px]'>{t('title')}</h1> */}
				
				<div className='flex flex-col items-center justify-center py-12 pt-50'>
					<div className='mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/5'>
						<NodataSVG />
					</div>
					<p className='text-secondary text-center'>{t('emptyMessage')}</p>
				</div>
			</div>
		)
	}

	// Mobile version
	if (isMobile) {
		return (
			<div className='pb-24'>
			{/* Header */}
			{/* <section className='mb-3'>
				<h1 className='text-center text-[20px] font-semibold text-[#6741FF]'>{t('title')}</h1>
			</section> */}

				{/* Cart Items List */}
				<section className='space-y-3 mb-20'>
					{cartItems.map((item) => {
						const isItemLoading = loadingItems.has(item.productId)
						return (
							<div key={item.productId} className='bg-white/5 rounded-lg p-3 flex items-start gap-2 relative'>
								{/* 加载遮罩层 */}
								{isItemLoading && (
									<div className='absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center z-10'>
										<div className='animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent'></div>
									</div>
								)}
								
								{/* Checkbox */}
								<div className='flex-shrink-0 pt-1'>
									<Checkbox 
										checked={item.selected === 1} 
										onChange={() => handleSelectItem(item)}
										disabled={isItemLoading}
									/>
								</div>

								{/* Product Image */}
								<div className='flex-shrink-0'>
									<figure className='h-12 w-12 rounded-full bg-gradient-to-b from-[#8A8A8A] to-[#5A5A5A] p-0.2'>
										{item.logo ? (
											<img src={`${IMG_BASE_URL}${item.logo}`} alt={item.title} className='h-full w-full rounded-full object-cover' />
										) : (
											<img src='/images/examples/eth.png' className='h-full w-full rounded-full object-cover' />
										)}
									</figure>
								</div>

								{/* Product Info */}
								<div className='flex-1 min-w-0'>
									<h4 className='text-white text-sm font-medium mb-1 line-clamp-1'>({tOrder('periodNumber', { number: item.serialNumber })}) {item.title}</h4>
									<p className='text-white/60 text-xs mb-1 line-clamp-1'>{item.subTitle}</p>
									<div className='flex items-center gap-2 text-white/80 text-xs'>
										<span className='whitespace-nowrap'>{t('price')}：{item.price}U</span>
										<span className='whitespace-nowrap'>{t('productValue')}：{item.productValue}</span>
									</div>
									<div className='text-[#6E6E70] text-xs mt-1'>
										{getStatusText(item.status)} ({item.joinPerson}/{item.totalPerson})
									</div>
								</div>

								{/* Quantity Controls */}
								<div className='flex-shrink-0 flex items-center gap-1.5'>
									<MinusSVG 
										className={`h-5 w-5 text-white ${isItemLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
										onClick={() => !isItemLoading && handleQuantityChange(item, -1)} 
									/>
									<input
										type="text"
										inputMode="numeric"
										pattern="[0-9]*"
										value={editingQuantities[item.productId] !== undefined ? editingQuantities[item.productId] : item.num}
										onChange={(e) => handleQuantityInputChange(item, e.target.value)}
										onBlur={() => handleQuantityInputBlur(item)}
										onKeyPress={(e) => handleQuantityInputKeyPress(item, e)}
										disabled={isItemLoading}
										className='bg-white/5 border border-white/10 rounded px-2 py-0.5 min-w-[32px] max-w-[48px] text-center text-white text-sm font-semibold focus:outline-none focus:border-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
									/>
									<PlusSVG 
										className={`h-5 w-5 text-white ${isItemLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
										onClick={() => !isItemLoading && handleQuantityChange(item, 1)} 
									/>
								</div>
							</div>
						)
					})}
				</section>

				{/* Fixed Bottom Checkout Bar */}
				<div className='fixed inset-x-0 bottom-[80px] z-[60] bg-white/5 border-t border-white/10 px-3 py-3' style={{ pointerEvents: 'auto' }}>
					<div className='flex items-center justify-between gap-2'>
						{/* Select All - 使用SVG且整体可点击（移动端） */}
						<div
							className={cn(
								'relative -mx-2 px-2 -my-2 py-2 select-none',
								'flex items-center',
								isSelectAllLoading || !userId || cartItems.length === 0
									? 'opacity-50 cursor-not-allowed'
									: 'cursor-pointer active:opacity-80'
							)}
						>
							<div className='pointer-events-none flex items-center relative z-0'>
								{isAllSelected ? (
									<CheckedSVG className='h-6 w-6' />
								) : (
									<UncheckedSVG className='h-6 w-6' />
								)}
								<span className='text-white text-sm font-medium ml-2'>
									{t('selectAll')}
								</span>
								{isSelectAllLoading && (
									<div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ml-2'></div>
								)}
							</div>
							{/* 蒙版可点层：覆盖整个区域，保证任意点按均触发（按需使用div） */}
							<div
								className='absolute inset-0 z-100'
								onClick={() => {
									if (isSelectAllLoading || !userId || cartItems.length === 0) return
									handleSelectAll()
								}}
								role='button'
								aria-label={t('selectAll')}
								aria-disabled={isSelectAllLoading || !userId || cartItems.length === 0}
								tabIndex={0}
							></div>
						</div>

						{/* Total & Checkout Button */}
						<div className='flex items-center gap-2'>
							<div className='text-white text-sm font-medium'>
								{t('total')}{totalPrice.toFixed(0)}U
							</div>
							<button
								onClick={handleCheckout}
								disabled={isCheckoutSubmitting || selectedCount === 0}
								className='bg-gradient-to-b from-[#A088FF] to-[#6741FF] border-[3px] border-white/10 rounded-lg px-4 py-2 disabled:opacity-50'
							>
								<span className='text-white text-sm font-semibold flex items-center gap-2'>
									{isCheckoutSubmitting && (
										<div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent'></div>
									)}
									{isCheckoutSubmitting ? t('processing') : t('checkout')}
								</span>
							</button>
						</div>
					</div>
				</div>

				{/* Clear Confirmation Dialog */}
				{showClearDialog && <ClearWishlistDialog onConfirm={handleConfirmClear} onCancel={handleCancelClear} />}
			</div>
		)
	}

	// Desktop version
	return (
		<div className='space-y-8'>
			<div className='flex items-center justify-between'>
				<h1 className='text-[24px]'></h1>
			</div>

			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-4'>
					{/* 全选按钮 */}
					<div className='text-subtitle flex items-center gap-1 text-sm font-semibold'>
						<Checkbox 
							checked={isAllSelected} 
							onChange={handleSelectAll}
							disabled={isSelectAllLoading}
						/>
						<span>{t('selectAll')}</span>
						{isSelectAllLoading && (
							<div className='animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent ml-1'></div>
						)}
					</div>
					
					{/* 已选商品数量 */}
					<div className='text-secondary flex items-center text-sm'>
						{t('selected')} <span className='mx-1 font-semibold'>{selectedCount}</span> {t('items')}
					</div>
				</div>

				{/* 清空按钮 - 已注释 */}
				{/* <button className='bg-button rounded-lg px-4 py-2 text-sm' onClick={handleClearClick}>
					{t('clear')}
				</button> */}
			</div>

			<div className='overflow-x-auto -mx-6 px-6'>
				<ul className='space-y-8 min-w-[1000px]'>
					{cartItems.map((item) => {
						const isItemLoading = loadingItems.has(item.productId)
						return (
							<li key={item.productId} className='bg-card flex items-center gap-3 rounded-3xl border p-6 font-medium relative'>
								{/* 加载遮罩层 */}
								{isItemLoading && (
									<div className='absolute inset-0 bg-black/20 rounded-3xl flex items-center justify-center z-10'>
										<div className='animate-spin rounded-full h-8 w-8 border-3 border-purple-500 border-t-transparent'></div>
									</div>
								)}
								
								<div className='flex items-center gap-3 flex-1'>
									<div className='flex items-center flex-shrink-0'>
										<Checkbox 
											checked={item.selected === 1} 
											onChange={() => handleSelectItem(item)}
											disabled={isItemLoading}
										/>
									</div>

									<div className='flex items-center gap-3 flex-1'>
										<figure className='h-[52px] w-[52px] rounded-full bg-gradient-to-b from-[#8A8A8A] to-[#5A5A5A] p-0.2 flex-shrink-0'>
											{item.logo ? (
												<img src={`${IMG_BASE_URL}${item.logo}`} alt={item.title} className='h-full w-full rounded-full object-cover' />
											):(
												<img src='/images/examples/eth.png' className='h-full w-full rounded-full object-cover' />
											)}
										</figure>
										<div className='flex-1 min-w-0'>
											<h4 className='text-primary text-sm truncate'>({tOrder('periodNumber', { number: item.serialNumber })}) {item.title}</h4>
											<p className='text-secondary text-xs truncate'>{item.subTitle}</p>
										</div>
									</div>
								</div>

								<div className='flex flex-col items-center justify-center text-center w-[100px] flex-shrink-0'>
									<div className='text-secondary text-xs whitespace-nowrap'>{t('price')}</div>
									<div className='text-gold text-sm whitespace-nowrap'>{item.price} U</div>
								</div>
								<div className='flex flex-col items-center justify-center text-center w-[100px] flex-shrink-0'>
									<div className='text-secondary text-xs whitespace-nowrap'>{t('productValue')}</div>
									<div className='text-brand-2 text-sm whitespace-nowrap'>{item.productValue}</div>
								</div>

								<div className='flex flex-col items-center justify-center text-center w-[100px] flex-shrink-0'>
									<div className='text-secondary text-xs whitespace-nowrap'>{t('participants')}</div>
									<div className='text-primary text-sm whitespace-nowrap'>{item.joinPerson}/{item.totalPerson}</div>
								</div>

								<div className='flex flex-col items-center justify-center text-center w-[100px] flex-shrink-0'>
									<div className='text-secondary text-xs whitespace-nowrap'>{t('status')}</div>
									<div className='text-primary text-sm whitespace-nowrap'>{getStatusText(item.status)}</div>
								</div>

								<div className='flex flex-col items-center justify-center text-center w-[140px] flex-shrink-0'>
									<div className='text-secondary text-xs whitespace-nowrap'>{t('quantity')}</div>
									<div className='flex items-center gap-2 justify-center'>
										<MinusSVG 
											className={`h-5 w-5 ${isItemLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
											onClick={() => !isItemLoading && handleQuantityChange(item, -1)} 
										/>
										<input
											type="text"
											inputMode="numeric"
											pattern="[0-9]*"
											value={editingQuantities[item.productId] !== undefined ? editingQuantities[item.productId] : item.num}
											onChange={(e) => handleQuantityInputChange(item, e.target.value)}
											onBlur={() => handleQuantityInputBlur(item)}
											onKeyPress={(e) => handleQuantityInputKeyPress(item, e)}
											disabled={isItemLoading}
											className='bg-card inline-block w-12 rounded-lg px-2 py-1 text-center text-sm font-semibold border border-white/10 focus:outline-none focus:border-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
										/>
										<PlusSVG 
											className={`h-5 w-5 ${isItemLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
											onClick={() => !isItemLoading && handleQuantityChange(item, 1)} 
										/>
									</div>
								</div>

								<div className='flex items-center justify-center w-[80px] flex-shrink-0'>
									<button 
										className='bg-button w-[72px] rounded-lg px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed' 
										onClick={() => handleRemoveItem(item)}
										disabled={isItemLoading}
									>
										{t('remove')}
									</button>
								</div>
							</li>
						)
					})}
				</ul>
			</div>

			{/* 底部右下角：合计和结算按钮 */}
			<div className='flex justify-end items-center gap-3'>
				<div className='text-primary text-base'>
					{t('total')}<span className='text-gold font-semibold ml-2'>{totalPrice.toFixed(2)} USDT</span>
				</div>
				<BrandBtn 
					onClick={handleCheckout}
					disabled={isCheckoutSubmitting}
					className='flex items-center gap-2'
				>
					{isCheckoutSubmitting && (
						<div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent'></div>
					)}
					{isCheckoutSubmitting ? t('processing') : t('checkout')}
				</BrandBtn>
			</div>

			{/* Clear Confirmation Dialog */}
			{showClearDialog && <ClearWishlistDialog onConfirm={handleConfirmClear} onCancel={handleCancelClear} />}
		</div>
	)
}
