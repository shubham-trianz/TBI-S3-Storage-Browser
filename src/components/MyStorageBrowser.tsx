import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { Tabs } from "@aws-amplify/ui-react";
import { useUser } from "../context/UserContext";
import { Personal } from "./tabs/Personal";
import Shared from "./tabs/Shared";
import Received from "./tabs/Received";
import Header from "./utils/Header";
import FullScreenLoader from "./utils/FullScreenLoader";

export const MyStorageBrowser = () => {
  const { email, signOut } = useUser()
  const [identityId, setIdentityId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("private");
  useEffect(() => {
    async function loadSession() {
      const session = await fetchAuthSession();
      console.log('sesssion: ', session)
      setIdentityId(session.identityId ?? null);
    }
    loadSession();
  }, []);

  if (!identityId) {
    return <FullScreenLoader text="Loading..." />
  }
  const displayName = email?.split('@')[0] || 'User';

return (
    <>  
      <Header
        displayName={displayName}
        signOut={signOut}
      />

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
          { label: "Received", value: "received", content: <Received /> },
        ]}
      />
    </>
  );
};
