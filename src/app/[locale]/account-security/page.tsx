'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import ChevronSVG from '@/svgs/chevron.svg'
import ChevronRightSVG from '@/svgs/chevron-right.svg'
import { deleteAccount, updateContact } from '@/requests/index'
import sendCode from '@/requests/auth'
import { toast } from '@/components/toast'
import { Loader2 } from 'lucide-react'

export default function AccountSecurityPage() {
	const t = useTranslations('accountSecurity')
	const router = useRouter()
	const { userInfo, userId, clearAuth } = useAuth()
	const [showEmailDialog, setShowEmailDialog] = useState(false)
	const [showPhoneDialog, setShowPhoneDialog] = useState(false)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

	const handleDeleteAccount = async () => {
		if (!userId) {
			toast.error(t('userNotLoggedIn'))
			return
		}

		try {
			const res = await deleteAccount({ userId: Number(userId) })
			if (res.data.code === 0) {
				toast.success(t('deleteSuccess'))
				clearAuth()
				router.push('/')
			} else {
				toast.error(res.data.msg || t('deleteFailed'))
			}
		} catch (error) {
			toast.error(t('deleteFailedRetry'))
		}
	}

	return (
		<div className='min-h-screen pb-24 lg:pb-8'>
			{/* Header */}
			<div className='sticky top-0 z-10 flex items-center gap-2 bg-[#0E0E10] pb-6'>
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

			{/* Content */}
			<div className='relative flex flex-col gap-6'>
				{/* Security Settings */}
				<div className='flex flex-col rounded-xl bg-white/5'>
					{/* Email */}
					<button
						onClick={() => setShowEmailDialog(true)}
						className='flex items-center border-b border-[#0E0E10] px-3 py-3 transition-colors active:bg-white/10'
					>
						<span className='flex-1 text-left text-sm text-white'>{t('email')}</span>
						<span className='text-sm text-white'>{userInfo?.email || '-'}</span>
						<ChevronRightSVG className='ml-2 h-6 w-6 text-white/80' />
					</button>

					{/* Phone */}
					<button
						onClick={() => setShowPhoneDialog(true)}
						className='flex items-center border-b border-[#0E0E10] px-3 py-3 transition-colors active:bg-white/10'
					>
						<span className='flex-1 text-left text-sm text-white'>{t('phone')}</span>
						<span className='text-sm text-white'>{userInfo?.mobile || '-'}</span>
						<ChevronRightSVG className='ml-2 h-6 w-6 text-white/80' />
					</button>

					{/* Change Password */}
					<button
						onClick={() => router.push('/change-password' as any)}
						className='flex items-center px-3 py-3 transition-colors active:bg-white/10'
					>
						<span className='flex-1 text-left text-sm text-white'>{t('changePassword')}</span>
						<ChevronRightSVG className='ml-2 h-6 w-6 text-white/80' />
					</button>
				</div>

				{/* Delete Account */}
				<button
					onClick={() => setShowDeleteConfirm(true)}
					className='rounded-xl border border-[#F75353] py-3 text-center text-sm font-semibold text-[#F75353] transition-colors active:bg-[#F75353]/10'
				>
					{t('deleteAccount')}
				</button>
			</div>

			{/* Email Dialog */}
			{showEmailDialog && (
				<BindEmailDialog 
					onClose={() => setShowEmailDialog(false)} 
					isBound={!!userInfo?.email}
					currentEmail={userInfo?.email || ''}
				/>
			)}

			{/* Phone Dialog */}
			{showPhoneDialog && (
				<BindPhoneDialog 
					onClose={() => setShowPhoneDialog(false)} 
					isBound={!!userInfo?.mobile}
					currentPhone={userInfo?.mobile || ''}
				/>
			)}

			{/* Delete Confirm Dialog */}
			{showDeleteConfirm && (
				<DeleteAccountDialog
					onConfirm={() => {
						setShowDeleteConfirm(false)
						handleDeleteAccount()
					}}
					onCancel={() => setShowDeleteConfirm(false)}
				/>
			)}
		</div>
	)
}

// Bind Email Dialog Component
interface BindEmailDialogProps {
	onClose: () => void
	isBound: boolean
	currentEmail: string
}

function BindEmailDialog({ onClose, isBound, currentEmail }: BindEmailDialogProps) {
	const t = useTranslations('accountSecurity')
	const { userId, initUserInfo } = useAuth()
	const [email, setEmail] = useState(currentEmail)
	const [code, setCode] = useState('')
	const [loading, setLoading] = useState(false)
	const [codeLoading, setCodeLoading] = useState(false)
	const [remaining, setRemaining] = useState(0)

	useEffect(() => {
		if (remaining <= 0) return
		const timer = setInterval(() => {
			setRemaining(prev => (prev > 0 ? prev - 1 : 0))
		}, 1000)
		return () => clearInterval(timer)
	}, [remaining])

	const handleSendCode = async () => {
		if (!email) {
			toast.error(t('pleaseEnterEmail'))
			return
		}
		setCodeLoading(true)
		try {
			const res = await sendCode(1, email)
			if (res.data.code === 0) {
				toast.success(t('codeSent'))
				setRemaining(60)
			} else {
				toast.error(res.data.msg || t('sendCodeFailed'))
			}
		} catch (error) {
			toast.error(t('sendCodeFailed'))
		} finally {
			setCodeLoading(false)
		}
	}

	const handleConfirm = async () => {
		if (!email || !code) {
			toast.error(t('fillAllFields'))
			return
		}

		setLoading(true)
		try {
			const res = await updateContact({
				userId: Number(userId),
				type: 1,
				content: email,
				captha: code
			})
			if (res.data.code === 0) {
				toast.success(t('updateSuccess'))
				await initUserInfo()
				onClose()
			} else {
				toast.error(res.data.msg || t('updateFailed'))
			}
		} catch (error) {
			toast.error(t('updateFailed'))
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm' onClick={onClose}>
			<div 
				className='w-full rounded-t-xl border-t border-[#1D1D1D] bg-[#0E0E10] px-4 pb-8 pt-4'
				onClick={e => e.stopPropagation()}
			>
				{/* Header */}
				<div className='mb-6 flex items-center justify-center'>
					<h3 className='text-base font-semibold text-white/80'>
						{isBound ? t('modifyEmail') : t('bindEmail')}
					</h3>
					<button 
						onClick={onClose}
						className='absolute right-4 flex h-5 w-5 items-center justify-center'
					>
						<svg className='h-5 w-5 text-white/60' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
						</svg>
					</button>
				</div>

			{/* Email Input */}
			<input
				type='email'
				value={email}
				onChange={e => setEmail(e.target.value)}
				placeholder={t('emailPlaceholder')}
				disabled={loading || codeLoading}
				className='mb-6 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/40 disabled:opacity-50'
			/>

			{/* Verification Code Input with Get Code Button */}
			<div className='mb-6 flex gap-3'>
				<input
					type='text'
					value={code}
					onChange={e => setCode(e.target.value)}
					placeholder={t('codePlaceholder')}
					disabled={loading}
					className='min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/40 disabled:opacity-50'
				/>
				<button 
					onClick={handleSendCode}
					disabled={loading || codeLoading || remaining > 0 || !email}
					className='shrink-0 whitespace-nowrap rounded-lg bg-[#6741FF] px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5634E6] disabled:bg-gray-400'
				>
					{codeLoading ? (
						<Loader2 className='h-4 w-4 animate-spin' />
					) : remaining > 0 ? (
						`${remaining}s`
					) : (
						t('getCode')
					)}
				</button>
			</div>

				{/* Confirm Button */}
				<button
					onClick={handleConfirm}
					disabled={loading || !code || !email}
					className='w-full rounded-lg bg-[#6741FF] py-3 text-base font-semibold text-white transition-colors hover:bg-[#5634E6] disabled:bg-gray-400'
				>
					{loading ? <Loader2 className='mx-auto h-5 w-5 animate-spin' /> : t('confirm')}
				</button>
			</div>
		</div>
	)
}

// Bind Phone Dialog Component
interface BindPhoneDialogProps {
	onClose: () => void
	isBound: boolean
	currentPhone: string
}

function BindPhoneDialog({ onClose, isBound, currentPhone }: BindPhoneDialogProps) {
	const t = useTranslations('accountSecurity')
	const { userId, initUserInfo } = useAuth()
	const [phone, setPhone] = useState(currentPhone)
	const [code, setCode] = useState('')
	const [loading, setLoading] = useState(false)
	const [codeLoading, setCodeLoading] = useState(false)
	const [remaining, setRemaining] = useState(0)

	useEffect(() => {
		if (remaining <= 0) return
		const timer = setInterval(() => {
			setRemaining(prev => (prev > 0 ? prev - 1 : 0))
		}, 1000)
		return () => clearInterval(timer)
	}, [remaining])

	const handleSendCode = async () => {
		if (!phone) {
			toast.error(t('pleaseEnterPhone'))
			return
		}
		setCodeLoading(true)
		try {
			const res = await sendCode(2, phone)
			if (res.data.code === 0) {
				toast.success(t('codeSent'))
				setRemaining(60)
			} else {
				toast.error(res.data.msg || t('sendCodeFailed'))
			}
		} catch (error) {
			toast.error(t('sendCodeFailed'))
		} finally {
			setCodeLoading(false)
		}
	}

	const handleConfirm = async () => {
		if (!phone || !code) {
			toast.error(t('fillAllFields'))
			return
		}

		setLoading(true)
		try {
			const res = await updateContact({
				userId: Number(userId),
				type: 2,
				content: phone,
				captha: code
			})
			if (res.data.code === 0) {
				toast.success(t('updateSuccess'))
				await initUserInfo()
				onClose()
			} else {
				toast.error(res.data.msg || t('updateFailed'))
			}
		} catch (error) {
			toast.error(t('updateFailed'))
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm' onClick={onClose}>
			<div 
				className='w-full rounded-t-xl border-t border-[#1D1D1D] bg-[#0E0E10] px-4 pb-8 pt-4'
				onClick={e => e.stopPropagation()}
			>
				{/* Header */}
				<div className='mb-6 flex items-center justify-center'>
					<h3 className='text-base font-semibold text-white/80'>
						{isBound ? t('modifyPhone') : t('bindPhone')}
					</h3>
					<button 
						onClick={onClose}
						className='absolute right-4 flex h-5 w-5 items-center justify-center'
					>
						<svg className='h-5 w-5 text-white/60' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
						</svg>
					</button>
				</div>

			{/* Phone Input */}
			<input
				type='tel'
				value={phone}
				onChange={e => setPhone(e.target.value)}
				placeholder={t('phonePlaceholder')}
				disabled={loading || codeLoading}
				className='mb-6 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/40 disabled:opacity-50'
			/>

			{/* Verification Code Input with Get Code Button */}
			<div className='mb-6 flex gap-3'>
				<input
					type='text'
					value={code}
					onChange={e => setCode(e.target.value)}
					placeholder={t('codePlaceholder')}
					disabled={loading}
					className='min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/40 disabled:opacity-50'
				/>
				<button 
					onClick={handleSendCode}
					disabled={loading || codeLoading || remaining > 0 || !phone}
					className='shrink-0 whitespace-nowrap rounded-lg bg-[#6741FF] px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5634E6] disabled:bg-gray-400'
				>
					{codeLoading ? (
						<Loader2 className='h-4 w-4 animate-spin' />
					) : remaining > 0 ? (
						`${remaining}s`
					) : (
						t('getCode')
					)}
				</button>
			</div>

				{/* Confirm Button */}
				<button
					onClick={handleConfirm}
					disabled={loading || !code || !phone}
					className='w-full rounded-lg bg-[#6741FF] py-3 text-base font-semibold text-white transition-colors hover:bg-[#5634E6] disabled:bg-gray-400'
				>
					{loading ? <Loader2 className='mx-auto h-5 w-5 animate-spin' /> : t('confirm')}
				</button>
			</div>
		</div>
	)
}

// Delete Account Confirmation Dialog
interface DeleteAccountDialogProps {
	onConfirm: () => void
	onCancel: () => void
}

function DeleteAccountDialog({ onConfirm, onCancel }: DeleteAccountDialogProps) {
	const t = useTranslations('accountSecurity')

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur' onClick={onCancel}>
			<div className='w-[300px] rounded-xl border border-black bg-black/40 p-4 backdrop-blur-xl' onClick={e => e.stopPropagation()}>
				<h3 className='mb-2 text-center text-base font-medium text-white'>{t('deleteConfirmTitle')}</h3>
				<p className='mb-6 text-center text-sm text-white/80'>{t('deleteConfirmMessage')}</p>
				<div className='flex gap-3'>
					<button
						onClick={onCancel}
						className='flex-1 rounded-lg bg-white/5 py-1 text-base font-medium text-white'
					>
						{t('cancel')}
					</button>
					<button
						onClick={onConfirm}
						className='flex-1 rounded-lg bg-transparent py-1 text-base font-medium text-[#F75353]'
					>
						{t('confirm')}
					</button>
				</div>
			</div>
		</div>
	)
}

