import {
  loadProfileContent,
  profileLoadErrorMessage,
  type ReviewMediaMeta,
} from "@/lib/profile-server";
import ProfileHub from "@/src/components/profile/ProfileHub";
import { auth } from "@/src/lib/auth";
import {
  getDisplayUsername,
  getRoleFromAccessToken,
} from "@/src/lib/profile-display";

/** Profile hub — server loads partner API data; client handles edit/delete. */
export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user || !session.accessToken) {
    return <ProfileHub />;
  }

  const username = getDisplayUsername(
    session.user.name,
    session.user.email,
    session.accessToken,
  );
  const sub = session.user.id ?? "—";
  const role = getRoleFromAccessToken(session.accessToken);

  let initialRatings: Awaited<ReturnType<typeof loadProfileContent>>["ratings"] =
    [];
  let initialReviews: Awaited<ReturnType<typeof loadProfileContent>>["reviews"] =
    [];
  let reviewMetaLookup: Record<string, ReviewMediaMeta> = {};
  let initialLoadError: string | null = null;

  try {
    const content = await loadProfileContent();
    initialRatings = content.ratings;
    initialReviews = content.reviews;
    reviewMetaLookup = content.reviewMetaLookup;
  } catch (err) {
    initialLoadError = profileLoadErrorMessage(err);
  }

  return (
    <ProfileHub
      serverAuthenticated
      username={username}
      sub={sub}
      role={role}
      initialRatings={initialRatings}
      initialReviews={initialReviews}
      reviewMetaLookup={reviewMetaLookup}
      initialLoadError={initialLoadError}
    />
  );
}
