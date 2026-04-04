import { Loader2Icon } from "lucide-react";

const AuthLoading = () => {
  return (
    <div className="h-screen w-screen">
      <div className="flex h-full w-full items-center justify-center">
        <Loader2Icon className="mr-2 h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          Checking authentication...
        </span>
      </div>
    </div>
  );
};

export default AuthLoading;
