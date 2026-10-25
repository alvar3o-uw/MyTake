import type { Metadata } from "next";
import PasswordRecoveryForm from "../components/PasswordRecoveryForm";
export const metadata: Metadata = { title: "Password Recovery | MyTake", robots: { index: false, follow: false } };
export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ link?: string }> }) {
  const { link } = await searchParams;
  return <PasswordRecoveryForm invalidLink={link === "invalid"} />;
}
