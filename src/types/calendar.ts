export type CalendarSettings = {
  timezone: string;
  weekStartsOn: 0 | 1;
  dayStart: string;
  dayEnd: string;
};

export type Student = {
  id: string;
  name: string;
  schoolClass: string;
  color: string;
  notes?: string;
};

export type LessonException = {
  date: string;
  type: "cancel" | "reschedule";
  startTime?: string;
  endTime?: string;
  location?: string;
};

export type WeeklyLesson = {
  id: string;
  studentId: string;
  subject: string;
  teacher: string;
  location: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  notes?: string;
  exceptions?: LessonException[];
};

export type StudyCalendarData = {
  settings: CalendarSettings;
  students: Student[];
  lessons: WeeklyLesson[];
};

export type StudentStatus = {
  student: Student;
  activeLesson: WeeklyLesson | null;
  nextLesson: WeeklyLesson | null;
  nextLessonLabel: string;
};
