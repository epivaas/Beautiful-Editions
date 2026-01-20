import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-6xl font-serif text-[#8b6f47] mb-4">404</h1>
      <h2 className="text-2xl font-serif text-[#8b6f47] mb-4">
        Page Not Found
      </h2>
      <p className="text-[#6b6b6b] mb-8">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-[#8b6f47] text-white rounded hover:bg-[#6b5230] transition"
      >
        Return Home
      </Link>
    </div>
  );
}




