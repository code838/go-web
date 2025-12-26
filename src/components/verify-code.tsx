'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import sendCode from '@/requests/auth'
import { toast } from '@/components/toast'
import { useTranslations } from 'next-intl'

type Props = {
	type: 1 | 2
	content: string
	value: string
	onChange: (value: string) => void
	disabled?: boolean
}

export default function VerifyCode({ type, content, value, onChange, disabled }: Props) {
	const t = useTranslations('verifyCode')
	const [cooldown, setCooldown] = useState<number>(0)
	const timerRef = useRef<number | null>(null)
	const [loading, setLoading] = useState<boolean>(false)

	const canSend = useMemo(() => {
		if (disabled) return false
		if (!content) return false
		if (loading) return false
		return cooldown <= 0
	}, [content, cooldown, disabled, loading])

	useEffect(() => {
		if (cooldown <= 0 && timerRef.current) {
			window.clearInterval(timerRef.current)
			timerRef.current = null
		}
	}, [cooldown])

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				window.clearInterval(timerRef.current)
				timerRef.current = null
			}
		}
	}, [])

	const handleSend = useCallback(async () => {
		if (!canSend) return
		try {
			setLoading(true)
			const res = await sendCode(type, content)
			if (res.data.code === 0) {
				toast.success(t('codeSent'))
				setCooldown(60)
				timerRef.current = window.setInterval(() => {
					setCooldown(prev => (prev > 0 ? prev - 1 : 0))
				}, 1000)
			} else {
				toast.error((res.data as any)?.msg || t('sendCodeFailed'))
			}
		} catch (e: any) {
			const errorMsg = e?.response?.data?.msg || e?.message || t('sendCodeFailedRetry')
			toast.error(errorMsg)
		} finally {
			setLoading(false)
		}
	}, [canSend, content, type, t])

	return (
		<div className='flex items-center gap-3'>
			<input
				type='text'
				placeholder={t('placeholder')}
				name='code'
				value={value}
				onChange={e => onChange(e.target.value)}
				className='placeholder:text-secondary bg-card min-w-0 flex-1 rounded-lg border px-4 py-3 text-sm outline-none focus:border-white/20'
			/>
			<button
				type='button'
				disabled={!canSend}
				onClick={handleSend}
				className='shrink-0 bg-brand disabled:bg-disabled inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium whitespace-nowrap'>
				{loading && <span aria-hidden className='h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white' />}
				{cooldown > 0 ? `${cooldown}s` : t('sendCode')}
			</button>
		</div>
	)
}
