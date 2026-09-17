import { IdentityProvider } from "@/components/identity-provider";
import { Shell } from "@/components/shell";
import { DocumentPage } from "@/components/document-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <IdentityProvider><Shell><DocumentPage id={id} /></Shell></IdentityProvider>;
}
