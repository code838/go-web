'use client'

import { useState } from 'react'
import DialogShell from './dialog-shell'
import { useTranslations } from 'next-intl'
import { Order } from '@/types'
import UsdtIcon from '@/svgs/tokens/usdt.svg'
import BtcIcon from '@/svgs/tokens/BTC.svg'
import BtcbIcon from '@/svgs/tokens/BTCB.svg'
import EthIcon from '@/svgs/tokens/eth.svg'
import BnbIcon from '@/svgs/tokens/BNB.svg'
import TrxIcon from '@/svgs/tokens/TRX.svg'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface OrderDetailDialogProps {
  order: Order
  onClose: () => void
}

export default function OrderDetailDialog({ order, onClose }: OrderDetailDialogProps) {
  const t = useTranslations()
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const [copiedField, setCopiedField] = useState<string | null>(null)

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

  // 获取订单类型标签
  const getTypeLabel = (type: number) => {
    const typeMap: Record<number, string> = {
      0: t('walletDetails.typeLucky'),
      1: t('walletDetails.typePurchase'),
      2: t('walletDetails.typeRecharge'),
      3: t('walletDetails.typeWithdraw'),
      4: t('walletDetails.typeSwap'),
      5: t('walletDetails.typeCommission')
    }
    return typeMap[type] || '-'
  }

  // 获取状态文本和样式
  const getStatusInfo = (status: number) => {
    const statusMap: Record<number, { text: string; className: string }> = {
      1: { text: t('orderDetail.statusPending'), className: 'text-yellow-500' },
      2: { text: t('orderDetail.statusCompleted'), className: 'text-[#1AF578]' },
      3: { text: t('orderDetail.statusCancelled'), className: 'text-[#F75353]' }
    }
    return statusMap[status] || { text: t('orderDetail.statusUnknown'), className: 'text-white/60' }
  }

  // 截取地址显示
  const truncateAddress = (address: string, startLen = 6, endLen = 4) => {
    if (!address || address.length <= startLen + endLen) {
      return address || '-'
    }
    return `${address.slice(0, startLen)}...${address.slice(-endLen)}`
  }

  // 复制到剪贴板
  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const statusInfo = getStatusInfo(order.status)

  // 币种图标映射
  const getCoinIcon = (coinName?: string): React.ReactElement | null => {
    if (!coinName) return null
    
    // 积分不显示图标
    if (coinName === '积分' || coinName === 'Points') {
      return null
    }
    
    const coinIconMap: Record<string, React.ReactElement> = {
      'USDT': <UsdtIcon className='h-5 w-5' />,
      'BTC': <BtcIcon className='h-5 w-5' />,
      'BTCB': <BtcbIcon className='h-5 w-5' />,
      'ETH': <EthIcon className='h-5 w-5' />,
      'BNB': <BnbIcon className='h-5 w-5' />,
      'TRX': <TrxIcon className='h-5 w-5' />
    }
    
    return coinIconMap[coinName.toUpperCase()] || <UsdtIcon className='h-5 w-5' />
  }

  // 复制按钮组件
  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <div className='flex items-center gap-2'>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleCopy(text, field)
        }}
        className='flex h-6 w-6 items-center justify-center rounded hover:bg-white/10'>
        <svg className='h-4 w-4 text-white/60' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24162C20 6.71089 19.7893 6.20161 19.4142 5.82654L16.1716 2.58397C15.7965 2.20891 15.2872 1.99817 14.7564 1.99817H10C8.89543 1.99817 8 2.89361 8 3.99817V4ZM8 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H14'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </button>
      {copiedField === field && (
        <span className='text-xs text-[#1AF578]'>{t('orderDetail.copied')}</span>
      )}
    </div>
  )

  return (
    <DialogShell title={t('orderDetail.title')} close={onClose} mobilePosition={isMobile ? 'bottom' : 'center'}>
      <div className='flex max-h-[70vh] flex-col gap-4 overflow-y-auto'>
        {/* 状态 */}
        <div className='flex items-center justify-between'>
          <span className='text-sm text-white/60'>{t('orderDetail.status')}</span>
          <div className='flex items-center gap-2'>
            <div className={`h-2 w-2 rounded-full ${statusInfo.className.replace('text-', 'bg-')}`} />
            <span className={`text-sm font-medium ${statusInfo.className}`}>{statusInfo.text}</span>
          </div>
        </div>

        {/* 时间 */}
        <div className='flex items-center justify-between'>
          <span className='text-sm text-white/60'>{t('orderDetail.time')}</span>
          <span className='text-sm font-medium text-white/80'>{formatTime(order.createTime)}</span>
        </div>

        {/* 订单类型 */}
        <div className='flex items-center justify-between'>
          <span className='text-sm text-white/60'>{t('orderDetail.type')}</span>
          <span className='text-sm font-medium text-white/80'>{getTypeLabel(order.type)}</span>
        </div>

        {/* 币种 - 仅在有币种信息时显示 */}
        {order.coinName && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-white/60'>{t('orderDetail.coinType')}</span>
            <div className='flex items-center gap-2'>
              {getCoinIcon(order.coinName)}
              <span className='text-sm font-medium text-white/80'>{order.coinName}</span>
            </div>
          </div>
        )}

        {/* 金额 */}
        {(order.amount || (order.type === 4 && order.num)) && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-white/60'>{t('orderDetail.amount')}</span>
            <span className='text-sm font-medium text-white/80'>
              {order.type === 4 ? order.num : order.amount} {order.coinName || 'USDT'}
            </span>
          </div>
        )}

        {/* 到账金额 - 仅在有到账金额时显示 */}
        {order.recvAmount && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-white/60'>{t('orderDetail.recvAmount')}</span>
            <span className='text-sm font-medium text-[#1AF578]'>
              {order.recvAmount} {order.toAssert || order.coinName || 'USDT'}
            </span>
          </div>
        )}

        {/* 手续费 - 仅在有手续费时显示 */}
        {order.fee && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-white/60'>{t('orderDetail.fee')}</span>
            <span className='text-sm font-medium text-white/80'>
              {order.fee} USDT
            </span>
          </div>
        )}

        {/* 闪兑目标币种 - 仅闪兑订单显示 */}
        {order.type === 4 && order.toAssert && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-white/60'>{t('orderDetail.toAsset')}</span>
            <span className='text-sm font-medium text-white/80'>{order.toAssert}</span>
          </div>
        )}

        {/* 网络 - 仅在有网络信息时显示 */}
        {order.network && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-white/60'>{t('orderDetail.network')}</span>
            <span className='text-sm font-medium text-white/80'>{order.network}</span>
          </div>
        )}

        {/* 发送地址 - 仅在有发送地址时显示 */}
        {order.fromAddress && (
          <div className='flex items-start justify-between gap-2'>
            <span className='text-sm text-white/60'>{t('orderDetail.fromAddress')}</span>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium text-white/80'>{truncateAddress(order.fromAddress)}</span>
              <CopyButton text={order.fromAddress} field='fromAddress' />
            </div>
          </div>
        )}

        {/* 接收地址 - 仅在有接收地址时显示 */}
        {order.toAddress && (
          <div className='flex items-start justify-between gap-2'>
            <span className='text-sm text-white/60'>{t('orderDetail.toAddress')}</span>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium text-white/80'>{truncateAddress(order.toAddress)}</span>
              <CopyButton text={order.toAddress} field='toAddress' />
            </div>
          </div>
        )}

        {/* Hash - 仅在有Hash信息时显示 */}
        {order.hash && (
          <div className='flex items-start justify-between gap-2'>
            <span className='text-sm text-white/60'>Hash</span>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium text-white/80'>{truncateAddress(order.hash, 8, 6)}</span>
              <CopyButton text={order.hash} field='hash' />
            </div>
          </div>
        )}

        {/* 返佣信息 - 仅返佣订单显示 */}
        {order.type === 5 && order.inviteUserName && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-white/60'>{t('orderDetail.inviteUser')}</span>
            <span className='text-sm font-medium text-white/80'>{order.inviteUserName}</span>
          </div>
        )}

        {/* 商品信息 - 仅云购/幸运订单显示 */}
        {(order.type === 0 || order.type === 1) && order.productName && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-white/60'>{t('orderDetail.productName')}</span>
            <span className='text-sm font-medium text-white/80'>{order.productName}</span>
          </div>
        )}

        {/* 商品价格 - 仅云购/幸运订单显示 */}
        {(order.type === 0 || order.type === 1) && order.price && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-white/60'>{t('orderDetail.productPrice')}</span>
            <span className='text-sm font-medium text-white/80'>{order.price} USDT</span>
          </div>
        )}

        {/* 购买数量 - 仅云购/幸运订单显示 */}
        {(order.type === 0 || order.type === 1) && order.num && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-white/60'>{t('orderDetail.quantity')}</span>
            <span className='text-sm font-medium text-white/80'>{order.num}</span>
          </div>
        )}

        {/* 幸运编码 - 仅云购/幸运订单显示 */}
        {(order.type === 0 || order.type === 1) && order.coding !== undefined && order.coding !== null && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-white/60'>{t('orderDetail.luckyCode')}</span>
            <span className='text-sm font-medium text-white/80'>{order.coding}</span>
          </div>
        )}

        {/* 订单ID - 放在最后 */}
        <div className='flex items-start justify-between gap-2'>
          <span className='text-sm text-white/60'>{t('orderDetail.orderId')}</span>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium text-white/80'>{truncateAddress(order.orderId, 8, 6)}</span>
            <CopyButton text={order.orderId} field='orderId' />
          </div>
        </div>
      </div>
    </DialogShell>
  )
}
