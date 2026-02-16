import { fetchAuthSession } from "aws-amplify/auth";
import toast from "react-hot-toast";

/**
 * Generates a secure share link that requires authentication
 * Recipients must login before accessing the content
 */
export async function generateAndCopyLink(params: {
  objectKey?: string;
  objectKeys?: string[];
  folderPrefix?: string;
}) {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error("Auth missing");

  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/objects/generate-link`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...params,
        expiresIn: 7 * 24 * 60 * 60, // 7 days
      }),
    }
  );

  if (!res.ok) throw new Error(await res.text());

  const data = await res.json();

  if (!data.url) {
    throw new Error("Signed URL missing from response");
  }

  if (!params.folderPrefix) {
    throw new Error("folderPrefix required for secure case sharing");
  }

  // 🔐 Build the secure-view URL with prefix
  const secureViewUrl = `/secure-view?prefix=${encodeURIComponent(
    params.folderPrefix
  )}`;

  // 🔐 Wrap it with external-login that redirects to secure-view after auth
  const wrappedUrl = `${window.location.origin}/external-login?redirect=${encodeURIComponent(
    secureViewUrl
  )}`;

  await navigator.clipboard.writeText(wrappedUrl);

  toast.success(
    <div>
      <strong>Secure link copied!</strong>
      <br />
      <span style={{ fontSize: "0.85em", opacity: 0.8 }}>
        Login required to access
      </span>
      {data.expiresAt && (
        <>
          <br />
          <span style={{ fontSize: "0.85em", opacity: 0.8 }}>
            Expires: {new Date(data.expiresAt).toLocaleDateString()}
          </span>
        </>
      )}
    </div>,
    { duration: 5000 }
  );

  return wrappedUrl;
}


/**
 * Generates a direct CloudFront link (no authentication required)
 * Use only for truly public content
 */
export async function generatePublicLink(params: {
  objectKey?: string;
  objectKeys?: string[];
  folderPrefix?: string;
}) {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error("Auth missing");

  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/objects/generate-link`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...params,
        // Flag to indicate public access (no auth required)
        requireAuth: false,
        expiresIn: 24 * 60 * 60, // 24 hours for public links
      }),
    }
  );

  if (!res.ok) throw new Error(await res.text());

  const { url, expiresAt } = await res.json();
  
  await navigator.clipboard.writeText(url);
  
  toast.success(
    <div>
      <strong>Public link copied!</strong>
      <br />
      <span style={{ fontSize: '0.85em', opacity: 0.8 }}>
        Anyone with this link can access
      </span>
      {expiresAt && (
        <>
          <br />
          <span style={{ fontSize: '0.85em', opacity: 0.8 }}>
            Expires: {new Date(expiresAt).toLocaleDateString()}
          </span>
        </>
      )}
    </div>,
    { duration: 5000 }
  );

  return url;
}