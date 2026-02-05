import { fetchAuthSession } from "aws-amplify/auth";
import toast from "react-hot-toast";

export async function generateAndCopyLink(objectKey: string) {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    if (!token) {
      throw new Error("Authentication token missing");
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const res = await fetch(`${apiBaseUrl}/objects/generate-link`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ objectKey }),
    });

    if (!res.ok) {
      throw new Error(`API failed: ${res.status}`);
    }

    const { url, expiresIn } = await res.json();

    await navigator.clipboard.writeText(url);

    toast.success(`Link copied to Clipboard`);
  } catch (error) {
    console.error("Generate link error:", error);
    toast.error("Failed to generate link");
  }
}
