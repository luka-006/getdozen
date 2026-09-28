import { redirect } from "next/navigation";

export default function SignupConfirmPage() {
  redirect(
    `/signup?message=${encodeURIComponent("Check your email for the confirmation link.")}`,
  );
}
