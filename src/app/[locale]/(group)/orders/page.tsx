'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import LoadMoreBtn from '@/components/load-more-btn'
import TooltipSpan from '@/components/tooltip'
import { useOrderList, type Order } from '@/requests'
import { useAuth } from '@/hooks/useAuth'
import { ContentLoading } from '@/components/loading-spinner'
import { IMG_BASE_URL } from '@/consts'

export default function OrdersPage() {
  const t = useTranslations('orders')
  const td = useTranslations('orderDetail')
  const router = useRouter()
  const { userInfo } = useAuth()

  const [pageNo, setPageNo] = useState(1)
  const pageSize = 10

  // 获取云购订单列表 (type=1)
  const { data: ordersData, isLoading } = useOrderList({
    userId: userInfo?.userId || 0,
    pageNo,
    pageSize,
    type: 1 // 云购订单
  })

  // 累积所有加载的订单
  const [allOrders, setAllOrders] = useState<Order[]>([])

  // 当获取到新数据时，累积订单
  useMemo(() => {
    if (ordersData && ordersData.length > 0) {
      if (pageNo === 1) {
        setAllOrders(ordersData)
      } else {
        setAllOrders(prev => [...prev, ...ordersData])
      }
    }
  }, [ordersData, pageNo])

  const orders = allOrders

  // 截取订单号显示（中间省略）
  const truncateOrderId = (orderId: string, startLen = 8, endLen = 6) => {
    if (orderId.length <= startLen + endLen) {
      return orderId
    }
    return `${orderId.slice(0, startLen)}...${orderId.slice(-endLen)}`
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

  // 格式化时间（分开显示日期和时间）
  const formatTimeDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  }

  const formatTimeHour = (timestamp: number) => {
    const date = new Date(timestamp)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // 获取状态标签 (API: 1=待支付, 2=已支付, 3=订单取消)
  const getStatusLabel = (status: number) => {
    const statusMap = {
      1: { label: t('statusPending'), color: 'text-white/80' },
      2: { label: t('statusCompleted'), color: 'text-white/80' },
      3: { label: t('statusCancelled'), color: 'text-red-500' }
    }
    return statusMap[status as keyof typeof statusMap] || { label: '-', color: 'text-white/80' }
  }

  const handleRowClick = (orderId: string) => {
    router.push(`/orders/${orderId}`)
  }

  const handleLoadMore = () => {
    setPageNo(prev => prev + 1)
  }

  const hasMore = ordersData && ordersData.length === pageSize

  return (
    <div className='flex w-full flex-col gap-3'>
      {/* Header */}
      <div className='flex items-center gap-1'>
        <h2 className='text-base font-medium text-white/80'>{t('title')}</h2>
      </div>

      {/* Table Container */}
      <div className='flex flex-col gap-3'>
        {/* Table */}
        <div className='bg-card flex flex-col rounded-xl overflow-x-auto'>
          {/* Table Header */}
          <div className='grid grid-cols-[minmax(120px,2fr)_minmax(60px,1fr)_minmax(60px,1fr)_minmax(45px,0.8fr)_minmax(55px,0.8fr)_minmax(65px,1fr)_minmax(75px,1fr)] xl:grid-cols-[240px_1fr_1fr_1fr_1fr_140px_1.2fr] rounded-t-xl bg-white/5'>
            <div className='flex items-center justify-center px-1.5 xl:px-4 py-2'>
              <div className='text-secondary text-xs xl:text-sm font-medium text-center break-words whitespace-normal'>{t('product')}</div>
            </div>
            <div className='flex items-center justify-center px-1.5 xl:px-4 py-2'>
              <div className='text-secondary text-xs xl:text-sm font-medium text-center break-words whitespace-normal'>{t('productValue')}</div>
            </div>
            <div className='flex items-center justify-center px-1.5 xl:px-4 py-2'>
              <div className='text-secondary text-xs xl:text-sm font-medium text-center break-words whitespace-normal'>{t('productPrice')}</div>
            </div>
            <div className='flex items-center justify-center px-1.5 xl:px-4 py-2'>
              <div className='text-secondary text-xs xl:text-sm font-medium text-center break-words whitespace-normal'>{t('quantity')}</div>
            </div>
            <div className='flex items-center justify-center px-1.5 xl:px-4 py-2'>
              <div className='text-secondary text-xs xl:text-sm font-medium text-center break-words whitespace-normal'>{t('status')}</div>
            </div>
            <div className='flex items-center justify-center px-1.5 xl:px-4 py-2'>
              <div className='text-secondary text-xs xl:text-sm font-medium text-center break-words whitespace-normal'>{t('time')}</div>
            </div>
            <div className='flex items-center justify-center px-1.5 xl:px-4 py-2'>
              <div className='text-secondary text-xs xl:text-sm font-medium text-center break-words whitespace-normal'>{t('luckyCode')}</div>
            </div>
          </div>

          {/* Table Body */}
          {isLoading && orders.length === 0 ? (
            <ContentLoading text={t('loading')} className='py-10' />
          ) : orders.length === 0 ? (
            <div className='flex items-center justify-center py-10'>
              <span className='text-sm text-white/60'>{t('noOrders')}</span>
            </div>
          ) : (
            orders.map((order, index) => {
              // 获取第一个商品信息
              const firstProduct = order.products?.[0]
              const hasMultipleProducts = order.products && order.products.length > 1
              
              return (
                <div
                  key={order.orderId}
                  onClick={() => handleRowClick(order.orderId)}
                  className={`grid grid-cols-[minmax(120px,2fr)_minmax(60px,1fr)_minmax(60px,1fr)_minmax(45px,0.8fr)_minmax(55px,0.8fr)_minmax(65px,1fr)_minmax(75px,1fr)] xl:grid-cols-[240px_1fr_1fr_1fr_1fr_140px_1.2fr] cursor-pointer border-[#0E0E10] ${
                    index !== orders.length - 1 ? 'border-b' : ''
                  } ${index === orders.length - 1 ? 'rounded-b-xl' : ''} hover:bg-white/5`}>

                  {/* Product */}
                  <div className='flex items-center justify-center px-1.5 xl:px-4 py-3'>
                    <div className='flex items-center justify-center gap-0.5 w-full'>
                      <div className='relative flex-shrink-0'>
                        <img
                          src={firstProduct?.logo ? `${IMG_BASE_URL}${firstProduct.logo}` : '/images/examples/eth.png'}
                          alt=''
                          className='h-5 w-5 xl:h-6 xl:w-6 rounded-full'
                        />
                        {hasMultipleProducts && (
                          <div className='absolute -right-1 -top-1 flex h-4 w-4 xl:h-5 xl:w-5 items-center justify-center rounded-full bg-brand text-[9px] xl:text-[10px] font-semibold text-white'>
                            +{order.products!.length - 1}
                          </div>
                        )}
                      </div>
                      <TooltipSpan 
                        value={`（${td('periodNumber', {number: firstProduct?.serialNumber||0})}）${firstProduct?.productName || '-'}`}
                        className='text-sm font-medium text-white/80 text-center break-words line-clamp-2 leading-tight min-w-0 whitespace-normal'
                        normalWord>
                        （{td('periodNumber', {number: firstProduct?.serialNumber||0})}）{firstProduct?.productName || '-'}
                      </TooltipSpan>
                    </div>
                  </div>

                  {/* Product Value */}
                  <div className='flex items-center justify-center px-1.5 xl:px-4 py-3'>
                    <div className='text-sm font-medium text-[#1AF578] text-center break-words leading-tight whitespace-normal'>
                      {firstProduct?.productValue || '-'}
                    </div>
                  </div>

                  {/* Product Price */}
                  <div className='flex items-center justify-center px-1.5 xl:px-4 py-3'>
                    <div className='text-sm font-medium text-[#E5AD54] text-center break-words leading-tight whitespace-normal'>
                      {firstProduct?.price || '-'} U
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className='flex items-center justify-center px-1.5 xl:px-4 py-3'>
                    <div className='text-sm font-medium text-white/80 text-center break-words leading-tight whitespace-normal'>
                      x {firstProduct?.productAmount || 0}
                    </div>
                  </div>

                  {/* Status */}
                  <div className='flex items-center justify-center px-1.5 xl:px-4 py-3'>
                    <div className={`text-sm font-medium text-center break-words leading-tight whitespace-normal ${getStatusLabel(order.status).color}`}>
                      {getStatusLabel(order.status).label}
                    </div>
                  </div>

                  {/* Time */}
                  <div className='flex items-center justify-center px-1.5 xl:px-4 py-3'>
                    {/* 大屏显示一行 */}
                    <div className='hidden xl:block text-xs font-medium text-white/80 text-center whitespace-nowrap leading-tight'>
                      {formatTime(order.createTime)}
                    </div>
                    {/* 小屏显示两行 */}
                    <div className='flex xl:hidden flex-col items-center justify-center gap-0.5'>
                      <div className='text-xs font-medium text-white/80 text-center whitespace-nowrap leading-tight'>{formatTimeDate(order.createTime)}</div>
                      <div className='text-xs font-medium text-white/80 text-center whitespace-nowrap leading-tight'>{formatTimeHour(order.createTime)}</div>
                    </div>
                  </div>

                  {/* Lucky Code */}
                  <div className='flex items-center justify-center px-1.5 xl:px-4 py-3'>
                    {firstProduct?.coding ? (
                      <TooltipSpan value={String(firstProduct.coding)} className='text-xs font-medium text-[#67E8F2] text-center break-all leading-tight block whitespace-normal'>
                        {truncateOrderId(String(firstProduct.coding), 6, 4)}
                      </TooltipSpan>
                    ) : (
                      <div className='text-xs font-medium text-secondary text-center'>-</div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className='flex justify-center gap-[10px]'>
            <LoadMoreBtn onClick={handleLoadMore} disabled={isLoading} />
          </div>
        )}
      </div>
    </div>
  )
}

