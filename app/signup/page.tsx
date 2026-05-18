import { Suspense } from "react";
import Link from "next/link";
import AuthForm from "@/components/auth/auth-form";

// Sign-up page. Renders the shared auth form in "sign-up" mode.
export default function SignupPage() {
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
          <h1 className="mt-6 text-2xl font-bold">Create your free kit</h1>
          <p className="mt-1 text-slate-600 text-sm">
            Takes 60 seconds. No credit card.
          </p>
        </div>
        <Suspense fallback={null}>
          <AuthForm mode="sign-up" />
        </Suspense>
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="text-pink-600 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
