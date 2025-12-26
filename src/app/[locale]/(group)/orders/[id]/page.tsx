'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import ChevronBackSVG from '@/svgs/chevron-back.svg'
import OrderStatusComplete from '@/svgs/order-status-complete.svg'
import OrderStatusCancel from '@/svgs/order-status-cancel.svg'
import OrderStatusPaying from '@/svgs/order-status-paying.svg'
import OrderStatusPending from '@/svgs/order-status-pending.svg'
import { useOrderDetail, useCancelOrder, usePayOrder } from '@/requests'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/loading-spinner'
import TooltipSpan from '@/components/tooltip'
import { IMG_BASE_URL } from '@/consts'
import { toast } from '@/components/toast'
import { useQueryClient } from '@tanstack/react-query'

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const t = useTranslations('orderDetail')
  const { userInfo } = useAuth()
  const queryClient = useQueryClient()
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // 获取订单详情
  const { data: order, isLoading } = useOrderDetail({
    userId: userInfo?.userId || 0,
    "isOwner": false,
    orderId: params.id
  })

  // 取消订单
  const cancelOrderMutation = useCancelOrder()
  
  // 订单支付
  const payOrderMutation = usePayOrder()

  // 截取幸运码显示（中间省略）
  const truncateLuckyCode = (code: string | number, startLen = 8, endLen = 6) => {
    const codeStr = String(code)
    if (codeStr.length <= startLen + endLen) {
      return codeStr
    }
    return `${codeStr.slice(0, startLen)}...${codeStr.slice(-endLen)}`
  }

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}/${month}/${day} ${hours}:${minutes}`
  }

  // 获取状态标签和图标
  const getStatusInfo = (status: number) => {
    const statusMap = {
      1: { label: t('statusPending'), icon: OrderStatusPending },
      2: { label: t('statusCompleted'), icon: OrderStatusComplete },
      3: { label: t('statusCancelled'), icon: OrderStatusCancel }
    }
    return statusMap[status as keyof typeof statusMap] || { label: '-', icon: OrderStatusPending }
  }

  const handleBack = () => {
    router.back()
  }

  const handleViewHelpers = () => {
    // TODO: Implement view helpers functionality
  }

  const handleCopyHelpLink = () => {
    // TODO: Implement copy help link functionality
  }

  // 处理取消订单
  const handleCancelOrder = async () => {
    if (!userInfo?.userId || !params.id) return
    
    try {
      await cancelOrderMutation.mutateAsync({
        userId: userInfo.userId,
        orderId: params.id
      })
      
      toast.success(t('cancelSuccess'))
      setShowCancelDialog(false)
      
      // 刷新订单详情
      queryClient.invalidateQueries({ queryKey: ['order-detail', userInfo.userId, params.id, false] })
      
      // 延迟返回上一页
      setTimeout(() => {
        router.back()
      }, 1000)
    } catch (err: any) {
      toast.error(err?.response?.data?.msg || err?.message || t('cancelFailed'))
    }
  }

  // 处理去支付
  const handlePayOrder = async () => {
    if (!userInfo?.userId || !params.id) return
    
    try {
      await payOrderMutation.mutateAsync({
        userId: userInfo.userId,
        orderId: params.id
      })
      
      toast.success(t('paySuccess'))
      
      // 刷新订单详情
      queryClient.invalidateQueries({ queryKey: ['order-detail', userInfo.userId, params.id, false] })
    } catch (err: any) {
      toast.error(err?.response?.data?.msg || err?.message || t('payFailed'))
    }
  }

  if (isLoading || !order) {
    return (
      <div className='flex w-full items-center justify-center min-h-[500px]'>
        <LoadingSpinner size='lg' text={t('loading')} />
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const StatusIcon = statusInfo.icon
  const products = order.products || []
  
  // 计算总商品数量
  const totalProductQuantity = products.reduce((sum, product) => sum + Number(product.productAmount || 0), 0)

  return (
    <div className='flex w-full flex-col gap-6'>
      {/* Back Button */}
      <button
        onClick={handleBack}
        className='flex w-fit items-center gap-1 rounded-lg bg-[#303030] px-3 py-1 hover:bg-[#404040]'>
        <ChevronBackSVG className='h-4 w-4 mt-1.5' />
        <span className='text-xs font-medium text-white'>{t('back')}</span>
      </button>

      {/* Header with Status */}
      <div className='flex items-center justify-between gap-1'>
        <h2 className='text-2xl font-semibold text-white'>{t('title')}</h2>
        <div className='flex items-center gap-1'>
          <StatusIcon />
          <span className='text-xs font-semibold text-white'>{statusInfo.label}</span>
        </div>
      </div>

      {/* Order Details Card */}
      <div className='flex flex-col gap-3 rounded-xl border border-[#303030] p-8'>
        {/* Row 1 */}
        <div className='flex items-stretch justify-stretch gap-[10px]'>
          <div className='flex-1'>
            <span className='text-base text-white/80'>
              {t('orderId')}：{order.orderId}
            </span>
          </div>
          <div className='flex-1'>
            <span className='text-base text-white/80'>
              {t('orderTime')}：{formatTime(order.createTime)}
            </span>
          </div>
        </div>

        {/* Row 2 */}
        <div className='flex items-stretch justify-stretch gap-3'>
          <div className='flex-1'>
            <span className='text-base text-white/80'>
              {t('productName')}：{products[0]?.productName || '-'}
            </span>
          </div>
          <div className='flex-1'>
            <span className='text-base text-white/80'>
              {t('productQuantity')}：x{totalProductQuantity}
            </span>
          </div>
        </div>

        {/* Row 3 */}
        <div className='flex items-stretch justify-stretch gap-3'>
          <div className='flex-1'>
            <span className='text-base text-white/80'>
              {t('productPeriod')}：{products[0]?.serialNumber ? t('periodNumber', { number: products[0].serialNumber }) : '-'}
            </span>
          </div>
          <div className='flex-1'>
            <span className='text-base text-white/80'>
              {t('productStatus')}：{statusInfo.label}
            </span>
          </div>
        </div>

        {/* Row 4 - Total */}
        <div className='flex items-stretch justify-stretch gap-3'>
          <div className='flex-1'>
            <span className='text-base text-white'>
              {t('totalAmount')}：<span className='text-gold'>{order.amount} USDT</span>
            </span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      {products.map((product, index) => (
        <div key={index} className='bg-card flex items-center justify-between gap-3 rounded-3xl border p-6 font-medium'>
          {/* Product Image & Info */}
          <div className='flex flex-1 items-center gap-3'>
            <figure className='h-[52px] w-[52px] rounded-full bg-gradient-to-b from-[#8A8A8A] to-[#5A5A5A] p-0.2'>
              {product.logo ? (
                <img 
                  src={`${IMG_BASE_URL}${product.logo}`} 
                  className='h-full w-full rounded-full object-cover' 
                  alt={product.productName} 
                />
              ) : (
                <img 
                  src='/images/examples/eth.png' 
                  className='h-full w-full rounded-full object-cover' 
                  alt={product.productName} 
                />
              )}
            </figure>
            <div className='w-[200px]'>
              <h4 className='text-primary text-sm'>（{t('periodNumber', {number: product.serialNumber})}）{product.productName}</h4>
            </div>
          </div>

          {/* Price */}
          <div className='flex-1 flex flex-col items-center justify-center'>
            <div className='text-secondary text-xs'>{t('price')}</div>
            <div className='text-gold text-sm'>{product.price} U</div>
          </div>

          {/* Product Value */}
          <div className='flex-1 flex flex-col items-center justify-center'>
            <div className='text-secondary text-xs'>{t('productValue')}</div>
            <div className='text-brand-2 text-sm'>{product.productValue}</div>
          </div>

          {/* Quantity */}
          <div className='flex-1 flex flex-col items-center justify-center'>
            <div className='text-secondary text-xs'>{t('quantity')}</div>
            <div className='text-primary text-sm'>{product.productAmount}</div>
          </div>

          {/* Lucky Code */}
          <div className='flex-1 flex flex-col items-center justify-center'>
            <div className='text-secondary text-xs'>{t('luckyCode')}</div>
            {product.coding ? (
              <TooltipSpan value={String(product.coding)} className='text-sm font-medium text-[#67E8F2]'>
                {truncateLuckyCode(product.coding)}
              </TooltipSpan>
            ) : (
              <div className='text-primary text-sm'>-</div>
            )}
          </div>
        </div>
      ))}

      {/* 待支付订单底部按钮 */}
      {order.status === 1 && (
        <div className='flex gap-4 pt-4 justify-end'>
          <button
            onClick={() => setShowCancelDialog(true)}
            disabled={cancelOrderMutation.isPending}
            className='w-[140px] h-9 rounded-xl border border-white/10 bg-white/5 text-white text-sm font-medium transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {cancelOrderMutation.isPending ? t('cancelling') : t('cancelOrder')}
          </button>
          <button
            onClick={handlePayOrder}
            disabled={payOrderMutation.isPending}
            className='w-[140px] h-9 rounded-xl bg-gradient-to-r from-[#6741FF] to-[#9D4FFF] text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {payOrderMutation.isPending ? t('paying') : t('goPay')}
          </button>
        </div>
      )}

      {/* 取消订单确认对话框 */}
      {showCancelDialog && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4'>
          <div className='w-full max-w-md bg-[#1A1A1C] rounded-2xl p-6 space-y-4'>
            <h3 className='text-lg font-medium text-white text-center'>{t('confirmCancel')}</h3>
            <p className='text-sm text-white/60 text-center'>{t('cancelConfirmMessage')}</p>
            <div className='flex gap-3 pt-2'>
              <button
                onClick={() => setShowCancelDialog(false)}
                disabled={cancelOrderMutation.isPending}
                className='flex-1 h-11 rounded-xl border border-white/10 bg-white/5 text-white font-medium transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelOrderMutation.isPending}
                className='flex-1 h-11 rounded-xl bg-gradient-to-r from-[#6741FF] to-[#9D4FFF] text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {cancelOrderMutation.isPending ? t('cancelling') : t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

