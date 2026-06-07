import Link from "next/link";

export function Navbar() {
  const nav = [
    { href: "/", label: "Explore" },
    { href: "/compare", label: "Compare" },
    { href: "/salaries", label: "Salaries" },
    { href: "/salaries", label: "Reviews" },
    { href: "/companies", label: "Companies" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[var(--line)]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div className="td-container flex items-center justify-between h-14 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-[var(--ink)] font-bold text-base flex-shrink-0">
          <div className="h-8 w-8 rounded-lg bg-[var(--brand)] text-white grid place-items-center text-sm font-bold">T</div>
          <span className="font-bold">TalentDash</span>
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search companies, roles, locations..."
            className="nav-search w-full"
          />
        </div>

        {/* Nav Links */}
        <div className="hidden lg:flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className="px-3 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] rounded-md hover:bg-[#f8fafc] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="hidden sm:inline-flex px-4 py-1.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
            Sign in
          </button>
        </div>
      </div>
    </nav>
  );
}
