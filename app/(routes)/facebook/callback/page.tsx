import { FacebookOAuthCancelledPanel } from "@/app/components/facebook/FacebookOAuthCancelledPanel";
import { FacebookOAuthSuccessRedirect } from "@/app/components/facebook/FacebookOAuthSuccessRedirect";

type Props = {
  searchParams: Promise<{ error?: string | string[] }>;
};

/**
 * Server picks cancel vs success from Meta's query string so Not now never
 * flashes "Connecting Facebook…" while the client hydrates.
 */
export default async function FacebookCallbackPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  if (error === "access_denied") {
    return <FacebookOAuthCancelledPanel />;
  }

  return <FacebookOAuthSuccessRedirect />;
}
