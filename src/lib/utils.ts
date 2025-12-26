import clsx, { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function thousandsSeparator(n: string | number | any, sign: string = ',') {
	if (typeof n === 'string' || typeof n === 'number') {
		n = String(n)
		const reg = /\B(?=(\d{3})+($|\.))/g

		if (n.includes('.')) {
			const nArr = n.split('.')
			nArr[0] = nArr[0].replace(reg, `$&${sign}`)

			return nArr.join('.')
		}

		return n.replace(reg, `$&${sign}`)
	} else return 0
}

export function formatPrice(value: string | number, decimalPlaces: number = 2) {
	if (+value < 0 || value === '' || value === undefined) return 0
	return thousandsSeparator(toFixed(value, decimalPlaces))
}

export function toFixed(value: string | number, decimalPlaces: number = 2) {
	if (typeof value !== 'number' && typeof value !== 'string') {
		return 0
	}
	return Number(Number(value).toFixed(decimalPlaces))
}
