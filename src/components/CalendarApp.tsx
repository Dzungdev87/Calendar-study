"use client";

import {
  CalendarDays,
  Clock3,
  Download,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  createLessonId,
  dayNames,
  formatTime,
  getCurrentMinutes,
  getOrderedDays,
  getStudentById,
  getStudentStatuses,
  getZonedDateParts,
  lessonsForDay,
  minutesToTime,
  timeToMinutes,
  validateCalendarData,
} from "@/lib/calendar";
import type { Student, StudyCalendarData, WeeklyLesson } from "@/types/calendar";

type CalendarAppProps = {
  seedData: StudyCalendarData;
};

const emptyLesson = (studentId: string): WeeklyLesson => ({
  id: "",
  studentId,
  subject: "",
  teacher: "",
  location: "",
  dayOfWeek: 1,
  startTime: "17:00",
  endTime: "18:00",
  notes: "",
});

export default function CalendarApp({ seedData }: CalendarAppProps) {
  const [data, setData] = useState<StudyCalendarData>(seedData);
  const [now, setNow] = useState(() => new Date());
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
    seedData.lessons[0]?.id ?? null,
  );
  const [editingLesson, setEditingLesson] = useState<WeeklyLesson>(
    seedData.lessons[0] ?? emptyLesson(seedData.students[0]?.id ?? ""),
  );
  const [activePanel, setActivePanel] = useState<"lesson" | "pupils">("lesson");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const orderedDays = useMemo(
    () => getOrderedDays(data.settings.weekStartsOn),
    [data.settings.weekStartsOn],
  );
  const statuses = useMemo(() => getStudentStatuses(data, now), [data, now]);
  const currentParts = getZonedDateParts(now, data.settings.timezone);
  const currentMinutes = getCurrentMinutes(now, data.settings.timezone);
  const startMinutes = timeToMinutes(data.settings.dayStart);
  const endMinutes = timeToMinutes(data.settings.dayEnd);
  const totalRange = Math.max(60, endMinutes - startMinutes);
  const selectedLesson = data.lessons.find((lesson) => lesson.id === selectedLessonId);

  function selectLesson(lesson: WeeklyLesson) {
    setSelectedLessonId(lesson.id);
    setEditingLesson(lesson);
    setActivePanel("lesson");
    setMessage("");
  }

  function newLesson() {
    const lesson = emptyLesson(data.students[0]?.id ?? "");
    setSelectedLessonId(null);
    setEditingLesson(lesson);
    setActivePanel("lesson");
    setMessage("");
  }

  function saveLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const normalized = {
        ...editingLesson,
        id: editingLesson.id || createLessonId(editingLesson),
      };
      validateCalendarData({
        ...data,
        lessons: selectedLessonId
          ? data.lessons.map((lesson) =>
              lesson.id === selectedLessonId ? normalized : lesson,
            )
          : [...data.lessons, normalized],
      });
      setData((current) => ({
        ...current,
        lessons: selectedLessonId
          ? current.lessons.map((lesson) =>
              lesson.id === selectedLessonId ? normalized : lesson,
            )
          : [...current.lessons, normalized],
      }));
      setSelectedLessonId(normalized.id);
      setEditingLesson(normalized);
      setMessage("Lesson saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lesson could not be saved.");
    }
  }

  function deleteLesson() {
    if (!selectedLessonId) return;
    setData((current) => ({
      ...current,
      lessons: current.lessons.filter((lesson) => lesson.id !== selectedLessonId),
    }));
    setSelectedLessonId(null);
    setEditingLesson(emptyLesson(data.students[0]?.id ?? ""));
    setMessage("Lesson deleted.");
  }

  function updateStudent(studentId: string, field: keyof Student, value: string) {
    setData((current) => ({
      ...current,
      students: current.students.map((student) =>
        student.id === studentId ? { ...student, [field]: value } : student,
      ),
    }));
  }

  function exportJson() {
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "study-calendar.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("JSON exported.");
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = validateCalendarData(JSON.parse(text));
      setData(imported);
      setSelectedLessonId(imported.lessons[0]?.id ?? null);
      setEditingLesson(imported.lessons[0] ?? emptyLesson(imported.students[0]?.id ?? ""));
      setMessage("JSON imported.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      event.target.value = "";
    }
  }

  function resetSeed() {
    setData(seedData);
    setSelectedLessonId(seedData.lessons[0]?.id ?? null);
    setEditingLesson(seedData.lessons[0] ?? emptyLesson(seedData.students[0]?.id ?? ""));
    setMessage("Seed data restored.");
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                <CalendarDays className="h-4 w-4" />
                Weekly study calendar
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
                Calendar Study
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="icon-button" type="button" onClick={newLesson} title="Add lesson">
                <Plus className="h-5 w-5" />
              </button>
              <label className="icon-button cursor-pointer" title="Import JSON">
                <Upload className="h-5 w-5" />
                <input className="sr-only" type="file" accept="application/json" onChange={importJson} />
              </label>
              <button className="icon-button" type="button" onClick={exportJson} title="Export JSON">
                <Download className="h-5 w-5" />
              </button>
              <button className="icon-button" type="button" onClick={resetSeed} title="Reset seed">
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
            <div className="rounded-md border border-slate-200 bg-slate-950 p-4 text-white">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Clock3 className="h-4 w-4" />
                {data.settings.timezone}
              </div>
              <div className="mt-3 text-4xl font-semibold tabular-nums">
                {currentParts.hour.toString().padStart(2, "0")}:
                {currentParts.minute.toString().padStart(2, "0")}
              </div>
              <div className="mt-1 text-sm text-slate-300">
                {dayNames[currentParts.weekday]}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {statuses.map((status) => {
                const lesson = status.activeLesson ?? status.nextLesson;
                return (
                  <article key={status.student.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold">{status.student.name}</h2>
                        <p className="text-sm text-slate-500">{status.student.schoolClass}</p>
                      </div>
                      <span
                        className="h-4 w-4 rounded-full border border-white shadow"
                        style={{ backgroundColor: status.student.color }}
                      />
                    </div>
                    <div className="mt-4 min-h-24 rounded-md bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {status.activeLesson ? "Now" : "Next"}
                      </p>
                      <p className="mt-1 text-base font-semibold">
                        {lesson ? lesson.subject : "No class"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {status.activeLesson
                          ? `${formatTime(status.activeLesson.startTime)} - ${formatTime(status.activeLesson.endTime)}`
                          : status.nextLessonLabel}
                      </p>
                      {lesson ? (
                        <p className="mt-2 flex items-center gap-1 text-sm text-slate-600">
                          <MapPin className="h-4 w-4" />
                          {lesson.location}
                        </p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-soft">
          <div className="grid min-w-[760px] grid-cols-7 border-b border-slate-200 bg-slate-50">
            {orderedDays.map((day) => (
              <div key={day} className="border-r border-slate-200 px-3 py-3 last:border-r-0">
                <p className="text-sm font-semibold">{dayNames[day]}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <div className="grid min-w-[760px] grid-cols-7">
              {orderedDays.map((day) => (
                <div key={day} className="relative min-h-[620px] border-r border-slate-200 bg-white px-2 py-2 last:border-r-0">
                  {day === currentParts.weekday ? (
                    <div
                      className="absolute left-0 right-0 z-10 border-t-2 border-rose-500"
                      style={{
                        top: `${Math.max(0, Math.min(100, ((currentMinutes - startMinutes) / totalRange) * 100))}%`,
                      }}
                    />
                  ) : null}
                  <div className="pointer-events-none absolute inset-0">
                    {Array.from({ length: Math.floor(totalRange / 60) + 1 }, (_, index) => (
                      <div
                        key={index}
                        className="absolute left-0 right-0 border-t border-slate-100"
                        style={{ top: `${(index * 60 * 100) / totalRange}%` }}
                      />
                    ))}
                  </div>
                  {lessonsForDay(data.lessons, day).map((lesson) => {
                    const student = getStudentById(data.students, lesson.studentId);
                    const top = ((timeToMinutes(lesson.startTime) - startMinutes) / totalRange) * 100;
                    const height = ((timeToMinutes(lesson.endTime) - timeToMinutes(lesson.startTime)) / totalRange) * 100;
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        className={`calendar-event ${selectedLessonId === lesson.id ? "ring-2 ring-slate-900" : ""}`}
                        style={{
                          top: `${Math.max(0, top)}%`,
                          height: `${Math.max(7, height)}%`,
                          borderColor: student?.color,
                          background: `${student?.color ?? "#334155"}17`,
                        }}
                        onClick={() => selectLesson(lesson)}
                      >
                        <span className="text-xs font-semibold text-slate-500">
                          {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                        </span>
                        <span className="mt-1 block truncate text-sm font-semibold">{lesson.subject}</span>
                        <span className="block truncate text-xs text-slate-600">{student?.name} · {lesson.location}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
          <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
            <button
              className={`panel-tab ${activePanel === "lesson" ? "bg-white shadow-sm" : ""}`}
              type="button"
              onClick={() => setActivePanel("lesson")}
            >
              <Pencil className="h-4 w-4" />
              Lesson
            </button>
            <button
              className={`panel-tab ${activePanel === "pupils" ? "bg-white shadow-sm" : ""}`}
              type="button"
              onClick={() => setActivePanel("pupils")}
            >
              <Users className="h-4 w-4" />
              Pupils
            </button>
          </div>

          {activePanel === "lesson" ? (
            <form className="mt-4 space-y-3" onSubmit={saveLesson}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{selectedLesson ? "Edit lesson" : "New lesson"}</h2>
                {selectedLessonId ? (
                  <button className="icon-button-small text-rose-700" type="button" onClick={deleteLesson} title="Delete lesson">
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <Field label="Subject" value={editingLesson.subject} onChange={(value) => setEditingLesson({ ...editingLesson, subject: value })} required />
              <SelectField label="Pupil" value={editingLesson.studentId} onChange={(value) => setEditingLesson({ ...editingLesson, studentId: value })}>
                {data.students.map((student) => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </SelectField>
              <SelectField label="Day" value={String(editingLesson.dayOfWeek)} onChange={(value) => setEditingLesson({ ...editingLesson, dayOfWeek: Number(value) })}>
                {dayNames.map((name, index) => (
                  <option key={name} value={index}>{name}</option>
                ))}
              </SelectField>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start" type="time" value={editingLesson.startTime} onChange={(value) => setEditingLesson({ ...editingLesson, startTime: value })} required />
                <Field label="End" type="time" value={editingLesson.endTime} onChange={(value) => setEditingLesson({ ...editingLesson, endTime: value })} required />
              </div>
              <Field label="Teacher" value={editingLesson.teacher} onChange={(value) => setEditingLesson({ ...editingLesson, teacher: value })} />
              <Field label="Location" value={editingLesson.location} onChange={(value) => setEditingLesson({ ...editingLesson, location: value })} required />
              <label className="block">
                <span className="form-label">Notes</span>
                <textarea className="form-input min-h-20 resize-y" value={editingLesson.notes ?? ""} onChange={(event) => setEditingLesson({ ...editingLesson, notes: event.target.value })} />
              </label>
              <button className="primary-button" type="submit">Save lesson</button>
            </form>
          ) : (
            <div className="mt-4 space-y-4">
              {data.students.map((student) => (
                <div key={student.id} className="rounded-md border border-slate-200 p-3">
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      className="h-9 w-12 rounded border border-slate-300 bg-white"
                      type="color"
                      value={student.color}
                      onChange={(event) => updateStudent(student.id, "color", event.target.value)}
                      aria-label={`${student.name} color`}
                    />
                    <Field label="Name" value={student.name} onChange={(value) => updateStudent(student.id, "name", value)} required />
                  </div>
                  <Field label="Class" value={student.schoolClass} onChange={(value) => updateStudent(student.id, "schoolClass", value)} required />
                  <label className="mt-3 block">
                    <span className="form-label">Notes</span>
                    <textarea className="form-input min-h-16 resize-y" value={student.notes ?? ""} onChange={(event) => updateStudent(student.id, "notes", event.target.value)} />
                  </label>
                </div>
              ))}
            </div>
          )}

          {message ? (
            <div className="mt-4 flex items-start justify-between gap-3 rounded-md bg-slate-100 p-3 text-sm text-slate-700">
              <span>{message}</span>
              <button type="button" onClick={() => setMessage("")} title="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="form-label">{label}</span>
      <input
        className="form-input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="form-label">{label}</span>
      <select
        className="form-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}
