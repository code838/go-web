'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useOrderList, type Order } from '@/requests'
import { ContentLoading } from '@/components/loading-spinner'
import ChevronBackIcon from '@/svgs/chevron-back.svg'

import Image from 'next/image'

type RecordType = 'all' | 'recharge' | 'withdraw' | 'swap' | 'shopping' | 'winning' | 'commission' | 'freeCoins'

export default function RecordsPage() {
  const t = useTranslations('records')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userInfo } = useAuth()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<RecordType>('all')
  const [pageNo, setPageNo] = useState(1)
  const pageSize = 20
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  // 从URL参数获取初始tab
  useEffect(() => {
    const tabParam = searchParams.get('tab') as RecordType
    if (tabParam && ['all', 'recharge', 'withdraw', 'swap', 'shopping', 'winning', 'commission', 'freeCoins'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // 当activeTab改变时，自动滚动到对应的tab
  useEffect(() => {
    const tabElement = tabRefs.current[activeTab]
    const container = tabsContainerRef.current
    
    if (tabElement && container) {
      // 使用setTimeout确保DOM已更新
      setTimeout(() => {
        const tabLeft = tabElement.offsetLeft
        const tabWidth = tabElement.offsetWidth
        const containerWidth = container.offsetWidth
        const scrollLeft = tabLeft - (containerWidth / 2) + (tabWidth / 2)
        
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        })
      }, 100)
    }
  }, [activeTab])

  // 获取订单列表
  const { data: ordersData, isLoading } = useOrderList({
    userId: userInfo?.userId || 0,
    pageNo,
    pageSize,
    type: activeTab === 'all' ? undefined : getOrderType(activeTab)
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
    } else if (pageNo === 1) {
      // 当第一页没有数据时，清空记录
      setAllRecords([])
    }
  }, [ordersData, pageNo])

  // 根据记录类型获取订单类型
  function getOrderType(recordType: RecordType): number | undefined {
    switch (recordType) {
      case 'recharge': return 2
      case 'withdraw': return 3
      case 'swap': return 4
      case 'shopping': return 1
      case 'winning': return 0
      case 'commission': return 5
      case 'freeCoins': return 6
      default: return undefined
    }
  }

  // 获取记录图片
  function getRecordImage(order: Order) {
    switch (order.type) {
      case 1: return '/images/order-item-cloud.png'
      case 2: return '/images/order-item-recharge.png'
      case 3: return '/images/order-item-withdraw.png'
      case 4: return '/images/order-item-swap.png'
      case 0: return '/images/order-item-winner.png'
      case 5: return '/images/order-item-money.png'
      case 6: return '/images/order-item-coin.png'
      default:
        return '/images/order-item-recharge.png'
    }
  }

  // 获取记录类型名称
  function getRecordTypeName(order: Order) {
    switch (order.type) {
      case 1: return t('shopping')
      case 2: return t('recharge')
      case 3: return t('withdraw')
      case 4: return t('swap')
      case 0: return t('winning')
      case 5: return t('commission')
      case 6: return t('freeCoins')
      default: return t('other')
    }
  }

  // 获取状态文本
  function getStatusText(status: number | undefined | null) {
    switch (status) {
      case 1: return t('statusPending')
      case 2: return t('statusCompleted')
      case 3: return t('statusCancelled')
      default: return t('statusUnknown')
    }
  }

  // 获取状态样式
  function getStatusColor(status: number | undefined | null) {
    switch (status) {
      case 0: return 'text-yellow-400'
      case 1: return 'text-[#6741FF]'
      case 2: return 'text-red-400'
      default: return 'text-[#6E6E70]'
    }
  }

  // 格式化时间
  const formatTime = (timestamp: number | undefined | null) => {
    const date = new Date(timestamp || 0)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}/${month}/${day} ${hours}:${minutes}`
  }

  // 格式化金额
  const formatAmount = (amount: string | number | undefined | null, type: number, coinName?: string) => {
    const numAmount = Number(amount) || 0
    const prefix = type === 3 ? '-' : '+' // 提现为负，其他为正
    const currency = coinName || 'USDT'
    return `${prefix}${numAmount.toFixed(4)} ${currency}`
  }

  // 按月份分组记录
  const groupedRecords = useMemo(() => {
    if (!allRecords.length) return {}
    
    return allRecords.reduce((acc: Record<string, Order[]>, record) => {
      const date = new Date(record.createTime || 0)
      const monthKey = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!acc[monthKey]) {
        acc[monthKey] = []
      }
      acc[monthKey].push(record)
      
      return acc
    }, {})
  }, [allRecords])

  const tabs = [
    { key: 'all' as RecordType, label: t('all') },
    { key: 'recharge' as RecordType, label: t('recharge') },
    { key: 'withdraw' as RecordType, label: t('withdraw') },
    { key: 'swap' as RecordType, label: t('swap') },
    { key: 'shopping' as RecordType, label: t('shopping') },
    { key: 'winning' as RecordType, label: t('winning') },
    { key: 'commission' as RecordType, label: t('commission') },
    { key: 'freeCoins' as RecordType, label: t('freeCoins') }
  ]

  // 只在手机模式下显示
  if (!isMobile) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <p className='text-white/60'>{t('mobileOnly')}</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col min-h-screen'>
      {/* Header */}
      <div className='flex items-center gap-2 pb-4'>
        <button
          onClick={() => router.back()}
          className='flex h-7 w-7 items-center justify-center rounded-lg bg-white/5'>
          <ChevronBackIcon />
        </button>
        <h2 className='flex-1 text-center text-base font-semibold text-white/80 pr-9'>{t('title')}</h2>
      </div>

      {/* Tabs */}
      <div ref={tabsContainerRef} className='flex overflow-x-auto scrollbar-none px-4'>
        <div className='flex gap-6 min-w-max'>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[tab.key] = el
              }}
              onClick={() => {
                setActiveTab(tab.key)
                setPageNo(1)
                setAllRecords([]) // 切换tab时清空累积记录
                // 更新 URL 参数，使用 replace 避免增加历史记录
                router.replace(`/records?tab=${tab.key}`, { scroll: false })
              }}
              className={`relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'text-white'
                  : 'text-[#6E6E70] hover:text-white/80'
              }`}>
              {tab.label}
              {/* Active underline */}
              {activeTab === tab.key && (
                <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full' />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 py-4'>
        {isLoading ? (
          <div className='flex justify-center py-8'>
            <ContentLoading />
          </div>
        ) : Object.keys(groupedRecords).length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12'>
            <div className='w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4'>
              <svg className='w-8 h-8 text-white/40' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
              </svg>
            </div>
            <p className='text-white/60 text-sm'>{t('noRecords')}</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {Object.entries(groupedRecords)
              .sort(([a], [b]) => b.localeCompare(a)) // 按月份倒序
              .map(([month, records]) => (
                <div key={month} className='space-y-3'>
                  {/* Month Header */}
                  <div className='text-sm font-medium text-white/80 px-2'>
                    {month}
                  </div>
                  
                  {/* Records List */}
                  <div className='space-y-3 px-3'>
                    {records.map((record) => {
                      const recordImageSrc = getRecordImage(record)
                      const recordTypeName = getRecordTypeName(record)
                      
                      return (
                        <div
                          key={record.orderId}
                          onClick={() => router.push(`/order-details/${record.orderId}?type=${record.type}&from=records&tab=${activeTab}`)}
                          className='flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors'>
                          {/* Icon */}
                          <div className='flex h-8 w-8 items-center justify-center'>
                            <Image 
                              src={recordImageSrc}
                              alt={recordTypeName}
                              width={32}
                              height={32}
                              className='object-contain'
                            />
                          </div>
                          
                          {/* Content */}
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center justify-between'>
                              <div className='flex flex-col'>
                                <p className='text-sm font-medium text-white'>
                                  {recordTypeName}
                                </p>
                                <p className='text-xs text-[#6E6E70]'>
                                  {formatTime(record.createTime)}
                                </p>
                              </div>
                              
                              <div className='flex flex-col items-end'>
                                <p className='text-sm font-medium text-white'>
                                  {formatAmount(record.amount, record.type, record.coinName)}
                                </p>
                                <p className={`text-xs ${getStatusColor(record.status)}`}>
                                  {getStatusText(record.status)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Load More */}
      {ordersData && ordersData.length === pageSize && (
        <div className='px-4 pb-4'>
          <button
            onClick={() => setPageNo(prev => prev + 1)}
            disabled={isLoading}
            className='w-full py-3 text-sm font-medium text-white/80 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50'>
            {isLoading ? t('loading') : t('loadMore')}
          </button>
        </div>
      )}

      {/* Bottom Safe Area */}
      <div className='h-24' />
    </div>
  )
}
