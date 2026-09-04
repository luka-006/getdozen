import Link from "next/link";

export function DotsTopUpLink({ className }: { className?: string }) {
  return (
    <Link href="/wallet" className={className ?? "text-[13px] font-medium text-blue"}>
      Need more Dots? Top up here
    </Link>
  );
}
