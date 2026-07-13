import { FacebookOAuthCancelledPanel } from "@/app/components/facebook/FacebookOAuthCancelledPanel";
import { FacebookOAuthSuccessRedirect } from "@/app/components/facebook/FacebookOAuthSuccessRedirect";

type Props = {
  searchParams: Promise<{ error?: string | string[] }>;
};

/**
 * @deprecated Use /facebook/callback — kept for FACEBOOK_REDIRECT_URI values.
 * Server picks cancel vs success so Not now never flashes "Connecting Facebook…".
 */
export default async function LegacyFacebookCallbackPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  if (error === "access_denied") {
    return <FacebookOAuthCancelledPanel />;
  }

  return <FacebookOAuthSuccessRedirect />;
}
