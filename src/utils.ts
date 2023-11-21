import { InputValue } from '@companion-module/base'

type TimeFormat = 'hh:mm:ss' | 'hh:mm:ss.ms' | 'mm:ss' | 'mm:ss.ms'

/**
 * @param red 0-255
 * @param green 0-255
 * @param blue 0-255
 * @returns RGB value encoded for Companion Bank styling
 */
export const rgb = (red: number, green: number, blue: number): number => {
  return ((red & 0xff) << 16) | ((green & 0xff) << 8) | (blue & 0xff)
}

export const formatTime = (time: number, interval: 'ms' | 's', format: TimeFormat): string => {
  const timeMS = time * (interval === 'ms' ? 1 : 1000)
  const padding = (value: number): string => (value < 10 ? '0' + value : value.toString())

  const hh = padding(Math.floor(timeMS / 3600000))
  const mm = padding(Math.floor(timeMS / 60000) % 60)
  const ss = padding(Math.floor(timeMS / 1000) % 60)
  const ms = (timeMS % 1000) / 100

  const result = `${format.includes('hh') ? `${hh}:` : ''}${mm}:${ss}${format.includes('ms') ? `.${ms}` : ''}`
  return result
}

export const formatNumber = (x: number): string => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/* NumberComparitor taken from the Behringer X32 Companion module */
export enum NumberComparitor {
  Equal = 'eq',
  NotEqual = 'ne',
  LessThan = 'lt',
  LessThanEqual = 'lte',
  GreaterThan = 'gt',
  GreaterThanEqual = 'gte',
}

/* compareNumber taken from the Behringer X32 Companion module */
export function compareNumber(
  target: InputValue | undefined,
  comparitor: InputValue | undefined,
  currentValue: number
): boolean {
  const targetValue = Number(target)
  if (isNaN(targetValue)) {
    return false
  }

  switch (comparitor) {
    case NumberComparitor.GreaterThan:
      return currentValue > targetValue
    case NumberComparitor.GreaterThanEqual:
      return currentValue >= targetValue
    case NumberComparitor.LessThan:
      return currentValue < targetValue
    case NumberComparitor.LessThanEqual:
      return currentValue <= targetValue
    case NumberComparitor.NotEqual:
      return currentValue != targetValue
    default:
      return currentValue === targetValue
  }
}
