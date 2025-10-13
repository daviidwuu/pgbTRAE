import { AuthGuard } from "@/app/auth-guard";

export default function Page() {
  return <AuthGuard />;
}
