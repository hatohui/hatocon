import type { Activity, ActivityMedia } from "@prisma/client";

export type ActivityCreateDTO = {
  name: string;
  from: Date | string;
  to: Date | string;
  location?: string;
  locationUrl?: string;
  involvedPeople: string[];
  note?: string;
  imageUrl?: string;
  sortOrder?: number;
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
