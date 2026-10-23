import type { Metadata } from "next";
import AccountPage from "../components/AccountPage";

export const metadata: Metadata = { title: "Sign Up | MyTake" };

export default function SignUpPage() {
  return <AccountPage mode="sign-up" />;
}
