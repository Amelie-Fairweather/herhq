import type { IdeaCategory, IdeaScope } from "./types";

export const IDEA_CATEGORIES: { value: IdeaCategory; label: string }[] = [
  { value: "ama-speaker", label: "AMA speaker" },
  { value: "news", label: "News" },
  { value: "fundraiser", label: "Fundraiser" },
  { value: "philanthropy", label: "Philanthropy" },
  { value: "socials", label: "Socials" },
  { value: "outreach", label: "Outreach" },
  { value: "other", label: "Other" },
];

export const IDEA_SCOPES: { value: IdeaScope; label: string }[] = [
  { value: "state", label: "State" },
  { value: "national", label: "National" },
  { value: "international", label: "International" },
];

export function ideaCategoryLabel(category: IdeaCategory): string {
  return IDEA_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function ideaScopeLabel(scope: IdeaScope): string {
  return IDEA_SCOPES.find((s) => s.value === scope)?.label ?? scope;
}
