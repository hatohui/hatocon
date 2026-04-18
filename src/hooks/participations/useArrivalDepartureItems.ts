import { useMemo } from "react";

import type { EventActivity, MemberUser } from "@/types/activity.d";
import type { ParticipationParticipant } from "@/types/participation.d";

export function useArrivalDepartureItems({
  participants,
  members,
  currentUserId,
  participantUser,
  participationId,
  participationFrom,
  participationTo,
  participationEntryFlight,
  participationExitFlight,
  isOwner,
}: {
  participants: ParticipationParticipant[];
  members: MemberUser[];
  currentUserId?: string | null;
  participantUser?: MemberUser | null;
  participationId: string;
  participationFrom: Date | string | null;
  participationTo: Date | string | null;
  participationEntryFlight?: string | null;
  participationExitFlight?: string | null;
  isOwner: boolean;
}): EventActivity[] {
  return useMemo(() => {
    if (participants.length > 0) {
      const items: EventActivity[] = [];

      for (const p of participants) {
        if (p.isAlreadyHere) continue;

        const isMe = p.userId === currentUserId;
        const memberName = p.user.name;
        const arrivalLabel = isMe ? "You arrive" : `${memberName} arrives`;
        const departureLabel = isMe ? "You depart" : `${memberName} departs`;
        const isEditable = isOwner || isMe;

        if (p.from) {
          items.push({
            id: `arrival-${p.userId}`,
            name: arrivalLabel,
            from: p.from,
            to: p.from,
            location: null,
            locationUrl: null,
            imageUrl: null,
            involvedPeople: [p.userId],
            note: null,
            media: [],
            isSynthetic: true,
            isTravelItem: true,
            flightNumber: p.entryFlight ?? null,
            ...(isEditable
              ? { editableDateField: "from" as const, participationId: p.id }
              : {}),
          });
        }

        if (p.to) {
          items.push({
            id: `departure-${p.userId}`,
            name: departureLabel,
            from: p.to,
            to: p.to,
            location: null,
            locationUrl: null,
            imageUrl: null,
            involvedPeople: [p.userId],
            note: null,
            media: [],
            isSynthetic: true,
            isTravelItem: true,
            flightNumber: p.exitFlight ?? null,
            ...(isEditable
              ? { editableDateField: "to" as const, participationId: p.id }
              : {}),
          });
        }
      }

      const mergeByTime = (
        src: EventActivity[],
        kind: "arriving" | "departing",
      ): EventActivity[] => {
        const byTime = new Map<number, EventActivity[]>();
        for (const item of src) {
          const t = new Date(item.from).getTime();
          const bucket = byTime.get(t) ?? [];
          bucket.push(item);
          byTime.set(t, bucket);
        }
        return Array.from(byTime.values()).map((bucket) => {
          if (bucket.length === 1) return bucket[0];
          const allUserIds = bucket.flatMap((b) => b.involvedPeople);
          const hasMe = allUserIds.includes(currentUserId ?? "");
          const otherCount = hasMe ? allUserIds.length - 1 : allUserIds.length;
          let name: string;
          if (kind === "arriving") {
            name =
              allUserIds.length === participants.length
                ? "Everyone arrives"
                : hasMe && otherCount === 1
                  ? `You & ${members.find((m) => allUserIds.find((id) => id !== currentUserId && id === m.id))?.name ?? "1 other"} arrive`
                  : hasMe
                    ? `You & ${otherCount} others arrive`
                    : `${allUserIds.length} members arrive`;
          } else {
            name =
              hasMe && otherCount === 1
                ? `You & ${members.find((m) => allUserIds.find((id) => id !== currentUserId && id === m.id))?.name ?? "1 other"} depart`
                : hasMe
                  ? `You & ${otherCount} others depart`
                  : `${allUserIds.length} members depart`;
          }
          const editableBucket = bucket.filter((b) => b.editableDateField);
          const mergedMembers =
            editableBucket.length > 1
              ? editableBucket.map((b) => ({
                  userId: b.involvedPeople[0],
                  participationId: b.participationId!,
                  name:
                    members.find((m) => m.id === b.involvedPeople[0])?.name ??
                    b.involvedPeople[0],
                  dateField: b.editableDateField as "from" | "to",
                  datetime: b.from,
                }))
              : undefined;
          return {
            ...bucket[0],
            id: `${kind === "arriving" ? "arrival" : "departure"}-group-${new Date(bucket[0].from).getTime()}`,
            name,
            involvedPeople: allUserIds,
            isTravelItem: true as const,
            editableDateField:
              editableBucket.length === 1
                ? editableBucket[0].editableDateField
                : undefined,
            participationId:
              editableBucket.length === 1
                ? editableBucket[0].participationId
                : undefined,
            mergedMembers,
          };
        });
      };

      const arrivalItems = items.filter((i) => i.id.startsWith("arrival-"));
      const departureItems = items.filter((i) => i.id.startsWith("departure-"));
      const otherItems = items.filter(
        (i) => !i.id.startsWith("arrival-") && !i.id.startsWith("departure-"),
      );

      return [
        ...mergeByTime(arrivalItems, "arriving"),
        ...mergeByTime(departureItems, "departing"),
        ...otherItems,
      ];
    }

    // Fallback: only the current participation
    const isOwnParticipation =
      !participantUser || participantUser.id === currentUserId;
    const arrivalName = isOwnParticipation
      ? "You arrive"
      : `${participantUser!.name} arrives`;
    const departureName = isOwnParticipation
      ? "You depart"
      : `${participantUser!.name} departs`;
    const participantTag = participantUser ? [participantUser.id] : [];

    return [
      ...(participationFrom
        ? [
            {
              id: "arrival",
              name: arrivalName,
              from: participationFrom,
              to: participationFrom,
              location: null,
              locationUrl: null,
              imageUrl: null,
              involvedPeople: participantTag,
              note: null as null,
              media: [],
              isSynthetic: true as const,
              isTravelItem: true as const,
              flightNumber: participationEntryFlight ?? null,
              editableDateField: "from" as const,
              participationId,
            },
          ]
        : []),
      ...(participationTo
        ? [
            {
              id: "departure",
              name: departureName,
              from: participationTo,
              to: participationTo,
              location: null,
              locationUrl: null,
              imageUrl: null,
              involvedPeople: participantTag,
              note: null as null,
              media: [],
              isSynthetic: true as const,
              isTravelItem: true as const,
              flightNumber: participationExitFlight ?? null,
              editableDateField: "to" as const,
              participationId,
            },
          ]
        : []),
    ];
  }, [
    participants,
    members,
    currentUserId,
    participantUser,
    participationId,
    participationFrom,
    participationTo,
    participationEntryFlight,
    participationExitFlight,
    isOwner,
  ]);
}
