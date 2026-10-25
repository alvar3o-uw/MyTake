import type { Metadata } from "next";
import AccountPage from "../components/AccountPage";

export const metadata: Metadata = { title: "Sign In | MyTake" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ confirmation?: string; password?: string }> }) {
  const { confirmation, password } = await searchParams;
  return <AccountPage mode="sign-in" confirmationFailed={confirmation === "failed"} passwordUpdated={password === "updated"} />;
}
