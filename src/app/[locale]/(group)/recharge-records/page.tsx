'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import USDTIcon from '@/svgs/tokens/usdt.svg'
import CopyIcon from '@/svgs/copy-icon.svg'
import LoadMoreBtn from '@/components/load-more-btn'
import { useOrderList, type Order } from '@/requests'
import { useAuth } from '@/hooks/useAuth'
import { ContentLoading } from '@/components/loading-spinner'
import { toast } from '@/components/toast'
import OrderDetailDialog from '@/components/order-detail-dialog'

export default function RechargeRecordsPage() {
  const t = useTranslations()
  const { userInfo } = useAuth()

  const [pageNo, setPageNo] = useState(1)
  const pageSize = 10
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // 获取充值订单列表 (type=2)
  const { data: ordersData, isLoading } = useOrderList({
    userId: userInfo?.userId || 0,
    pageNo,
    pageSize,
    type: 2 // 充值订单
  })

  // 累积所有加载的订单
  const [allRecords, setAllRecords] = useState<Order[]>([])

  // 当获取到新数据时，累积订单
  useMemo(() => {
    if (ordersData && ordersData.length > 0) {
      if (pageNo === 1) {
        setAllRecords(ordersData)
      } else {
        setAllRecords(prev => [...prev, ...ordersData])
      }
    }
  }, [ordersData, pageNo])

  const records = allRecords

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

  // 截取地址显示
  const truncateAddress = (address: string) => {
    if (!address || address.length <= 12) {
      return address || '-'
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // 截取 hash 显示
  const truncateHash = (hash: string) => {
    if (!hash || hash.length <= 12) {
      return hash || '-'
    }
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡，避免触发父元素的点击事件
    if (!text) return
    navigator.clipboard.writeText(text)
    toast.success(t('rechargeRecords.copySuccess'))
  }

  // API 状态: 1=待支付, 2=已支付, 3=订单取消
  const getStatusBadge = (status: number) => {
    const statusConfig = {
      1: {
        text: t('rechargeRecords.statusPending'),
        className: 'bg-yellow-500/20 text-yellow-500'
      },
      2: {
        text: t('rechargeRecords.statusCompleted'),
        className: 'bg-[#6741FF33] text-[#6741FF]'
      },
      3: {
        text: t('rechargeRecords.statusFailed'),
        className: 'bg-red-500/20 text-red-500'
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      text: '-',
      className: 'bg-white/5 text-white/60'
    }
    
    return (
      <div className={`flex items-center justify-center rounded px-1 py-0.5 ${config.className}`}>
        <span className='text-[10px] font-medium leading-[15px]'>{config.text}</span>
      </div>
    )
  }

  const handleLoadMore = () => {
    setPageNo(prev => prev + 1)
  }

  const hasMore = ordersData && ordersData.length === pageSize

  return (
    <div className='flex w-full flex-col gap-3'>
      {/* Header */}
      <div className='flex items-center gap-[10px]'>
        <h2 className='text-base font-medium text-white/80'>{t('rechargeRecords.title')}</h2>
      </div>

      {/* Records Table */}
      <div className='bg-card flex flex-col rounded-xl'>
        {isLoading && records.length === 0 ? (
          <ContentLoading text={t('rechargeRecords.loading')} className='py-10' />
        ) : records.length === 0 ? (
          <div className='flex items-center justify-center py-10'>
            <span className='text-sm text-white/60'>暂无充值记录</span>
          </div>
        ) : (
          records.map((record, index) => (
            <div
              key={record.orderId}
              onClick={() => setSelectedOrder(record)}
              className={`flex cursor-pointer flex-col border-[#0E0E10] p-3 transition-colors hover:bg-white/5 ${
                index !== records.length - 1 ? 'border-b' : ''
              } ${index === 0 ? 'rounded-t-xl' : ''} ${index === records.length - 1 ? 'rounded-b-xl' : ''}`}>
              {/* Amount and Status Row */}
              <div className='flex items-center justify-stretch gap-1 px-4 py-1'>
                <div className='flex items-center gap-1'>
                  <USDTIcon className='h-[24px] w-[24px]' />
                  <span className='text-xs font-medium text-[#E5AD54]'>
                    {record.recvAmount || record.amount || '-'} {record.coinName || 'USDT'}
                  </span>
                </div>
                {getStatusBadge(record.status)}
              </div>

              {/* Details Grid */}
              <div className='flex items-stretch justify-stretch'>
                {/* Time */}
                <div className='flex flex-1 items-center gap-1 px-4 py-2'>
                  <span className='text-xs font-medium text-white/80'>
                    {t('rechargeRecords.time')}：{formatTime(record.createTime)}
                  </span>
                </div>

                {/* Network */}
                <div className='flex flex-1 items-center gap-1 px-4 py-2'>
                  <span className='text-xs font-medium text-white/80'>
                    {t('rechargeRecords.network')}：{record.network || '-'}
                  </span>
                </div>

                {/* Address */}
                <div className='flex flex-1 items-center gap-1 px-4 py-2'>
                  <span className='text-xs font-medium text-white/80'>
                    {t('rechargeRecords.address')}：{truncateAddress(record.toAddress || '')}
                  </span>
                  {record.toAddress && (
                    <button
                      onClick={(e) => handleCopy(record.toAddress || '', e)}
                      className='flex h-4 w-4 items-center justify-center hover:opacity-80'>
                      <CopyIcon className='h-4 w-4 text-white/80' />
                    </button>
                  )}
                </div>

                {/* Hash */}
                <div className='flex flex-1 items-center gap-1 px-4 py-2'>
                  <span className='text-xs font-medium text-white/80'>
                    Hash : {truncateHash(record.hash || '')}
                  </span>
                  {record.hash && (
                    <button
                      onClick={(e) => handleCopy(record.hash || '', e)}
                      className='flex h-4 w-4 items-center justify-center hover:opacity-80'>
                      <CopyIcon className='h-4 w-4 text-white/80' />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className='flex justify-center gap-[10px]'>
          <LoadMoreBtn onClick={handleLoadMore} disabled={isLoading} />
        </div>
      )}

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <OrderDetailDialog
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  )
}

