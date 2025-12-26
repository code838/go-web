'use client'

import { Link } from '@/i18n/navigation'
import USDTIcon from '@/svgs/tokens/usdt.svg'
import BTCIcon from '@/svgs/tokens/BTC.svg'
import BTCBIcon from '@/svgs/tokens/BTCB.svg'
import BNBIcon from '@/svgs/tokens/BNB.svg'
import ETHIcon from '@/svgs/tokens/eth.svg'
import TRXIcon from '@/svgs/tokens/TRX.svg'
import StarIcon from '@/svgs/stars.svg'
import WalletIcon from '@/svgs/wallet-icon.svg'
import RechargeIcon from '@/svgs/recharge-icon.svg'
import WithdrawIcon from '@/svgs/withdraw-icon.svg'
import SwapIcon from '@/svgs/swap-icon.svg'
import ChevronRightIcon from '@/svgs/chevron-right.svg'
import AddressManagementIcon from '@/svgs/address-management.svg'
import WalletAvatar from '@/svgs/wallet-avatar.svg'
import CoinRecIcon from '@/svgs/mine/coin-rec.svg'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { IMG_BASE_URL } from '@/consts'
import { useCoins } from '@/requests'

// 币种图标映射
const coinIcons: Record<string, any> = {
  'USDT': USDTIcon,
  'BTC': BTCIcon,
  'BTCB': BTCBIcon,
  'BNB': BNBIcon,
  'ETH': ETHIcon,
  'TRX': TRXIcon,
}

export default function WalletPage() {
  const t = useTranslations()
  const { userInfo } = useAuth()
  const { data: coins = [] } = useCoins()

  // 获取USDT余额
  const usdtCoin = userInfo?.coinsBalance?.find(coin => coin.coinName === 'USDT')
  const usdtBalance = usdtCoin?.balance || '0'
  
  // 获取积分
  const points = userInfo?.points || '0'
  
  // 获取用户昵称和ID
  const nickName = userInfo?.nickName || 'User'
  const userId = userInfo?.userId ? `ID: ${userInfo.userId}` : '#0'

  // 获取币种图标
  const getCoinIcon = (coinName: string) => {
    return coinIcons[coinName] || USDTIcon
  }

  const getCoinLogo = (coinId: number) => {
    const matchedCoin = coins.find(item => item.coinId === coinId)
    return matchedCoin?.logo ? `${IMG_BASE_URL}${matchedCoin.logo}` : null
  }

  // 获取所有币种余额（排除USDT，因为已单独显示）
  const tokens = userInfo?.coinsBalance.map(coin => ({
    symbol: coin.coinName,
    balance: coin.balance,
    coinId: coin.coinId,
    logo: getCoinLogo(coin.coinId)
  })) || []

  return (
    <div className='flex w-full flex-col gap-8'>
      {/* Profile Section */}
      <div className='flex items-center gap-6'>
        <div className='flex items-center gap-2 rounded-full border-[3px] border-white/20 p-0.2'>
        {userInfo?.photo ?
						<img src={userInfo?.photo?.includes('http') ? userInfo?.photo : IMG_BASE_URL + userInfo?.photo} className='h-[92px] w-[92px] rounded-full' /> :
						<WalletAvatar className='h-[92px] w-[92px] rounded-full bg-gradient-to-b from-white/60 to-white/60' />}
        </div>
        <div className='flex flex-col gap-1 flex-1'>
          <div className='flex-col items-center gap-2'>
            <h1 className='text-2xl font-semibold'>{nickName}</h1>
            <div className='text-secondary text-base font-medium'>{userId}</div>
          </div>
        </div>
        <Link
          href='/help-friend'
          className='flex items-center gap-1 rounded-lg px-[18px] py-2 hover:opacity-80'
          style={{ background: 'linear-gradient(127.37deg, #E445C3 14.45%, #9074FF 82.97%)' }}>
          <CoinRecIcon  />
          <span className='text-sm font-medium'>{t('wallet.freeCoins')}</span>
        </Link>
        <Link
          href='/wallet/address'
          className='bg-card flex items-center gap-1 rounded-lg px-[18px] py-2 hover:opacity-80'>
          <AddressManagementIcon className='h-4 w-4' />
          <span className='text-sm font-medium'>{t('wallet.addressManagement')}</span>
        </Link>
      </div>

      {/* Balance Cards */}
      <div className='flex gap-6'>
        {/* USDT Balance Card */}
        <div className='border-card bg-card relative flex-1 overflow-hidden rounded-xl border p-6'>
          <div className='absolute right-[196px] top-[135px] h-[264px] w-[167px] rounded-full bg-[#26A17B] opacity-60 blur-[200px]' />
          <div className='absolute -left-[38px] -top-[47px] h-[154px] w-[117px] rounded-full bg-[#26A17B] opacity-60 blur-[200px]' />

          <div className='relative z-10 flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1'>
                <USDTIcon className='h-5 w-5' />
                <span className='text-secondary text-sm font-semibold'>USDT {t('wallet.balance')}</span>
              </div>
              <Link href='/recharge-records' className='flex items-center gap-1 hover:opacity-80'>
                <span className='text-secondary text-sm font-medium'>{t('wallet.rechargeRecords')}</span>
                <ChevronRightIcon className='h-5 w-5 text-white/80' />
              </Link>
            </div>

            <div className='flex items-baseline justify-start py-[17px]'>
              <span className='text-[32px] font-semibold leading-none'>{Number(usdtBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
              <span className='text-xl font-normal leading-none ml-2'>{userInfo?.coinsBalance.find(c => c.coinName === 'USDT')?.coinName}</span>
            </div>

            <div className='flex gap-[10px] justify-end'>
              <Link href='/recharge' className='bg-card flex items-center justify-center gap-1 rounded px-3 py-1 hover:opacity-80'>
                <RechargeIcon className='h-5 w-5 text-white/80' />
                <span className='text-white/80 text-sm font-semibold'>{t('wallet.recharge')}</span>
              </Link>
              <Link href='/withdraw' className='bg-card flex items-center justify-center gap-1 rounded px-3 py-1 hover:opacity-80'>
                <WithdrawIcon className='h-5 w-5 text-white/80' />
                <span className='text-white/80 text-sm font-semibold'>{t('wallet.withdraw')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Points Card */}
        <div className='border-card bg-card relative flex-1 overflow-hidden rounded-xl border p-6'>
          <div className='absolute right-[219px] top-[168px] h-[264px] w-[167px] rounded-full bg-[#6741FF] opacity-60 blur-[200px]' />
          <div className='absolute -left-[50px] -top-[69px] h-[195px] w-[167px] rounded-full bg-[#6741FF] opacity-60 blur-[200px]' />

          <div className='relative z-10 flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1'>
                <StarIcon className='h-5 w-5' />
                <span className='text-secondary text-sm font-semibold'>{t('wallet.points')}</span>
              </div>
              <Link href='/swap-records' className='flex items-center gap-1 hover:opacity-80'>
                <span className='text-secondary text-sm font-medium'>{t('wallet.swapRecords')}</span>
                <ChevronRightIcon className='h-5 w-5 text-white/80' />
              </Link>
            </div>

            <div className='flex items-baseline justify-start py-[17px]'>
              <span className='text-[32px] font-semibold leading-none'>{Number(points).toLocaleString('en-US')}</span>
              <span className='text-xl font-normal leading-none ml-2'>POINTS</span>
            </div>

            <div className='flex justify-end'>
              <Link href='/swap' className='bg-card flex items-center justify-center gap-1 rounded px-3 py-1 hover:opacity-80'>
                <SwapIcon className='h-5 w-5 text-white/80' />
                <span className='text-white/80 text-sm font-semibold'>{t('wallet.swap')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Section */}
      <div className='flex flex-col gap-2'>
        <h2 className='text-base font-medium'>{t('wallet.otherAssets')}</h2>

        <div className='bg-card rounded-xl'>
          {/* Table Header */}
          <div className='flex rounded-t-xl bg-white/5 px-4 py-2'>
            <div className='flex flex-1 items-center justify-center'>
              <span className='text-secondary text-sm font-medium'>{t('wallet.token')}</span>
            </div>
            <div className='flex flex-1 items-center justify-center'>
              <span className='text-secondary text-sm font-medium'>{t('wallet.balance')}</span>
            </div>
            <div className='flex-1' />
          </div>

          {/* Table Body */}
          {tokens.filter(x => x.symbol !== 'USDT').length > 0 ? (
            tokens.filter(x => x.symbol !== 'USDT').map((token, index) => {
              const CoinIcon = getCoinIcon(token.symbol)
              return (
                <div
                  key={index}
                  className='flex border-t border-[#0E0E10] px-4 py-2 last:rounded-b-xl'>
                  <div className='flex flex-1 items-center justify-center gap-1'>
                    <div className='flex h-5 w-5 items-center justify-center rounded-full'>
                      {token.logo ? (
                        <img
                          src={token.logo}
                          alt={token.symbol}
                          className='h-5 w-5 rounded-full object-cover'
                        />
                      ) : (
                        <CoinIcon className='h-5 w-5 object-contain' />
                      )}
                    </div>
                    <span className='text-secondary text-sm font-medium'>{token.symbol}</span>
                  </div>
                <div className='flex flex-1 items-center justify-center gap-1'>
                  <span className='text-secondary text-sm font-medium'>{Number(token.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</span>
                  <span className='text-secondary text-xs font-normal'>{token.symbol}</span>
                </div>
                  <div className='flex flex-1 items-center justify-center gap-2'>
                    <Link href={`/withdraw?coinId=${token.coinId}`} className='text-primary text-xs font-medium hover:underline'>{t('wallet.withdraw')}</Link>
                    <Link href={`/swap?coinId=${token.coinId}`} className='text-primary text-xs font-medium hover:underline'>{t('wallet.swap')}</Link>
                  </div>
                </div>
              )
            })
          ) : (
            <div className='flex items-center justify-center border-t border-[#0E0E10] px-4 py-8 rounded-b-xl'>
              <span className='text-secondary text-sm'>{t('latest.noData')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}




