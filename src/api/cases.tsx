import { fetchAuthSession } from "aws-amplify/auth";

export async function fetchCases() {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();

  const res = await fetch(
    "https://3oatpfcyu0.execute-api.us-east-1.amazonaws.com/dev/cases",
    {
    }
  );

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
}
