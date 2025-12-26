export function LatestListItemSkeleton() {
	return (
		<li className='bg-card flex animate-pulse items-center justify-between gap-2 rounded-3xl border p-6 font-medium'>
			<div className='flex items-center gap-3'>
				<figure className='h-14 w-14 rounded-full bg-skeleton' />
				<div className='space-y-2'>
					<div className='h-4 w-32 rounded bg-skeleton' />
					<div className='h-3 w-24 rounded bg-skeleton' />
				</div>
			</div>

			<div className='flex flex-col items-center gap-1'>
				<div className='h-3 w-12 rounded bg-skeleton' />
				<div className='h-4 w-16 rounded bg-skeleton' />
			</div>

			<div className='flex flex-col items-center gap-1'>
				<div className='h-3 w-16 rounded bg-skeleton' />
				<div className='h-4 w-20 rounded bg-skeleton' />
			</div>

			<div className='flex flex-col items-center gap-1'>
				<div className='h-3 w-12 rounded bg-skeleton' />
				<div className='h-4 w-12 rounded bg-skeleton' />
			</div>

			<div className='flex flex-col items-center gap-1'>
				<div className='h-3 w-16 rounded bg-skeleton' />
				<div className='h-4 w-20 rounded bg-skeleton' />
			</div>

			<div className='flex flex-col items-center gap-1'>
				<div className='h-3 w-12 rounded bg-skeleton' />
				<div className='flex items-center gap-2'>
					<div className='h-5 w-5 rounded-full bg-skeleton' />
					<div className='h-4 w-16 rounded bg-skeleton' />
				</div>
			</div>

			<div className='flex flex-col items-center gap-1'>
				<div className='h-3 w-16 rounded bg-skeleton' />
				<div className='h-4 w-32 rounded bg-skeleton' />
			</div>

			{/* <div className='h-4 w-12 rounded bg-skeleton' /> */}
		</li>
	)
}

interface LatestListSkeletonProps {
	count?: number
}

export function LatestListSkeleton({ count = 10 }: LatestListSkeletonProps) {
	return (
		<ul className='space-y-3'>
			{Array.from({ length: count }).map((_, idx) => (
				<LatestListItemSkeleton key={idx} />
			))}
		</ul>
	)
}

