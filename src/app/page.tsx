import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm lg:flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-center mb-8">Symposium Attendance System</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-lg">
          <Link href="/register" className="w-full">
            <Button className="w-full h-24 text-lg" variant="default">
              Participant Registration
            </Button>
          </Link>

          <Link href="/login" className="w-full">
            <Button className="w-full h-24 text-lg" variant="outline">
              Staff Login
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
