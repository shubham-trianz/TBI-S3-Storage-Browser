import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { Tabs } from "@aws-amplify/ui-react";
import { useUser } from "../context/UserContext";
import { Personal } from "./tabs/Personal";
import { Shared } from "./tabs/Shared";
import  Received  from "./tabs/Received";
import Header from "./utils/Header";
import FullScreenLoader from "./utils/FullScreenLoader";
import { useLocation, useNavigate } from "react-router-dom";


export const MyStorageBrowser = () => {
  const { email, signOut } = useUser()

  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = () => {
    if (location.pathname.includes("shared")) return "shared";
    if (location.pathname.includes("received")) return "received";
    return "private";
  };

  const [identityId, setIdentityId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(getTabFromPath());
  useEffect(() => {
    if (location.pathname.includes("shared")) {
    setActiveTab("shared");
  } else if (location.pathname.includes("received")) {
    setActiveTab("received");
  } else {
    setActiveTab("private");
  }
  }, [location.pathname]);
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
        onValueChange={(value) => {
          setActiveTab(value);
          navigate(`/${value}`);
        }}
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
