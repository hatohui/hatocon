import { isAfter } from "date-fns";

export type UpcomingEntry = {
  id: string;
  name: string;
  from: Date | string;
  location?: string | null;
  /** Synthetic kind identifier, or false for real activities */
  syntheticKind: string | false;
  activityId?: string;
  editParticipationId?: string;
  dateField?: "from" | "to";
};

type Participant = {
  id: string;
  userId: string;
  from: Date | string;
  to: Date | string;
  isAlreadyHere: boolean;
  entryFlight?: string | null;
  exitFlight?: string | null;
  user: { id: string; name: string };
};

type EventInfo =
  | {
      title: string;
      startAt: Date | string;
      endAt: Date | string;
      location: string | null;
    }
  | null
  | undefined;

type Activity = {
  id: string;
  name: string;
  from: Date | string;
  location?: string | null;
};

export function buildUpcomingEntries({
  showActivityDetails,
  participants = [],
  participationFrom,
  participationTo,
  participationEntryFlight,
  participationExitFlight,
  participantUser,
  currentUserId,
  isOwner,
  participationId,
  event,
  activities,
}: {
  showActivityDetails: boolean;
  participants?: Participant[];
  participationFrom: Date | string;
  participationTo: Date | string;
  participationEntryFlight?: string | null;
  participationExitFlight?: string | null;
  participantUser?: { id: string; name: string };
  currentUserId?: string;
  isOwner: boolean;
  participationId: string;
  event?: EventInfo;
  activities?: Activity[];
}): UpcomingEntry[] {
  const perParticipantEntries: UpcomingEntry[] =
    showActivityDetails && participants.length > 0
      ? participants
          .filter((p) => !p.isAlreadyHere)
          .flatMap((p) => {
            const isMe = p.userId === currentUserId;
            const canEdit = isOwner || isMe;
            return [
              {
                id: `arrival-${p.userId}`,
                name: isMe ? "You arrive" : `${p.user.name} arrives`,
                from: p.from,
                syntheticKind: "__arrival_departure",
                editParticipationId: canEdit ? p.id : undefined,
                dateField: "from" as const,
              },
              {
                id: `departure-${p.userId}`,
                name: isMe ? "You depart" : `${p.user.name} departs`,
                from: p.to,
                syntheticKind: "__arrival_departure",
                editParticipationId: canEdit ? p.id : undefined,
                dateField: "to" as const,
              },
            ];
          })
      : showActivityDetails
        ? [
            {
              id: "arrival",
              name:
                !participantUser || participantUser.id === currentUserId
                  ? "You arrive"
                  : `${participantUser.name} arrives`,
              from: participationFrom,
              syntheticKind: "__arrival_departure",
              editParticipationId: isOwner ? participationId : undefined,
              dateField: "from" as const,
            },
            {
              id: "departure",
              name:
                !participantUser || participantUser.id === currentUserId
                  ? "You depart"
                  : `${participantUser.name} departs`,
              from: participationTo,
              syntheticKind: "__arrival_departure",
              editParticipationId: isOwner ? participationId : undefined,
              dateField: "to" as const,
            },
          ]
        : [];

  const syntheticEntries: UpcomingEntry[] = [
    ...perParticipantEntries,
    ...(event
      ? [
          {
            id: "event-start",
            name: `${event.title} starts`,
            from: event.startAt,
            location: event.location,
            syntheticKind: "__event_start",
          },
          {
            id: "event-end",
            name: `${event.title} ends`,
            from: event.endAt,
            location: event.location,
            syntheticKind: "__event_end",
          },
        ]
      : []),
  ];

  const activityEntries: UpcomingEntry[] = (activities ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    from: a.from,
    location: a.location,
    syntheticKind: false,
    activityId: a.id,
  }));

  return [...syntheticEntries, ...activityEntries]
    .filter((a) => isAfter(new Date(a.from), new Date()))
    .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime())
    .slice(0, 5);
}
