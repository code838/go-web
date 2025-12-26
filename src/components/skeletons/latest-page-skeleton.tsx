import { LatestListSkeleton } from './latest-list-skeleton'
import { useIsMobile } from '@/hooks/useMediaQuery'

export function LatestPageSkeleton() {
	const isMobile = useIsMobile()

	if (isMobile) {
		return (
			<div className='space-y-3 pb-24'>
				{/* 页面标题骨架 */}
				<section className='text-center py-2'>
					<div className='h-6 w-24 mx-auto animate-pulse rounded bg-white/10' />
				</section>

				{/* 最新揭晓商品骨架 - 顶部特殊展示 */}
				<section className='bg-white/5 rounded-lg p-7 relative'>
					{/* 商品标题骨架 */}
					<div className='text-center mb-2'>
						<div className='h-4 w-32 mx-auto animate-pulse rounded bg-white/10' />
					</div>

					{/* 统计信息骨架 */}
					<div className='flex justify-center items-center gap-3 mb-2 px-3'>
						<div className='text-center'>
							<div className='h-4 w-8 mx-auto mb-1 animate-pulse rounded bg-white/10' />
							<div className='h-3 w-12 mx-auto animate-pulse rounded bg-white/10' />
						</div>
						<div className='text-center'>
							<div className='h-4 w-8 mx-auto mb-1 animate-pulse rounded bg-white/10' />
							<div className='h-3 w-12 mx-auto animate-pulse rounded bg-white/10' />
						</div>
						<div className='text-center'>
							<div className='h-4 w-12 mx-auto mb-1 animate-pulse rounded bg-white/10' />
							<div className='h-3 w-12 mx-auto animate-pulse rounded bg-white/10' />
						</div>
					</div>

					{/* 商品图片骨架 */}
					<div className='absolute top-[-20px] left-1/2 transform -translate-x-1/2'>
						<div className='w-10 h-10 rounded-full animate-pulse bg-white/10' />
					</div>

					{/* 获奖信息骨架 */}
					<div className='text-center space-y-2 pt-3'>
						<div className='h-4 w-48 mx-auto animate-pulse rounded bg-white/10' />
						<div className='h-4 w-32 mx-auto animate-pulse rounded bg-white/10' />
						<div className='h-3 w-40 mx-auto animate-pulse rounded bg-white/10' />
					</div>
				</section>

				{/* 历史列表骨架 */}
				<section className='space-y-2'>
					{Array.from({ length: 5 }).map((_, idx) => (
						<div key={idx} className='bg-white/5 rounded-lg p-3'>
							{/* 商品标题和时间骨架 */}
							<div className='flex justify-between items-center mb-2'>
								<div className='h-4 w-32 animate-pulse rounded bg-white/10' />
								<div className='h-3 w-24 animate-pulse rounded bg-white/10' />
							</div>

							{/* 商品信息行骨架 */}
							<div className='flex justify-between items-center mb-2'>
								{/* 商品图片骨架 */}
								<div className='w-10 h-10 rounded-full animate-pulse bg-white/10' />

								{/* 价格和价值信息骨架 */}
								<div className='flex flex-col items-start gap-1'>
									<div className='h-3 w-16 animate-pulse rounded bg-white/10' />
									<div className='h-3 w-16 animate-pulse rounded bg-white/10' />
								</div>

								{/* 获奖人信息骨架 */}
								<div className='flex flex-col items-start gap-1'>
									<div className='h-3 w-8 animate-pulse rounded bg-white/10' />
									<div className='flex items-center gap-1'>
										<div className='w-4 h-4 rounded-full animate-pulse bg-white/10' />
										<div className='h-3 w-12 animate-pulse rounded bg-white/10' />
									</div>
								</div>

								{/* 幸运编码骨架 */}
								<div className='flex flex-col items-start gap-1'>
									<div className='h-3 w-12 animate-pulse rounded bg-white/10' />
									<div className='h-3 w-16 animate-pulse rounded bg-white/10' />
								</div>
							</div>
						</div>
					))}
				</section>
			</div>
		)
	}

	return (
		<div className='space-y-8'>
			{/* Title skeleton */}
			<div className='h-8 w-48 animate-pulse rounded bg-skeleton' />
			
			{/* Subtitle skeleton */}
			<div className='h-5 w-64 animate-pulse rounded bg-skeleton' />

			{/* List skeleton */}
			<LatestListSkeleton count={10} />
		</div>
	)
}

