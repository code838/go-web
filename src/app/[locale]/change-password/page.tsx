'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import ChevronSVG from '@/svgs/chevron.svg'
import { toast } from '@/components/toast'
import { Loader2 } from 'lucide-react'
import { resetPassword } from '@/requests/auth'
import md5 from 'blueimp-md5'

export default function ChangePasswordPage() {
	const t = useTranslations('changePassword')
	const router = useRouter()
	const { userId } = useAuth()
	const [oldPassword, setOldPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [loading, setLoading] = useState(false)

	const handleCancel = () => {
		router.back()
	}

	const handleConfirm = async () => {
		if (!oldPassword || !newPassword || !confirmPassword) {
			toast.error(t('fillAllFields'))
			return
		}

		if (newPassword !== confirmPassword) {
			toast.error(t('passwordMismatch'))
			return
		}

		if (!userId) {
			toast.error(t('userNotLoggedIn'))
			return
		}

		setLoading(true)
		try {
			const res = await resetPassword({
				userId: Number(userId),
				originalPwd: md5(oldPassword),
				password: md5(newPassword),
				type: 2 // 2: 修改密码
			})

			if (res.data.code === 0) {
				toast.success(t('success'))
				router.back()
			} else {
				toast.error(res.data.msg || t('failed'))
			}
		} catch (error) {
			toast.error(t('failed'))
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='flex min-h-screen flex-col pb-24 lg:pb-8'>
			{/* Header */}
			<div className='sticky top-0 z-10 flex items-center gap-2 bg-[#0E0E10] pb-4'>
				<button
					onClick={() => router.back()}
					className='flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 p-1.5'
				>
					<ChevronSVG className='h-5 w-5 rotate-90 text-white/80' />
				</button>
				<h1 className='flex-1 text-center text-base font-semibold text-white/80 pr-9'>{t('title')}</h1>
			</div>

			{/* Decorative blur */}
			<div className='absolute right-[70px] top-[112px] h-[94px] w-[98px] rounded-full bg-[#6741FF] blur-[250px]' />

			{/* Content - flex-1 to push buttons to bottom */}
			<div className='relative flex flex-1 flex-col gap-6 pt-4'>
				{/* Old Password */}
				<div className='flex flex-col gap-1'>
					<label className='text-sm text-[#6E6E70]'>{t('oldPassword')}</label>
					<input
						type='password'
						value={oldPassword}
						onChange={e => setOldPassword(e.target.value)}
						placeholder={t('pleaseEnter')}
						className='rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none placeholder:text-[#6E6E70]'
					/>
				</div>

				{/* New Password */}
				<div className='flex flex-col gap-1'>
					<label className='text-sm text-[#6E6E70]'>{t('newPassword')}</label>
					<input
						type='password'
						value={newPassword}
						onChange={e => setNewPassword(e.target.value)}
						placeholder={t('pleaseEnter')}
						className='rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none placeholder:text-[#6E6E70]'
					/>
				</div>

				{/* Confirm Password */}
				<div className='flex flex-col gap-1'>
					<label className='text-sm text-[#6E6E70]'>{t('confirmPassword')}</label>
					<input
						type='password'
						value={confirmPassword}
						onChange={e => setConfirmPassword(e.target.value)}
						placeholder={t('pleaseEnter')}
						className='rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none placeholder:text-[#6E6E70]'
					/>
				</div>
			</div>

			{/* Buttons - Fixed at bottom */}
			<div className='sticky bottom-0 flex gap-2.5 bg-[#0E0E10] pb-8 pt-4'>
				<button
					onClick={handleCancel}
					disabled={loading}
					className='flex-1 rounded-lg bg-white/5 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-50'
				>
					{t('cancel')}
				</button>
				<button
					onClick={handleConfirm}
					disabled={loading}
					className='flex-1 rounded-lg bg-[#6741FF] py-3 text-base font-semibold text-white transition-colors hover:bg-[#5634E6] disabled:bg-gray-400'
				>
					{loading ? <Loader2 className='mx-auto h-5 w-5 animate-spin' /> : t('confirm')}
				</button>
			</div>
		</div>
	)
}

