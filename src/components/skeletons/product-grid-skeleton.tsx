'use client'

import { ProductCardSkeleton } from '@/components/product-card'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface ProductGridSkeletonProps {
	count?: number
}

export function ProductGridSkeleton({ count = 6 }: ProductGridSkeletonProps) {
	const isMobile = useIsMobile()

	if (isMobile) {
		return (
			<div className='grid grid-cols-2 gap-x-3 gap-y-8'>
				{Array.from({ length: count }).map((_, idx) => (
					<ProductCardSkeleton key={idx} />
				))}
			</div>
		)
	}

	return (
		<div className='mt-12 grid grid-cols-3 gap-x-4 gap-y-12'>
			{Array.from({ length: count }).map((_, idx) => (
				<ProductCardSkeleton key={idx} />
			))}
		</div>
	)
}

