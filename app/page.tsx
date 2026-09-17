import { IdentityProvider } from "@/components/identity-provider";
import { Shell } from "@/components/shell";
import { Dashboard } from "@/components/dashboard";

export default function Home() {
  return <IdentityProvider><Shell><Dashboard /></Shell></IdentityProvider>;
}
