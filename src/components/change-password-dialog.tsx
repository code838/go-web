'use client'

import { useState } from 'react'
import DialogShell from './dialog-shell'
import { resetPassword } from '@/requests/auth'
import md5 from 'blueimp-md5'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from 'next-intl'
import { toast } from '@/components/toast'

type ChangePasswordDialogProps = {
	onClose: () => void
}

export default function ChangePasswordDialog({ onClose }: ChangePasswordDialogProps) {
	const t = useTranslations('changePassword')
	const { userInfo, userId } = useAuth()
	const [oldPassword, setOldPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [loading, setLoading] = useState(false)

	const handleSubmit = async () => {
		// 验证输入
		if (!oldPassword || !newPassword || !confirmPassword) {
			toast.warning(t('errorAllFields'))
			return
		}

		if (newPassword !== confirmPassword) {
			toast.error(t('errorMismatch'))
			return
		}

		if (newPassword.length < 6) {
			toast.warning(t('errorLength'))
			return
		}

		setLoading(true)

		try {
			// 使用邮箱或手机号，优先使用邮箱
			let content = userInfo?.email || userInfo?.mobile || ''
			let contentType: 1 | 2 = userInfo?.email ? 1 : 2

			if (!content) {
				toast.error(t('errorNoAccount'))
				setLoading(false)
				return
			}
		const res = await resetPassword({
			userId: userId ? Number(userId) : undefined,
			contentType,
			content,
			captha: '248297', // 修改密码不需要验证码
			password: md5(newPassword),
			type: 2, // 2表示修改密码
			originalPwd: md5(oldPassword)
		})

			if (res.data.code === 0) {
				toast.success(t('success'))
				onClose()
				// 可以在这里触发退出登录
			} else {
				toast.error((res.data as any).msg || t('errorFailed'))
			}
		} catch (err: any) {
			toast.error(err?.response?.data?.msg || t('errorRetry'))
		} finally {
			setLoading(false)
		}
	}

	return (
		<DialogShell title={t('title')} close={onClose}>
			<div className='space-y-4'>
				<input
					type='password'
					placeholder={t('oldPassword')}
					value={oldPassword}
					onChange={e => setOldPassword(e.target.value)}
					className='placeholder:text-secondary bg-card w-full rounded-lg border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/20'
					disabled={loading}
				/>
				<input
					type='password'
					placeholder={t('newPassword')}
					value={newPassword}
					onChange={e => setNewPassword(e.target.value)}
					className='placeholder:text-secondary bg-card w-full rounded-lg border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/20'
					disabled={loading}
				/>
			<input
				type='password'
				placeholder={t('confirmPassword')}
				value={confirmPassword}
				onChange={e => setConfirmPassword(e.target.value)}
				className='placeholder:text-secondary bg-card w-full rounded-lg border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/20'
				disabled={loading}
			/>

			<button disabled={loading} onClick={handleSubmit} className='bg-brand w-full rounded-lg px-4 py-3 font-semibold disabled:opacity-50'>
				{loading ? t('submitting') : t('submit')}
			</button>
			</div>
		</DialogShell>
	)
}

