import { CompanionInputFieldNumber } from '@companion-module/base'

export const adScheduleSnoozeCountChoice: CompanionInputFieldNumber = {
  type: 'number',
  label: 'Ad Snoozes Available',
  id: 'adScheduleSnoozeCount',
  range: false,
  required: true,
  default: 0,
  min: 0,
  max: 3,
}

export const adScheduleNextAdCountdownMinutesChoice: CompanionInputFieldNumber = {
  type: 'number',
  label: 'Next Ad Countdown (Minutes)',
  id: 'adScheduleNextAdCountdownMinutes',
  range: false,
  required: true,
  default: 0,
  min: 0,
  max: 1000,
}

export const adSchedulePrerollFreeTimeSecondsChoice: CompanionInputFieldNumber = {
  type: 'number',
  label: 'Preroll Free Time (Seconds)',
  id: 'adSchedulePrerollFreeTimeSeconds',
  range: false,
  required: true,
  default: 0,
  min: 0,
  max: 1000,
}
