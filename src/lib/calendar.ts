import type {
  Student,
  StudentStatus,
  StudyCalendarData,
  WeeklyLesson,
} from "@/types/calendar";

export const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${suffix}`;
}

export function getZonedDateParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
    weekday: weekdayMap[value("weekday") ?? "Sun"],
    hour: Number(value("hour")),
    minute: Number(value("minute")),
    second: Number(value("second")),
  };
}

export function getCurrentMinutes(date: Date, timezone: string) {
  const parts = getZonedDateParts(date, timezone);
  return parts.hour * 60 + parts.minute;
}

export function getOrderedDays(weekStartsOn: 0 | 1) {
  return Array.from({ length: 7 }, (_, index) => (weekStartsOn + index) % 7);
}

export function lessonsForDay(lessons: WeeklyLesson[], day: number) {
  return lessons
    .filter((lesson) => lesson.dayOfWeek === day)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

export function getStudentById(students: Student[], studentId: string) {
  return students.find((student) => student.id === studentId) ?? null;
}

export function getStudentStatuses(
  data: StudyCalendarData,
  now: Date,
): StudentStatus[] {
  const parts = getZonedDateParts(now, data.settings.timezone);
  const nowMinutes = parts.hour * 60 + parts.minute;

  return data.students.map((student) => {
    const studentLessons = data.lessons.filter(
      (lesson) => lesson.studentId === student.id,
    );
    const activeLesson =
      studentLessons.find(
        (lesson) =>
          lesson.dayOfWeek === parts.weekday &&
          timeToMinutes(lesson.startTime) <= nowMinutes &&
          nowMinutes < timeToMinutes(lesson.endTime),
      ) ?? null;

    const futureLessons = studentLessons
      .map((lesson) => {
        const dayOffset = (lesson.dayOfWeek - parts.weekday + 7) % 7;
        const startMinutes = timeToMinutes(lesson.startTime);
        const weekOffset =
          dayOffset === 0 && startMinutes <= nowMinutes ? 7 : dayOffset;

        return {
          lesson,
          minutesUntil: weekOffset * 24 * 60 + startMinutes - nowMinutes,
        };
      })
      .sort((a, b) => a.minutesUntil - b.minutesUntil);

    const nextLesson = futureLessons[0]?.lesson ?? null;
    const nextLessonLabel = nextLesson
      ? `${dayNames[nextLesson.dayOfWeek]} ${formatTime(nextLesson.startTime)}`
      : "No upcoming class";

    return {
      student,
      activeLesson,
      nextLesson,
      nextLessonLabel,
    };
  });
}

export function createLessonId(lesson: Omit<WeeklyLesson, "id">) {
  const subject = lesson.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${lesson.studentId}-${lesson.dayOfWeek}-${lesson.startTime}-${subject}`
    .replace(/:+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateCalendarData(value: unknown): StudyCalendarData {
  if (!value || typeof value !== "object") {
    throw new Error("Imported file must be a JSON object.");
  }

  const data = value as StudyCalendarData;
  if (!data.settings || !Array.isArray(data.students) || !Array.isArray(data.lessons)) {
    throw new Error("Imported file must include settings, students, and lessons.");
  }

  if (!data.settings.timezone || !data.settings.dayStart || !data.settings.dayEnd) {
    throw new Error("Settings must include timezone, dayStart, and dayEnd.");
  }

  for (const student of data.students) {
    if (!student.id || !student.name || !student.color || !student.schoolClass) {
      throw new Error("Every pupil must include id, name, color, and schoolClass.");
    }
  }

  const studentIds = new Set(data.students.map((student) => student.id));
  for (const lesson of data.lessons) {
    if (
      !lesson.id ||
      !lesson.studentId ||
      !lesson.subject ||
      !lesson.location ||
      !lesson.startTime ||
      !lesson.endTime
    ) {
      throw new Error("Every lesson must include id, pupil, subject, location, start, and end.");
    }

    if (!studentIds.has(lesson.studentId)) {
      throw new Error(`Lesson "${lesson.subject}" uses an unknown pupil.`);
    }

    if (lesson.dayOfWeek < 0 || lesson.dayOfWeek > 6) {
      throw new Error("Lesson dayOfWeek must be between 0 and 6.");
    }

    if (timeToMinutes(lesson.startTime) >= timeToMinutes(lesson.endTime)) {
      throw new Error(`Lesson "${lesson.subject}" must end after it starts.`);
    }
  }

  return data;
}
