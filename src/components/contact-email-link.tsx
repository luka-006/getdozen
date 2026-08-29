import Link from "next/link";
import { SITE_EMAIL } from "@/lib/site-email";

type Props = {
  className?: string;
  /** Shorter label on error pages */
  label?: string;
};

/** Opens /contact — works in browser without a mail app (mailto often hits Google search). */
export function ContactEmailLink({
  className = "text-blue",
  label = SITE_EMAIL,
}: Props) {
  return (
    <Link href="/contact" className={className}>
      {label}
    </Link>
  );
}

export { SITE_EMAIL };
