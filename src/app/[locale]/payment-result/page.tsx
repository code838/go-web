'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import PaymentSuccessCheckSVG from '@/svgs/payment-success-check.svg'
import PaymentSuccessDecorationSVG from '@/svgs/payment-success-decoration.svg'
import HelpIconSVG from '@/svgs/help-icon.svg'
import BrandBtn from '@/components/brand-btn'
import { useAuth } from '@/hooks/useAuth'
import { useOrderDetail } from '@/requests'
import { LoadingSpinner } from '@/components/loading-spinner'
import TooltipSpan from '@/components/tooltip'

export default function PaymentResultPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('paymentResult')
  const { userId } = useAuth()
  
  // 从URL获取订单ID
  const orderId = searchParams.get('orderId') || ''
  
  // 获取订单详情
  const { data: orderDetail, isLoading } = useOrderDetail({
    userId: Number(userId) || 0,
    orderId,
    isOwner: false,
  })

  // 订单号中间省略显示
  const truncateOrderId = (id: string) => {
    if (id.length <= 12) return id
    return `${id.slice(0, 6)}...${id.slice(-6)}`
  }

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <LoadingSpinner />
      </div>
    )
  }

  // 如果没有订单数据，显示错误信息
  if (!orderDetail) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen gap-4'>
        <p className='text-subtitle text-lg'>{t('noOrderData')}</p>
      </div>
    )
  }

  const products = orderDetail.products || []

  return (
    <div className='space-y-6'>
      {/* Title */}
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>{t('title')}</h1>
      </div>

      {/* Success Icon and Message */}
      <div className='flex flex-col items-center gap-6 py-8'>
        <div className='relative flex items-center justify-center'>
          <div className='flex items-center justify-center relative'>
            <img src='/images/pay-success.png' alt='Payment Success Check'/>
          </div>
          {/* <PaymentSuccessDecorationSVG className='absolute -right-3 -top-12' /> */}
        </div>

        <h2 className='text-2xl font-semibold text-center -mt-6'>{t('successTitle')}</h2>
        {/* <p className='text-subtitle text-xl font-semibold text-center'>{t('inviteMessage')}</p> */}
      </div>

      {/* Divider */}
      <div className='h-[1px] bg-border' />

      {/* Orders List */}
      <div className='space-y-6'>
        {products.length > 0 ? (
          products.map((product, idx) => (
            <div key={idx}>
              <div className='flex justify-between items-center gap-4'>
                <div className='flex flex-col items-center space-y-1 flex-1'>
                  <div className='text-secondary text-sm font-semibold'>{t('orderId')}</div>
                  <TooltipSpan 
                    value={orderDetail.orderId} 
                    className='text-subtitle text-base'
                    tooltipWidth={300}
                  >
                    <span>{truncateOrderId(orderDetail.orderId)}</span>
                  </TooltipSpan>
                </div>
                <div className='flex flex-col items-center space-y-1 flex-1'>
                  <div className='text-secondary text-sm font-semibold'>{t('product')}</div>
                  <div className='text-subtitle text-sm font-semibold'>
                    {product.productName} x{product.productNum}
                  </div>
                </div>
                <div className='flex flex-col items-center space-y-1 flex-1'>
                  <div className='text-secondary text-sm font-semibold'>{t('amount')}</div>
                  <div className='text-gold text-sm font-semibold'>{product.productAmount}U</div>
                </div>
                <div className='flex flex-col items-center space-y-1 flex-1'>
                  <div className='text-secondary text-sm font-semibold'>{t('luckyNumber')}</div>
                  {product.coding ? (
                    <TooltipSpan 
                      value={String(product.coding)} 
                      className='text-subtitle text-sm font-semibold max-w-full'
                      tooltipWidth={400}
                    >
                      <span className='block truncate max-w-[150px]'>{String(product.coding)}</span>
                    </TooltipSpan>
                  ) : (
                    <div className='text-subtitle text-sm font-semibold'>-</div>
                  )}
                </div>
              </div>
              {idx < products.length - 1 && <div className='h-[1px] bg-border mt-6' />}
            </div>
          ))
        ) : (
          <div className='text-center text-subtitle py-8'>
            {t('noProducts')}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className='h-[1px] bg-border' />
    </div>
  )
}
