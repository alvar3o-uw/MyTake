import type { Metadata } from "next";
import AccountPage from "../components/AccountPage";

export const metadata: Metadata = { title: "Sign In | MyTake" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ confirmation?: string }> }) {
  const { confirmation } = await searchParams;
  return <AccountPage mode="sign-in" confirmationFailed={confirmation === "failed"} />;
}
