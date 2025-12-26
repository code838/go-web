import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UserInfo } from '@/requests/index'
import { getUserInfo } from '@/requests/index'

type AuthState = {
	token: string | null
	userId: string | null
	userInfo: UserInfo | null
	isHydrated: boolean
	setAuth: (payload: { token?: string | null; userId?: string | null }) => void
	setUserInfo: (userInfo: UserInfo | null) => void
	clearAuth: () => void
	initUserInfo: () => Promise<void>
	setHydrated: () => void
}

export const useAuth = create<AuthState>()(
	persist(
		(set, get) => ({
			token: null,
			userId: null,
			userInfo: null,
			isHydrated: false,
			setAuth: ({ token, userId }) =>
				set(state => ({
					token: token !== undefined ? token : state.token,
					userId: userId !== undefined ? userId : state.userId
				})),
		setUserInfo: userInfo => set({ userInfo }),
		clearAuth: () => set({ token: null, userId: null, userInfo: null }),
			initUserInfo: async () => {
				if (typeof window === 'undefined') return
				const { userId } = get()
				if (!userId) return
				try {
					const res = await getUserInfo({ userId })
					const info = (res.data as any)?.data ?? null
					set({ userInfo: info })
				} catch (err) {
					// noop
				}
			},
			setHydrated: () => set({ isHydrated: true })
		}),
		{
			name: 'auth-store',
			storage: createJSONStorage(() => localStorage),
			onRehydrateStorage: () => {
				return (state) => {
					state?.setHydrated()
				}
			}
		}
	)
)

export function getAuthToken() {
	return useAuth.getState().token
}

export function getAuthUserId() {
	return useAuth.getState().userId
}
