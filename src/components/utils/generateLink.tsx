import { fetchAuthSession } from "aws-amplify/auth";
import toast from "react-hot-toast";


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
