import Image from "next/image";
import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brandLogo" aria-label="A² home">
      <Image src="/media/a2-logo.png" alt="A²" width={compact ? 58 : 78} height={compact ? 44 : 58} priority />
    </Link>
  );
}
