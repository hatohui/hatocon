import axios from "axios";

type ApiOk<T> = { data: T };

export type WorkScheduleData = {
  id?: string;
  sunday: boolean;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
};

export type ScheduleExceptionData = {
  id: string;
  date: string;
  isWorkDay: boolean;
  reason: string | null;
  createdAt: string;
};

export type CustomHolidayData = {
  id: string;
  date: string;
  name: string;
  createdAt: string;
};

export type HolidayData = {
  id: string;
  date: string;
  description: string;
  country: string | null;
  isGlobal: boolean;
  isRecurring: boolean;
  isLunar: boolean;
};

const scheduleService = {
  getWorkSchedule: () =>
    axios.get<ApiOk<WorkScheduleData>>("/api/work-schedule"),

  updateWorkSchedule: (data: WorkScheduleData) =>
    axios.put<ApiOk<WorkScheduleData>>("/api/work-schedule", data),

  getScheduleExceptions: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return axios.get<ApiOk<ScheduleExceptionData[]>>(
      `/api/schedule-exceptions?${params}`,
    );
  },

  createScheduleException: (data: {
    date: string;
    isWorkDay: boolean;
    reason?: string;
  }) => axios.post<ApiOk<ScheduleExceptionData>>("/api/schedule-exceptions", data),

  deleteScheduleException: (id: string) =>
    axios.delete(`/api/schedule-exceptions/${id}`),

  getCustomHolidays: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return axios.get<ApiOk<CustomHolidayData[]>>(
      `/api/custom-holidays?${params}`,
    );
  },

  createCustomHoliday: (data: { date: string; name: string }) =>
    axios.post<ApiOk<CustomHolidayData>>("/api/custom-holidays", data),

  deleteCustomHoliday: (id: string) =>
    axios.delete(`/api/custom-holidays/${id}`),

  getHolidays: (from: string, to: string) => {
    const params = new URLSearchParams({ from, to });
    return axios.get<ApiOk<HolidayData[]>>(`/api/holidays?${params}`);
  },
};

export { scheduleService };
