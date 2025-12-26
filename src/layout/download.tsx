'use client'

import AndroidSVG from '@/svgs/platforms/andriod.svg'
import IOSSVG from '@/svgs/platforms/ios.svg'
import { useState } from 'react'
import BrandBtn from '@/components/brand-btn'
import { IMG_BASE_URL } from '@/consts'
import { useAppLinks } from '@/requests'
import { useTranslations } from 'next-intl'

export default function Download() {
	const [open, setOpen] = useState(false)
	const t = useTranslations('download')
	const { data: appLinks, isLoading } = useAppLinks()

	// 获取 iOS 和 Android 的下载链接
	const iosLink = appLinks?.find((link) => link.type === 1)
	const androidLink = appLinks?.find((link) => link.type === 2)
	// console.log('appLinks',	iosLink)
	// console.log('androidLink',	androidLink)

	// 生成完整的下载地址
	const iosUrl = iosLink ? `${IMG_BASE_URL}${iosLink.path}` : ''
	const androidUrl = androidLink ? `${IMG_BASE_URL}${androidLink.path}` : ''

	return (
		<div className='relative' onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
			<BrandBtn>{t('title')}</BrandBtn>
			{open && (
				<div className='animate-in fade-in-0 zoom-in-95 absolute right-0 top-full z-50 pt-2'>
					<div className='bg-bg flex gap-6 rounded-xl border p-6 font-medium'>
						{/* Android 客户端 */}
						<div className='bg-panel group relative flex h-[120px] w-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl p-2 text-center'>
							<div className='text-center transition-all group-hover:scale-90 group-hover:opacity-0'>
								<AndroidSVG className='mx-auto' />
								<span className='text-sm'>{t('android')}</span>
							</div>
							<div className='absolute flex scale-80 items-center justify-center opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100'>
								{isLoading ? (
									<span className='text-xs'>{t('loading')}</span>
								) : androidUrl ? (
									<div className='rounded bg-white p-1'>
										<img src={androidUrl} alt={t('android')} className='h-16 w-16' />
									</div>
								) : null}
							</div>
						</div>

						{/* iOS 客户端 */}
						<div className='bg-panel group relative flex h-[120px] w-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl p-2 text-center hover:bg-black/5'>
							<div className='text-center transition-all group-hover:scale-90 group-hover:opacity-0'>
								<IOSSVG className='mx-auto' />
								<span className='text-sm'>{t('ios')}</span>
							</div>
							<div className='absolute flex scale-80 items-center justify-center opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100'>
								{isLoading ? (
									<span className='text-xs'>{t('loading')}</span>
								) : iosUrl ? (
									<div className='rounded bg-white p-1'>
										<img src={iosUrl} alt={t('ios')} className='h-16 w-16' />
									</div>
								) : null}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
