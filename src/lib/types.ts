export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  location: string;
  createdBy: string;
  createdAt: string;
};

export type ApplicationStatus = "open" | "awarded" | "archived";

export type Application = {
  id: string;
  nameAndGrade: string;
  schoolTownState: string;
  coLeaders: string;
  contact: string; // private
  heardAbout: string;
  whyStart: string;
  status: ApplicationStatus;
  awardedTo: string | null;
  awardedAt: string | null;
  submittedAt: string;
  source: "google-form" | "manual";
};

export type Bid = {
  id: string;
  applicationId: string;
  bidderName: string;
  note: string;
  createdAt: string;
};

export type WeeklyReport = {
  id: string;
  authorName: string;
  username?: string;
  weekOf: string; // YYYY-MM-DD (Monday)
  wins: string;
  blockers: string;
  nextWeek: string;
  hoursSpent: number;
  createdAt: string;
  updatedAt?: string;
};

export type Store = {
  events: CalendarEvent[];
  applications: Application[];
  bids: Bid[];
};
