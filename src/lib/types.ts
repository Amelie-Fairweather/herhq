export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  location: string;
  createdBy: string;
  createdAt: string;
};

export type ApplicationStatus = "open" | "awarded" | "completed" | "archived";

export type Application = {
  id: string;
  formNumber?: number | null;
  nameAndGrade: string;
  schoolTownState: string;
  coLeaders: string;
  contact: string;
  heardAbout: string;
  whyStart: string;
  status: ApplicationStatus;
  awardedTo: string | null;
  awardedAt: string | null;
  submittedAt: string;
  source: "google-form" | "manual";
};

export type BidStatus = "active" | "withdrawn" | "completed" | "passed";

export type Bid = {
  id: string;
  applicationId: string;
  bidderName: string;
  bidderUsername: string;
  status: BidStatus;
  createdAt: string;
  completedAt: string | null;
};

export type WeeklyReport = {
  id: string;
  authorName: string;
  username?: string;
  weekOf: string;
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
