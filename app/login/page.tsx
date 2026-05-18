import { Suspense } from "react";
import Link from "next/link";
import AuthForm from "@/components/auth/auth-form";

// Sign-in page. Renders the shared auth form in "sign-in" mode.
export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-pink-600 font-bold text-2xl tracking-tight"
          >
            mycard.to
          </Link>
          <h1 className="mt-6 text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-slate-600 text-sm">
            Sign in to edit your media kit.
          </p>
        </div>
        <Suspense fallback={null}>
          <AuthForm mode="sign-in" />
        </Suspense>
        <p className="mt-6 text-center text-sm text-slate-600">
          New here?{" "}
          <Link href="/signup" className="text-pink-600 font-semibold">
            Create a free kit
          </Link>
        </p>
      </div>
    </main>
  );
}
