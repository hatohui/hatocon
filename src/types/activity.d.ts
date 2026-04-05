import type { Activity, ActivityMedia } from "@prisma/client";

export type ActivityCreateDTO = {
  name: string;
  from: Date | string;
  to: Date | string;
  location?: string;
  locationUrl?: string;
  involvedPeople: string[];
  isExcludeMode?: boolean;
  note?: string;
  imageUrl?: string;
};

export type ActivityUpdateDTO = Partial<ActivityCreateDTO>;

export type ActivityMediaDTO = {
  id: string;
  activityId: string;
  url: string;
  caption?: string | null;
  uploadedBy: string;
  createdAt: Date;
};

export type ActivityWithMedia = Activity & {
  media: ActivityMediaDTO[];
};

export type ActivityDetail = Activity & {
  media: ActivityMediaDTO[];
  involvedUsers?: {
    id: string;
    name: string;
    image: string | null;
    email: string;
  }[];
};

export type MemberUser = {
  id: string;
  name: string;
  image: string | null;
  email: string;
};

export type EventProp = {
  id: string;
  title: string;
  startAt: Date | string;
  endAt: Date | string;
  location: string | null;
  locationUrl: string | null;
  image: string | null;
} | null;

export type EventActivity = {
  id: string;
  name: string;
  from: Date | string;
  to: Date | string;
  location: string | null;
  locationUrl: string | null;
  imageUrl: string | null;
  involvedPeople: string[];
  isExcludeMode?: boolean;
  note: null;
  media: ActivityMediaDTO[];
  isSynthetic: true;
  /** Flight number for this arrival/departure entry, e.g. "TGW517" */
  flightNumber?: string | null;
  /** True for all arrival/departure items regardless of editability (used for dot color) */
  isTravelItem?: true;
  /** "from" or "to" if this is an editable arrival/departure item (single person) */
  editableDateField?: "from" | "to";
  /** Which participation record to PATCH when editing this item */
  participationId?: string;
  /** For merged cards: per-member edit targets */
  mergedMembers?: Array<{
    userId: string;
    participationId: string;
    name: string;
    dateField: "from" | "to";
    datetime: Date | string;
  }>;
};

export type DisplayActivity = ActivityWithMedia | EventActivity;
