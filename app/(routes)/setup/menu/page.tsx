import { redirect } from "next/navigation";

type SetupMenuAliasPageProps = {
  searchParams: Promise<{ restaurantId?: string }>;
};

export default async function SetupMenuAliasPage({
  searchParams,
}: SetupMenuAliasPageProps) {
  const params = await searchParams;
  const restaurantId = params.restaurantId?.trim();

  if (restaurantId && /^\d+$/.test(restaurantId)) {
    redirect(`/restaurant/upload-menu?restaurantId=${restaurantId}`);
  }

  redirect("/restaurant/upload-menu");
}
