import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { Tabs } from "@aws-amplify/ui-react";
import { StorageBrowser } from "@aws-amplify/ui-react-storage";
import { UploadButton } from "./utils/UploadButton";
import Personal from "./tabs/Personal";
import Shared from "./tabs/Shared";
import Recieved from "./tabs/Recieved";
export const MyStorageBrowser = () => {
  const [identityId, setIdentityId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("private");
  useEffect(() => {
    async function loadSession() {
      const session = await fetchAuthSession();
      setIdentityId(session.identityId ?? null);
    }
    loadSession();
  }, []);

  if (!identityId) {
    return <p>Loading files...</p>;
  }

return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value)}
        items={[
          {
            label: "Personal",
            value: "private",
            content: <Personal />,
          },
          { label: "Shared", value: "shared", content: <Shared /> },
          { label: "Recieved", value: "received", content: <Recieved /> },
        ]}
      />
    </>
  );
};