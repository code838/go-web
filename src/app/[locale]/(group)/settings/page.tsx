'use client'

import { useEffect, useRef, useState } from 'react'
import EditSVG from '@/svgs/edit.svg'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import BlockiesSvg from 'blockies-react-svg'
import { updateNickName, updateContact, useUploadAvatar } from '@/requests/index'
import sendCode from '@/requests/auth'
import ChangePasswordDialog from '@/components/change-password-dialog'
import { useTranslations } from 'next-intl'
import { toast } from '@/components/toast'
import { useRouter } from '@/i18n/navigation'
import { logout } from '@/requests/auth'
import ChevronRightSVG from '@/svgs/mine/chevron-right.svg'
import ChevronSVG from '@/svgs/chevron.svg'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import WalletAvatarSVG from '@/svgs/wallet-avatar.svg'
import { LoadingSpinner } from '@/components/loading-spinner'
import { IMG_BASE_URL } from '@/consts'

export default function Page() {
	const t = useTranslations('settings')
	const tWallet = useTranslations('wallet')
	const { userInfo, userId, clearAuth, initUserInfo } = useAuth()
	const [showChangePassword, setShowChangePassword] = useState(false)
	const [showEditNickname, setShowEditNickname] = useState(false)
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
	const [isLoggingOut, setIsLoggingOut] = useState(false)
	const router = useRouter()
	const isMobile = useMediaQuery('(max-width: 1024px)')
	const fileInputRef = useRef<HTMLInputElement>(null)
	const { mutate: uploadAvatar, isPending: isUploading } = useUploadAvatar()

	const handleLogout = async () => {
		setIsLoggingOut(true)
		try {
			await logout({ userId: Number(userId), osType: 1 })
			clearAuth()
			toast.success(t('logoutSuccess'))
			router.push('/')
		} catch (error) {
			toast.error(t('logoutFailed'))
			setIsLoggingOut(false)
		}
	}

	const handleAvatarClick = () => {
		fileInputRef.current?.click()
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		// 验证文件类型
		if (!file.type.startsWith('image/')) {
			toast.error(t('invalidFileType'))
			return
		}

		// 验证文件大小（限制为5MB）
		if (file.size > 5 * 1024 * 1024) {
			toast.error(t('fileTooLarge'))
			return
		}

		const formData = new FormData()
		formData.append('file', file)

		uploadAvatar(formData, {
			onSuccess: (res) => {
				if (res.data.code === 0) {
					toast.success(t('uploadSuccess'))
					initUserInfo()
				} else {
					toast.error(res.data.msg || t('uploadFailed'))
				}
			},
			onError: () => {
				toast.error(t('uploadFailed'))
			}
		})

		// 清空input，允许重复上传同一文件
		e.target.value = ''
	}

	// Mobile view
	if (isMobile) {
		return (
			<div className='flex flex-col pb-24 lg:pb-8'>
				{/* Header with back button */}
				<div className='sticky top-0 z-10 flex items-center gap-2 bg-[#0E0E10]'>
					<button
						onClick={() => router.back()}
						className='flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 p-1.5'
					>
						<ChevronSVG className='h-5 w-5 rotate-90 text-white/80' />
					</button>
					<h1 className='flex-1 text-center text-base font-semibold text-white/80 pr-9'>{t('mobileTitle')}</h1>
				</div>

				{/* Avatar section */}
				<div className='flex justify-center py-6'>
					<div 
						className='relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border-2 border-white/5 transition-opacity hover:opacity-80'
						onClick={handleAvatarClick}
					>
						{userInfo?.photo ? (
							<img 
								src={userInfo.photo.includes('http') ? userInfo.photo : IMG_BASE_URL + userInfo.photo} 
								alt='Avatar'
								className='h-full w-full object-cover' 
							/>
						) : userId ? (
							<BlockiesSvg address={String(userId)} className='h-full w-full' />
						) : (
							<div className='h-full w-full bg-gradient-to-br from-purple-500 to-blue-500' />
						)}
						{isUploading && (
							<div className='absolute inset-0 flex items-center justify-center bg-black/50'>
								<Loader2 className='h-6 w-6 animate-spin text-white' />
							</div>
						)}
					</div>
				</div>

				{/* Hidden file input */}
				<input
					ref={fileInputRef}
					type='file'
					accept='image/*'
					className='hidden'
					onChange={handleFileChange}
				/>

				{/* User info section */}
				<div className='flex flex-col rounded-xl bg-white/5'>
					{/* Nickname - editable */}
					<div
						className='flex cursor-pointer items-center border-b border-[#0E0E10] px-6 py-4 transition-colors active:bg-white/10'
						onClick={() => setShowEditNickname(true)}
					>
						<span className='flex-1 text-sm text-white/80'>{t('nameLabel')}</span>
						<span className='text-sm text-white'>{userInfo?.nickName || 'Sandy.eth'}</span>
						<ChevronRightSVG className='ml-2 h-6 w-6 text-white/80' />
					</div>

					{/* Email - readonly */}
					<div className='flex items-center border-b border-[#0E0E10] px-6 py-4'>
						<span className='flex-1 text-sm text-white/80'>{t('emailLabel')}</span>
						<span className='text-sm text-white'>{userInfo?.email || '-'}</span>
					</div>

					{/* Phone - readonly */}
					<div className='flex items-center px-6 py-4'>
						<span className='flex-1 text-sm text-white/80'>{t('phoneLabel')}</span>
						<span className='text-sm text-white'>{userInfo?.mobile || '-'}</span>
					</div>
				</div>

				{/* Address Management */}
				<div className='mt-6 flex flex-col rounded-xl bg-white/5'>
					<div
						className='flex cursor-pointer items-center px-6 py-4 transition-colors active:bg-white/10'
						onClick={() => router.push('/wallet/address')}
					>
						<span className='flex-1 text-sm text-white'>{tWallet('addressManagement')}</span>
						<ChevronRightSVG className='h-6 w-6 text-white/80' />
					</div>
				</div>

				{/* Logout button */}
				<div className='mt-6'>
					<button
						onClick={() => setShowLogoutConfirm(true)}
						className='w-full rounded-xl border border-[#F75353] py-3 text-center text-sm font-semibold text-[#F75353] transition-colors hover:bg-[#F75353]/10'
					>
						{t('logoutAccount')}
					</button>
				</div>

				{/* Edit Nickname Dialog */}
				{showEditNickname && (
					<MobileEditNicknameDialog
						currentName={userInfo?.nickName || ''}
						onClose={() => setShowEditNickname(false)}
						onSuccess={() => {
							setShowEditNickname(false)
							initUserInfo()
						}}
					/>
				)}

				{/* Logout Confirm Dialog */}
				{showLogoutConfirm && (
					<MobileLogoutConfirmDialog
						onConfirm={() => {
							setShowLogoutConfirm(false)
							handleLogout()
						}}
						onCancel={() => setShowLogoutConfirm(false)}
					/>
				)}

				{/* Full Screen Loading */}
				{isLoggingOut && (
					<LoadingSpinner
						fullScreen
						size="lg"
						text={t('loggingOut')}
					/>
				)}
			</div>
		)
	}

	// Desktop view (original)
	return (
		<div className='flex flex-col items-start space-y-8'>
			<div className='flex items-center gap-6'>
				<figure 
					className='relative h-[96px] w-[96px] cursor-pointer rounded-full outline-3 outline-white/30 transition-opacity hover:opacity-80'
					onClick={handleAvatarClick}
				>
					{userInfo?.photo ?
						<img src={userInfo?.photo?.includes('http') ? userInfo?.photo : IMG_BASE_URL + userInfo?.photo} className='h-full w-full rounded-full object-cover' alt='Avatar' /> :
						<BlockiesSvg address={String(userId)} className='h-full w-full rounded-full' />}
					{isUploading && (
						<div className='absolute inset-0 flex items-center justify-center rounded-full bg-black/50'>
							<Loader2 className='h-6 w-6 animate-spin text-white' />
						</div>
					)}
				</figure>
				<div>
					<h2 className='text-2xl font-medium'>{userInfo?.nickName}</h2>
					<div className='text-secondary mt-2'>ID: {userId}</div>
					<button onClick={() => setShowChangePassword(true)} className='text-brand text-sm underline'>
						{t('changePassword')}
					</button>
				</div>
			</div>

			<div id='desktop-edit-name'>
				<EditName currentName={userInfo?.nickName || ''} />
			</div>

			<EditEmail currentEmail={userInfo?.email || ''} />

			<EditPhone currentPhone={userInfo?.mobile || ''} />

			{/* Hidden file input */}
			<input
				ref={fileInputRef}
				type='file'
				accept='image/*'
				className='hidden'
				onChange={handleFileChange}
			/>

			{showChangePassword && <ChangePasswordDialog onClose={() => setShowChangePassword(false)} />}
		</div>
	)
}

interface EditNameProps {
	currentName: string
}

function EditName({ currentName }: EditNameProps) {
	const t = useTranslations('settings')
	const { userId, initUserInfo } = useAuth()
	useEffect(() => {
		setName(currentName)
	}, [currentName])
	const [name, setName] = useState(currentName)
	const [editable, setEditable] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const [loading, setLoading] = useState(false)

	return (
		<div>
			<label className='text-secondary block text-sm'>{t('nameLabel')}</label>
			<div className='relative mt-1 inline-flex items-center'>
				<input
					ref={inputRef}
					disabled={!editable || loading}
					type='text'
					value={name}
					onChange={e => setName(e.target.value)}
					className='bg-panel block w-[420px] rounded-lg border py-3 pr-3 pl-6 text-sm outline-none focus:border-white/20'
				/>
				{!editable && (
					<button
						onClick={() => {
							setName('')
							setEditable(true)
							setTimeout(() => {
								inputRef.current?.focus()
							}, 100)
						}}
						className='text-subtitle bg-button absolute right-3 flex items-center gap-1 rounded-lg px-2 py-1 text-sm'>
						<EditSVG />
						{t('edit')}
					</button>
				)}

				{editable && (
					<>
						<button
							disabled={loading}
							className='bg-brand text-primary ml-3 rounded-lg px-4 py-2 font-medium disabled:bg-gray-400'
							onClick={async () => {
								if (currentName != name) {
									setLoading(true)
									await updateNickName({ userId: Number(userId), nickName: name })
										.then(res => {
											if (res.data.code === 0) {
												initUserInfo()
											}
										})
										.catch(e => void 0)
									setLoading(false)
								}

								setEditable(false)
							}}>
							{loading ? <Loader2 className='h-4 w-4 animate-spin' /> : t('done')}
						</button>
						{!loading && (
							<button
								onClick={() => {
									setName(currentName)
									setEditable(false)
								}}
								className='text-subtitle bg-button ml-3 rounded-lg px-4 py-2'>
								{t('cancel')}
							</button>
						)}
					</>
				)}
			</div>
		</div>
	)
}

interface EditEmailProps {
	currentEmail: string
}

function EditEmail({ currentEmail }: EditEmailProps) {
	const t = useTranslations('settings')
	const { userId, initUserInfo } = useAuth()
	useEffect(() => {
		setEmail(currentEmail)
	}, [currentEmail])
	const [email, setEmail] = useState(currentEmail)
	const [editable, setEditable] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const [loading, setLoading] = useState(false)
	const [code, setCode] = useState('')
	const [codeLoading, setCodeLoading] = useState(false)
	const [remaining, setRemaining] = useState(0)

	useEffect(() => {
		if (remaining <= 0) return
		const timer = setInterval(() => {
			setRemaining(prev => (prev > 0 ? prev - 1 : 0))
		}, 1000)
		return () => clearInterval(timer)
	}, [remaining])

	return (
		<div>
			<label className='text-secondary block text-sm'>{t('emailLabel')}</label>
			<div className='relative mt-1 flex items-center'>
				<input
					ref={inputRef}
					disabled={!editable || loading || codeLoading}
					type='text'
					value={email}
					onChange={e => setEmail(e.target.value)}
					className={cn('bg-panel block w-[420px] rounded-lg border py-3 pr-3 pl-6 text-sm outline-none focus:border-white/20', editable && 'w-[240px]')}
				/>
				{editable && (
					<input
						disabled={loading}
						type='text'
						value={code}
						placeholder={t('verificationCodePlaceholder')}
						className='bg-panel ml-3 block w-[160px] rounded-lg border py-3 pr-3 pl-6 text-sm outline-none focus:border-white/20'
						onChange={e => setCode(e.target.value)}
					/>
				)}

				{!editable && (
					<button
						onClick={() => {
							setEmail('')
							setEditable(true)
							setTimeout(() => {
								inputRef.current?.focus()
							}, 100)
						}}
						className='text-subtitle bg-button absolute right-3 flex items-center gap-1 rounded-lg px-2 py-1 text-sm'>
						<EditSVG />
						{currentEmail ? t('edit') : t('bind')}
					</button>
				)}

				{editable && (
					<>
						<button
							disabled={loading || codeLoading || remaining > 0 || !email}
							className='bg-brand text-primary disabled:text-subtitle ml-3 rounded-lg px-4 py-2 font-medium disabled:bg-gray-400'
							onClick={async () => {
								setCodeLoading(true)
								try {
									const res = await sendCode(1, email)
									if (res.data.code === 0) {
										toast.success(t('codeSent'))
										setRemaining(60)
										setCodeLoading(false)
									} else {
										toast.error(res.data.msg || t('sendCodeFailed'))
										setCodeLoading(false)
									}
								} catch (error) {
									toast.error(t('sendCodeFailed'))
									setCodeLoading(false)
								}
							}}>
							{codeLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : remaining > 0 ? t('sendCodeCountdown', { seconds: remaining }) : t('sendCode')}
						</button>
						<button
							disabled={loading || !code || !email}
							className='bg-brand text-primary disabled:text-subtitle ml-3 rounded-lg px-4 py-2 font-medium disabled:bg-gray-400'
							onClick={async () => {
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
										setEditable(false)
										setCode('')
										setRemaining(0)
										await initUserInfo()
									} else {
										toast.error(res.data.msg || t('updateFailed'))
									}
								} catch (error) {
									toast.error(t('updateFailed'))
								} finally {
									setLoading(false)
								}
							}}>
							{loading ? <Loader2 className='h-4 w-4 animate-spin' /> : t('done')}
						</button>
						{!loading && (
							<button
								onClick={() => {
									setEmail(currentEmail)
									setCode('')
									setRemaining(0)
									setEditable(false)
								}}
								className='text-subtitle bg-button ml-3 rounded-lg px-4 py-2'>
								{t('cancel')}
							</button>
						)}
					</>
				)}
			</div>
		</div>
	)
}

interface EditPhoneProps {
	currentPhone: string
}

function EditPhone({ currentPhone }: EditPhoneProps) {
	const t = useTranslations('settings')
	const { userId, initUserInfo } = useAuth()
	useEffect(() => {
		setPhone(currentPhone)
	}, [currentPhone])
	const [phone, setPhone] = useState(currentPhone)
	const [editable, setEditable] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const [loading, setLoading] = useState(false)
	const [code, setCode] = useState('')
	const [codeLoading, setCodeLoading] = useState(false)
	const [remaining, setRemaining] = useState(0)

	useEffect(() => {
		if (remaining <= 0) return
		const timer = setInterval(() => {
			setRemaining(prev => (prev > 0 ? prev - 1 : 0))
		}, 1000)
		return () => clearInterval(timer)
	}, [remaining])

	return (
		<div className=''>
			<label className='text-secondary block text-sm'>{t('phoneLabel')}</label>
			<div className='relative mt-1 flex items-center'>
				<input
					ref={inputRef}
					disabled={!editable || loading || codeLoading}
					type='text'
					value={phone}
					onChange={e => setPhone(e.target.value)}
					className={cn('bg-panel block w-[420px] rounded-lg border py-3 pr-3 pl-6 text-sm outline-none focus:border-white/20', editable && 'w-[240px]')}
				/>
				{editable && (
					<input
						disabled={loading}
						type='text'
						value={code}
						placeholder={t('verificationCodePlaceholder')}
						className='bg-panel ml-3 block w-[160px] rounded-lg border py-3 pr-3 pl-6 text-sm outline-none focus:border-white/20'
						onChange={e => setCode(e.target.value)}
					/>
				)}

				{!editable && (
					<button
						onClick={() => {
							setPhone('')
							setEditable(true)
							setTimeout(() => {
								inputRef.current?.focus()
							}, 100)
						}}
						className='text-subtitle bg-button absolute right-3 flex items-center gap-1 rounded-lg px-2 py-1 text-sm'>
						<EditSVG />
						{currentPhone ? t('edit') : t('bind')}
					</button>
				)}

				{editable && (
					<>
						<button
							disabled={loading || codeLoading || remaining > 0 || !phone}
							className='bg-brand text-primary disabled:text-subtitle ml-3 rounded-lg px-4 py-2 font-medium disabled:bg-gray-400'
							onClick={async () => {
								setCodeLoading(true)
								try {
									const res = await sendCode(2, phone)
									if (res.data.code === 0) {
										toast.success(t('codeSent'))
										setRemaining(60)
										setCodeLoading(false)
									} else {
										toast.error(res.data.msg || t('sendCodeFailed'))
										setCodeLoading(false)
									}
								} catch (error) {
									toast.error(t('sendCodeFailed'))
									setCodeLoading(false)
								}
							}}>
							{codeLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : remaining > 0 ? t('sendCodeCountdown', { seconds: remaining }) : t('sendCode')}
						</button>
						<button
							disabled={loading || !code || !phone}
							className='bg-brand text-primary disabled:text-subtitle ml-3 rounded-lg px-4 py-2 font-medium disabled:bg-gray-400'
							onClick={async () => {
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
										setEditable(false)
										setCode('')
										setRemaining(0)
										await initUserInfo()
									} else {
										toast.error(res.data.msg || t('updateFailed'))
									}
								} catch (error) {
									toast.error(t('updateFailed'))
								} finally {
									setLoading(false)
								}
							}}>
							{loading ? <Loader2 className='h-4 w-4 animate-spin' /> : t('done')}
						</button>
						{!loading && (
							<button
								onClick={() => {
									setPhone(currentPhone)
									setCode('')
									setRemaining(0)
									setEditable(false)
								}}
								className='text-subtitle bg-button ml-3 rounded-lg px-4 py-2'>
								{t('cancel')}
							</button>
						)}
					</>
				)}
			</div>
		</div>
	)
}

// Mobile Logout Confirm Dialog Component
interface MobileLogoutConfirmDialogProps {
	onConfirm: () => void
	onCancel: () => void
}

function MobileLogoutConfirmDialog({ onConfirm, onCancel }: MobileLogoutConfirmDialogProps) {
	const t = useTranslations('settings')

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4' onClick={onCancel}>
			<div className='w-full max-w-sm rounded-2xl bg-[#1A1A1C] p-6' onClick={e => e.stopPropagation()}>
				<h3 className='mb-4 text-center text-lg font-semibold text-white'>{t('logoutConfirmTitle')}</h3>
				<p className='mb-6 text-center text-sm text-white/80'>{t('logoutConfirmMessage')}</p>
				<div className='flex gap-3'>
					<button
						onClick={onCancel}
						className='flex-1 rounded-lg bg-white/5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10'
					>
						{t('cancel')}
					</button>
					<button
						onClick={onConfirm}
						className='flex-1 rounded-lg bg-[#F75353] py-3 text-sm font-medium text-white transition-colors hover:bg-[#F75353]/90'
					>
						{t('confirm')}
					</button>
				</div>
			</div>
		</div>
	)
}

// Mobile Edit Nickname Dialog Component
interface MobileEditNicknameDialogProps {
	currentName: string
	onClose: () => void
	onSuccess: () => void
}

function MobileEditNicknameDialog({ currentName, onClose, onSuccess }: MobileEditNicknameDialogProps) {
	const t = useTranslations('settings')
	const { userId } = useAuth()
	const [name, setName] = useState(currentName)
	const [loading, setLoading] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		setTimeout(() => {
			inputRef.current?.focus()
		}, 100)
	}, [])

	const handleSave = async () => {
		if (currentName === name) {
			onClose()
			return
		}

		setLoading(true)
		try {
			const res = await updateNickName({ userId: Number(userId), nickName: name })
			if (res.data.code === 0) {
				toast.success(t('updateSuccess'))
				onSuccess()
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
					<h3 className='text-base font-semibold text-white/80'>{t('editNickname')}</h3>
					<button
						onClick={onClose}
						className='absolute right-4 flex h-5 w-5 items-center justify-center'
					>
						<svg className='h-5 w-5 text-white/60' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
						</svg>
					</button>
				</div>

				{/* Input with clear button */}
				<div className='relative mb-2'>
					<input
						ref={inputRef}
						type='text'
						value={name}
						onChange={e => setName(e.target.value)}
						disabled={loading}
						maxLength={20}
						className='w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 pr-10 text-white outline-none placeholder:text-white/40 disabled:opacity-50'
						placeholder={t('nameLabel')}
					/>
					{name && !loading && (
						<button
							onClick={() => setName('')}
							className='absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-white/20'
						>
							<svg className='h-3 w-3 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
							</svg>
						</button>
					)}
				</div>

				{/* Hint text */}
				<p className='mb-6 text-xs text-white/40'>{t('nicknameLimitHint')}</p>

				{/* Confirm Button */}
				<button
					onClick={handleSave}
					disabled={loading || !name}
					className='w-full rounded-lg bg-[#6741FF] py-3 text-base font-semibold text-white transition-colors hover:bg-[#5634E6] disabled:bg-gray-400'
				>
					{loading ? <Loader2 className='mx-auto h-5 w-5 animate-spin' /> : t('save')}
				</button>
			</div>
		</div>
	)
}
