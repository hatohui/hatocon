import Link from "next/link";
import { Button } from "@/components/ui/button";

const NotFoundPage = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-8xl font-bold text-red-500">404</p>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Button className="bg-red-500" asChild>
        <Link href="/">Go back home</Link>
      </Button>
    </main>
  );
};

export default NotFoundPage;
