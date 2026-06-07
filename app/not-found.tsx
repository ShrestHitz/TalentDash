import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-[#EBEBEB] mb-4">404</h1>
      <h2 className="text-xl font-bold text-[#222222] mb-2">Page not found</h2>
      <p className="text-[#717171] mb-6">The page you're looking for doesn't exist.</p>
      <Link href="/" className="bg-[#FF5A5F] text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-[#e54e53] transition-colors">
        Go Home
      </Link>
    </div>
  );
}
