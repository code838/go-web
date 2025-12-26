'use client'

import { create } from 'zustand'
import { useEffect } from 'react'
import { X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
	id: string
	message: string
	type: ToastType
	duration?: number
}

interface ToastStore {
	toasts: Toast[]
	addToast: (message: string, type?: ToastType, duration?: number) => void
	removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
	toasts: [],
	addToast: (message, type = 'info', duration = 3000) => {
		const id = Math.random().toString(36).substring(7)
		set((state) => ({
			toasts: [...state.toasts, { id, message, type, duration }]
		}))
		
		if (duration > 0) {
			setTimeout(() => {
				set((state) => ({
					toasts: state.toasts.filter((t) => t.id !== id)
				}))
			}, duration)
		}
	},
	removeToast: (id) =>
		set((state) => ({
			toasts: state.toasts.filter((t) => t.id !== id)
		}))
}))

// Toast 组件
function ToastItem({ toast }: { toast: Toast }) {
	const { removeToast } = useToastStore()

	const bgColors = {
		success: 'bg-green-500',
		error: 'bg-red-500',
		info: 'bg-blue-500',
		warning: 'bg-yellow-500'
	}

	const icons = {
		success: '✓',
		error: '✕',
		info: 'ℹ',
		warning: '⚠'
	}

	return (
		<div
			className={`${bgColors[toast.type]} flex items-center gap-3 rounded-xl px-5 py-3.5 text-white shadow-xl animate-in slide-in-from-top-5 fade-in duration-300 backdrop-blur-sm`}
		>
			<span className="text-xl font-bold flex-shrink-0">{icons[toast.type]}</span>
			<p className="flex-1 text-[15px] font-medium leading-snug">{toast.message}</p>
			<button
				onClick={() => removeToast(toast.id)}
				className="text-white/90 hover:text-white transition-colors flex-shrink-0 active:scale-95"
			>
				<X className="h-5 w-5" />
			</button>
		</div>
	)
}

// Toast 容器
export function ToastContainer() {
	const { toasts } = useToastStore()

	if (toasts.length === 0) return null

	return (
		<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 w-[calc(100%-2rem)] max-w-md md:left-auto md:right-4 md:translate-x-0 md:max-w-sm">
			{toasts.map((toast) => (
				<ToastItem key={toast.id} toast={toast} />
			))}
		</div>
	)
}

// 导出便捷方法
export const toast = {
	success: (message: string, duration?: number) => {
		useToastStore.getState().addToast(message, 'success', duration)
	},
	error: (message: string, duration?: number) => {
		useToastStore.getState().addToast(message, 'error', duration)
	},
	info: (message: string, duration?: number) => {
		useToastStore.getState().addToast(message, 'info', duration)
	},
	warning: (message: string, duration?: number) => {
		useToastStore.getState().addToast(message, 'warning', duration)
	}
}

