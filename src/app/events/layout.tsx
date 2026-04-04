import React, { Suspense } from "react";

const EventPageLayout = ({ children }: { children: React.ReactNode }) => {
  return <Suspense>{children}</Suspense>;
};

export default EventPageLayout;
