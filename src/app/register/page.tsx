import type { Metadata } from "next";
import { RegisterForm } from "@/components/register/RegisterForm";

export const metadata: Metadata = {
  title: "Join the team",
  description: "Fill in your details, watch your Embrione member card build live, and submit it for approval.",
};

export default function RegisterPage() {
  return (
    <>
      <header className="mb-10 max-w-2xl">
        <h1 className="bg-gradient-to-br from-fg via-eosin to-[#7aa2ff] bg-clip-text pb-2 text-5xl font-semibold leading-[1.02] text-transparent sm:text-7xl">
          Build your member card
        </h1>
        <p className="mt-4 text-lg text-dim">
          Fill in the form and your card builds itself beside it. An admin reviews every card before it reaches the team page.
        </p>
      </header>
      <RegisterForm />
    </>
  );
}
