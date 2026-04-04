"use client";

import { signIn, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";

export default function SignInPage() {
  const { data: session } = useSession();

  if (session) {
    redirect("/");
  }

  return (
    <AppLayout>
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="zissou-heading text-xl text-tracksuit-red font-black mb-6">
          Archivist Access
        </h1>
        <p className="zissou-mono text-sm text-inkstain/60 mb-8">
          Authorized personnel only.
        </p>
        <button
          onClick={() => signIn("google")}
          className="zissou-mono text-sm uppercase px-6 py-3 bg-inkstain text-cream zissou-border hover:bg-tracksuit-red transition-none"
        >
          Sign in with Google
        </button>
      </div>
    </AppLayout>
  );
}
