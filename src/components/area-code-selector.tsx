'use client'

import { useState, useRef, useEffect } from 'react'
import { IMG_BASE_URL } from '@/consts'
import type { AreaInfo } from '@/types'

interface AreaCodeSelectorProps {
	value: string
	onChange: (value: string) => void
	areaList: AreaInfo[]
	className?: string
	isMobile?: boolean
}

export default function AreaCodeSelector({ value, onChange, areaList, className = '', isMobile = false }: AreaCodeSelectorProps) {
	const [isOpen, setIsOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	// 点击外部关闭下拉框
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isOpen])

	const selectedArea = areaList.find(item => item.area === value)

	const baseSelectClass = isMobile
		? 'min-w-[115px] w-auto rounded-lg border border-white/5 bg-white/5 text-sm font-medium text-white outline-none'
		: 'placeholder:text-secondary bg-card w-32 min-w-[128px] max-w-[128px] rounded-lg border border-white/10 text-sm outline-none'

	const baseOptionClass = isMobile ? 'bg-[#0E0E10]' : 'bg-card'

	return (
		<div ref={containerRef} className={`relative ${className}`}>
			{/* 选择框按钮 */}
			<button
				type='button'
				onClick={() => setIsOpen(!isOpen)}
				className={`${baseSelectClass} flex items-center ${isMobile ? 'gap-1.5 px-2.5' : 'gap-2 px-3'} py-3 ${isOpen ? (isMobile ? 'border-white/10' : 'border-white/20') : ''}`}>
				{selectedArea?.image && (
					<img src={`${IMG_BASE_URL}${selectedArea.image}`} alt='flag' className='w-5 h-4 flex-shrink-0 object-contain' />
				)}
				<span className='whitespace-nowrap text-left'>{value}</span>
				<svg className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
					<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
				</svg>
			</button>

			{/* 下拉选项列表 */}
			{isOpen && (
				<div
					className={`absolute z-50 mt-1 w-full rounded-lg border ${
						isMobile ? 'border-white/10 bg-[#1A1A1D]' : 'border-white/10 bg-[#1A1A1D]'
					} shadow-xl max-h-60 overflow-y-auto custom-scrollbar`}>
					{areaList.map((item, index) => (
						<button
							key={`${item.area}-${index}`}
							type='button'
							onClick={() => {
								onChange(item.area)
								setIsOpen(false)
							}}
							className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors ${
								item.area === value
									? 'bg-brand text-white'
									: 'text-white hover:bg-white/10'
							}`}>
							{item.image && <img src={`${IMG_BASE_URL}${item.image}`} alt='flag' className='w-5 h-4 object-contain flex-shrink-0' />}
							<span className='text-sm font-medium'>{item.area}</span>
						</button>
					))}
				</div>
			)}
		</div>
	)
}

