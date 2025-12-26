'use client'

import { useEffect, useState } from 'react'
import { useRouter, Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import PaymentSuccessDecorationSVG from '@/svgs/payment-success-decoration.svg'
import PaymentSuccessCheckSVG from '@/svgs/payment-success-check.svg'
import MinusSVG from '@/svgs/minus.svg'
import PlusSVG from '@/svgs/plus.svg'
import BrandBtn from '@/components/brand-btn'
import ChevronBackSVG from '@/svgs/chevron-back.svg'
import LuckyWheel from '@/components/lucky-wheel'
import { useHome, useOrderBuy } from '@/requests'
import { useAuth } from '@/hooks/useAuth'
import { IMG_BASE_URL } from '@/consts'
import { toast } from '@/components/toast'
import { useAuthDialogStore } from '@/components/auth-dialogs/store'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useSearchParams } from 'next/navigation'
import HelpFriendDialog from '@/components/help-friend-dialog'

export default function HelpFriendPage() {
  const router = useRouter()
  const t = useTranslations('helpFriend')
  const [isSuccess, setIsSuccess] = useState(false)
  const { userInfo, userId } = useAuth()
  const { openDialog } = useAuthDialogStore()
  const isMobile = useIsMobile()
  const [hasMounted, setHasMounted] = useState(false)
  const searchParams = useSearchParams()
  const [showHelpFriendDialog, setShowHelpFriendDialog] = useState(false)
  
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // 检测 URL 参数，如果需要显示对话框
  useEffect(() => {
    if (!hasMounted) return
    const showDialog = searchParams.get('showDialog')
    if (showDialog === 'true') {
      setShowHelpFriendDialog(true)
      // 清除 URL 参数
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete('showDialog')
      const newSearch = newParams.toString()
      router.replace(newSearch ? `/help-friend?${newSearch}` : '/help-friend', { scroll: false })
    }
  }, [hasMounted, searchParams, router])
  
  const orderBuyMutation = useOrderBuy()
  
  // 获取首页数据（包含热门商品）- 仅桌面端使用
  const { data: homeData, isLoading: isHomeLoading } = useHome(userInfo?.userId)
  const hotProducts = homeData?.hot || []
  
  // 管理每个商品的数量
  const [productQuantities, setProductQuantities] = useState<Record<number, number>>({})

  const handleHelp = () => {
    setIsSuccess(true)
  }
  
  // 获取商品数量
  const getProductQuantity = (productId: number) => {
    return productQuantities[productId] || 1
  }
  
  // 增加数量
  const handleIncreaseQuantity = (productId: number) => {
    setProductQuantities(prev => ({
      ...prev,
      [productId]: (prev[productId] || 1) + 1
    }))
  }
  
  // 减少数量
  const handleDecreaseQuantity = (productId: number) => {
    setProductQuantities(prev => {
      const currentQty = prev[productId] || 1
      if (currentQty > 1) {
        return {
          ...prev,
          [productId]: currentQty - 1
        }
      }
      return prev
    })
  }

  // 处理商品立即参与
  const handleJoinProduct = async (productId: number) => {
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
      // 调用下单接口，使用实际的数量
      const quantity = getProductQuantity(productId)
      const res = await orderBuyMutation.mutateAsync({
        userId: Number(userId),
        data: [
          {
            productId: productId,
            num: quantity
          }
        ]
      })
      
      if (res.data.code == 0 || res.data.code == 200) {
        router.push('/comfirm-order?orderId=' + res.data.data?.orderId!)
      } else {
        toast.error(res.data.msg!)
      }
    } catch (error: any) {
      console.error('下单失败:', error)
      toast.error(error?.response?.data?.msg || '下单失败')
    }
  }

  const handleInvite = () => {
    // 跳转到邀请页面或执行邀请逻辑
    router.push('/invite')
  }

  // 为避免首次进入因 isMobile 初始为 false 而导致 LuckyWheel 挂载两次（从桌面到移动切换），
  // 在客户端完成首次挂载前不渲染页面内容
  if (!hasMounted) {
    return null
  }

  // 移动端：完全由LuckyWheel组件处理
  if (isMobile) {
    return (
      <>
        <LuckyWheel
          onInvite={handleInvite}
          onBack={() => router.back()}
          pageTitle={t('title')}
        />
        {/* Help Friend Dialog */}
        <HelpFriendDialog
          isOpen={showHelpFriendDialog}
          onClose={() => setShowHelpFriendDialog(false)}
        />
      </>
    )
  }

  // 桌面端渲染
  if (isSuccess) {
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
              <PaymentSuccessCheckSVG className='h-30 w-30' />
            </div>
            <PaymentSuccessDecorationSVG className='absolute -right-3 -top-12' />
          </div>

          <h2 className='text-2xl font-semibold text-center'>{t('successTitle')}</h2>
          <p className='text-subtitle text-xl font-semibold text-center'>{t('successMessage')}</p>
        </div>

        {/* Back to Home Button */}
        <div className='flex justify-center'>
          <BrandBtn onClick={() => router.push('/')} className='w-[120px]'>
            {t('backToHome')}
          </BrandBtn>
        </div>

        {/* Divider */}
        <div className='h-[1px] bg-border' />

        {/* Hot Products */}
        {!isHomeLoading && hotProducts.length > 0 && (
          <>
            <h2 className='text-base font-semibold text-brand'>{t('hotProducts')}</h2>

            <div className='space-y-4'>
              {hotProducts.slice(0, 2).map((product) => (
            <div key={product.productId} className='bg-card flex items-center gap-3 rounded-3xl border p-6'>
              <figure className='h-[52px] w-[52px] rounded-full bg-gradient-to-b from-[#8A8A8A] to-[#5A5A5A] p-0.2'>
                <img src={product.logo ?`${IMG_BASE_URL}${product.logo}` : '/images/examples/eth.png'} className='h-full w-full rounded-full' />
              </figure>
              <div className='flex-1 space-y-1'>
                <h4 className='text-sm font-medium'>{product.title}</h4>
                <p className='text-secondary text-xs'>{product.subTitle}</p>
              </div>
              <div className='flex-1 space-y-1 text-center'>
                <div className='text-secondary text-xs'>{t('price')}</div>
                <div className='text-gold text-sm font-medium'>{product.price}U</div>
              </div>
              <div className='flex-1 space-y-1 text-center'>
                <div className='text-secondary text-xs'>{t('productValue')}</div>
                <div className='text-brand-2 text-sm font-medium'>{product.productValue}</div>
              </div>
              <div className='flex-1 space-y-1 text-center'>
                <div className='text-secondary text-xs'>{t('participants')}</div>
                <div className='text-sm font-medium'>{product.joinPerson}/{product.totalPerson}</div>
              </div>
              <div className='flex-1 space-y-1 text-center'>
                <div className='text-secondary text-xs'>{t('status')}</div>
                <div className='text-sm font-medium'>{product.status === 1 ? t('ongoing') : t('ended')}</div>
              </div>
              <div className='flex-1 space-y-1 text-center'>
                <div className='text-secondary text-xs'>{t('quantity')}</div>
                <div className='flex items-center justify-center gap-2'>
                  <MinusSVG 
                    className='h-5 w-5 cursor-pointer hover:opacity-70' 
                    onClick={() => handleDecreaseQuantity(product.productId)}
                  />
                  <span className='bg-card inline-block w-6 rounded text-center text-sm font-semibold'>
                    {getProductQuantity(product.productId)}
                  </span>
                  <PlusSVG 
                    className='h-5 w-5 cursor-pointer hover:opacity-70' 
                    onClick={() => handleIncreaseQuantity(product.productId)}
                  />
                </div>
              </div>
              <div className='flex flex-col gap-1 py-5'>
                <button 
                  onClick={() => handleJoinProduct(product.productId)}
                  className='bg-brand rounded-md px-2 py-1 text-xs font-semibold text-white hover:opacity-80'
                >
                  {t('joinNow')}
                </button>
                <Link 
                  href={`/product/${product.productId}?serialNumber=${product.serialNumber}`}
                  className='bg-button rounded-md px-2 py-1 text-xs font-semibold hover:opacity-80 text-center'
                >
                  {t('details')}
                </Link>
              </div>
            </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className='space-y-6 bg-[#000]'>
      {/* Lucky Wheel - 桌面端（包含标题） */}
      <LuckyWheel 
        onInvite={handleInvite}
        onBack={() => router.back()}
        pageTitle={t('title')}
      />

      {/* Help Friend Dialog */}
      <HelpFriendDialog
        isOpen={showHelpFriendDialog}
        onClose={() => setShowHelpFriendDialog(false)}
      />

      {/* Divider - 仅桌面端显示 */}
      {/* <div className='h-[1px] bg-border mx-24' /> */}

      {/* Hot Products - 仅桌面端显示 */}
      {/* {!isHomeLoading && hotProducts.length > 0 && (
        <div className='mx-24'>
          <h2 className='text-base font-semibold text-brand'>{t('hotProducts')}</h2>

          <div className='space-y-4'>
            {hotProducts.map((product) => (
          <div key={product.productId} className='bg-card flex items-center gap-3 rounded-3xl border p-6 py-1'>
            <figure className='h-[52px] w-[52px] rounded-full bg-gradient-to-b from-[#8A8A8A] to-[#5A5A5A] p-0.2'>
              <img src={product.logo ?`${IMG_BASE_URL}${product.logo}` : '/images/examples/eth.png'} className='h-full w-full rounded-full' />
            </figure>
            <div className='flex-1 space-y-1'>
              <h4 className='text-sm font-medium'>{product.title}</h4>
              <p className='text-secondary text-xs'>{product.subTitle}</p>
            </div>
            <div className='flex-1 space-y-1 text-center'>
              <div className='text-secondary text-xs'>{t('price')}</div>
              <div className='text-gold text-sm font-medium'>{product.price}U</div>
            </div>
            <div className='flex-1 space-y-1 text-center'>
              <div className='text-secondary text-xs'>{t('productValue')}</div>
              <div className='text-brand-2 text-sm font-medium'>{product.productValue}</div>
            </div>
            <div className='flex-1 space-y-1 text-center'>
              <div className='text-secondary text-xs'>{t('participants')}</div>
              <div className='text-sm font-medium'>{product.joinPerson}/{product.totalPerson}</div>
            </div>
            <div className='flex-1 space-y-1 text-center'>
              <div className='text-secondary text-xs'>{t('status')}</div>
              <div className='text-sm font-medium'>{product.status === 1 ? t('ongoing') : t('ended')}</div>
            </div>
            <div className='flex-1 space-y-1 text-center'>
              <div className='text-secondary text-xs'>{t('quantity')}</div>
              <div className='flex items-center justify-center gap-2'>
                <MinusSVG 
                  className='h-5 w-5 cursor-pointer hover:opacity-70' 
                  onClick={() => handleDecreaseQuantity(product.productId)}
                />
                <span className='bg-card inline-block w-6 rounded text-center text-sm font-semibold'>
                  {getProductQuantity(product.productId)}
                </span>
                <PlusSVG 
                  className='h-5 w-5 cursor-pointer hover:opacity-70' 
                  onClick={() => handleIncreaseQuantity(product.productId)}
                />
              </div>
            </div>
            <div className='flex flex-col gap-1 py-5'>
              <button 
                onClick={() => handleJoinProduct(product.productId)}
                className='bg-brand rounded-md px-2 py-1 text-xs font-semibold text-white hover:opacity-80'
              >
                {t('joinNow')}
              </button>
              <Link 
                href={`/product/${product.productId}?serialNumber=${product.serialNumber}`}
                className='bg-button rounded-md px-2 py-1 text-xs font-semibold hover:opacity-80 text-center'
              >
                {t('details')}
              </Link>
            </div>
          </div>
            ))}
          </div>
        </div>
      )} */}
      <div className='h-6'/>
    </div>
  )
}
