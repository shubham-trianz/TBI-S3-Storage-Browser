import { fetchAuthSession } from "aws-amplify/auth";
import toast from "react-hot-toast";

// export async function generateAndCopyLink(params: {
//   objectKey?: string;
//   objectKeys?: string[];
//   folderPrefix?: string;
// }) {
//   try {
//     const { objectKey, objectKeys, folderPrefix } = params;

//     if (
//       !objectKey &&
//       (!objectKeys || objectKeys.length === 0) &&
//       !folderPrefix
//     ) {
//       throw new Error("objectKey, objectKeys, or folderPrefix is required");
//     }

//     const session = await fetchAuthSession();
//     const token = session.tokens?.idToken?.toString();

//     if (!token) {
//       throw new Error("Authentication token missing");
//     }

//     const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

//     // ✅ Correct payload selection
//     const body =
//       objectKeys && objectKeys.length > 0
//         ? { objectKeys }
//         : objectKey
//           ? { objectKey }
//           : { folderPrefix };

//     const res = await fetch(`${apiBaseUrl}/objects/generate-link`, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(body),
//     });

//     if (!res.ok) {
//       const text = await res.text();
//       throw new Error(text || `API failed: ${res.status}`);
//     }

//     const { url } = await res.json();

//     await navigator.clipboard.writeText(url);

//     if (objectKeys && objectKeys.length > 1) {
//       toast.success("ZIP link for selected files copied");
//     } else if (objectKey) {
//       toast.success("File link copied to clipboard");
//     } else {
//       toast.success("Folder ZIP link copied to clipboard");
//     }

//     return url;
//   } catch (error) {
//     console.error("Generate link error:", error);
//     toast.error("Failed to generate link");
//     throw error;
//   }
// }

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
      body: JSON.stringify(params),
    }
  );

  if (!res.ok) throw new Error(await res.text());

  const { url } = await res.json();
  await navigator.clipboard.writeText(url);
  toast.success("Download link copied");
  return url;
}
