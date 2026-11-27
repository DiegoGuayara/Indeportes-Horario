
export type Schedule = {
  id: string
  contractorId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  validFrom: string
  validUntil: string | null
  isActive: boolean
}
export type ScheduleResponse = { schedules: Schedule[]; total: number; page: number; limit: number }
