import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] text-[#0F172A] p-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0E9AA7]/10 text-[#0E9AA7] mb-4">
          <Compass className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black">404 - Page Not Found</h1>
        <p className="mt-2 text-sm text-[#64748B] max-w-sm">
          The requested page could not be located on AirTrace Madhya Pradesh.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1F3A5F] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
        >
          <Home className="h-4 w-4" />
          <span>Go to Home</span>
        </Link>
      </body>
    </html>
  );
}
