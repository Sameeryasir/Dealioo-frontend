import DealiooLogo from "@/app/components/brand/DealiooLogo";

/** Navy top bar, white wordmark (Dealioo-black.png asset). */
export default function AuthBrandBar() {
  return (
    <header className="brand-nav flex w-full shrink-0 items-center justify-center border-b border-white/10 px-6 py-4 sm:py-5">
      <DealiooLogo variant="dark" className="h-7 w-auto sm:h-8" priority />
    </header>
  );
}
