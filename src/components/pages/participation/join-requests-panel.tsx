"use client";

import { toast } from "sonner";
import { UserCheck, UserX } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  useJoinRequests,
  useApproveJoinRequest,
  useRejectJoinRequest,
} from "@/hooks/participations/useParticipationGroup";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function JoinRequestsPanel({
  participationId,
}: {
  participationId: string;
}) {
  const { data: requests, isLoading } = useJoinRequests(participationId);
  const approve = useApproveJoinRequest();
  const reject = useRejectJoinRequest();

  const handleApprove = (requestId: string) => {
    approve.mutate(
      { participationId, requestId },
      {
        onSuccess: () => toast.success("Request approved"),
        onError: () => toast.error("Failed to approve"),
      },
    );
  };

  const handleReject = (requestId: string) => {
    reject.mutate(
      { participationId, requestId },
      {
        onSuccess: () => toast.success("Request rejected"),
        onError: () => toast.error("Failed to reject"),
      },
    );
  };

  if (isLoading) return null;
  if (!requests?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm">Pending Requests</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {requests.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((req) => (
          <div key={req.id} className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={req.user.image ?? undefined} />
              <AvatarFallback className="text-xs">
                {initials(req.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{req.user.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {req.user.email}
              </p>
            </div>
            <div className="flex gap-1.5">
              <Button
                size="icon"
                variant="default"
                className="h-7 w-7"
                onClick={() => handleApprove(req.id)}
                disabled={approve.isPending}
              >
                <UserCheck className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() => handleReject(req.id)}
                disabled={reject.isPending}
              >
                <UserX className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
