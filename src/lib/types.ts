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
  /** 1–3 virtual meeting windows from the registration form */
  meetingAvailability: string;
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

export type IdeaCategory =
  | "ama-speaker"
  | "news"
  | "fundraiser"
  | "philanthropy"
  | "socials"
  | "outreach"
  | "other";

export type IdeaScope = "state" | "national" | "international";

export type IdeaStatus = "open" | "completed" | "archived";

export type Idea = {
  id: string;
  title: string;
  category: IdeaCategory;
  scope: IdeaScope;
  membersNeeded: number;
  slackUsername: string;
  description: string;
  status: IdeaStatus;
  createdBy: string;
  createdByUsername: string;
  createdAt: string;
  completedAt: string | null;
};

export type IdeaPledgeStatus = "active" | "withdrawn" | "completed";

export type IdeaPledge = {
  id: string;
  ideaId: string;
  bidderName: string;
  bidderUsername: string;
  status: IdeaPledgeStatus;
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
  ideas: Idea[];
  ideaPledges: IdeaPledge[];
};
