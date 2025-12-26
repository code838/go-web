import { ProductGridSkeleton } from './product-grid-skeleton'

export function ZonePageSkeleton() {
	return (
		<div className='space-y-8'>
			{/* Title skeleton */}
			<div className='h-8 w-48 animate-pulse rounded bg-skeleton' />
			
			{/* Subtitle skeleton */}
			<div className='h-5 w-64 animate-pulse rounded bg-skeleton' />

			{/* Search and sort bar skeleton */}
			<div className='flex items-center gap-3'>
				<div className='h-10 w-[200px] animate-pulse rounded-lg bg-skeleton' />
				<div className='ml-auto h-10 w-40 animate-pulse rounded-lg bg-skeleton' />
			</div>

			{/* Product grid skeleton */}
			<ProductGridSkeleton count={6} />
		</div>
	)
}

