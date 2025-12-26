import { create } from 'zustand'

type AuthDialogType = 'login' | 'register' | 'forgot'

type AuthDialogState = {
	open: boolean
	current: AuthDialogType
	inviteCode?: string
	openDialog: (type: AuthDialogType, inviteCode?: string) => void
	closeDialog: () => void
}

export const useAuthDialogStore = create<AuthDialogState>(set => ({
	open: false,
	current: 'login',
	inviteCode: undefined,
	openDialog: (type, inviteCode) => set({ open: true, current: type, inviteCode }),
	closeDialog: () => set({ open: false, inviteCode: undefined })
}))
