import { AuthGuard } from "@/app/auth-guard";

export default function Page() {
  return (
    <AuthGuard>
      {/* The Dashboard is now rendered inside AuthGuard, so no children are needed here. */}
    </AuthGuard>
  );
}
