import seedData from "@/../data/study-calendar.json";
import CalendarApp from "@/components/CalendarApp";
import type { StudyCalendarData } from "@/types/calendar";

export default function Home() {
  return <CalendarApp seedData={seedData as StudyCalendarData} />;
}
