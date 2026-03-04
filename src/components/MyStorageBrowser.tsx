import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { Tabs } from "@aws-amplify/ui-react";
import { Personal } from "./tabs/Personal";
import { Shared } from "./tabs/Shared";
import Received from "./tabs/Received";
import  {Temp } from "./tabs/Temp";
import FullScreenLoader from "./utils/FullScreenLoader";
import { useLocation, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";

export const MyStorageBrowser = () => {

  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = () => {
    if (location.pathname.includes("shared")) return "shared";
    if (location.pathname.includes("received")) return "received";
    if (location.pathname.includes("temp")) return "temp";
    return "private";
  };

  const [identityId, setIdentityId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(getTabFromPath());

  useEffect(() => {
    if (location.pathname.includes("shared")) {
      setActiveTab("shared");
    } else if (location.pathname.includes("received")) {
      setActiveTab("received");
    } else if (location.pathname.includes("temp")) {
      setActiveTab("temp");
    } else {
      setActiveTab("private");
    }
  }, [location.pathname]);

  useEffect(() => {
    async function loadSession() {
      const session = await fetchAuthSession();
      setIdentityId(session.identityId ?? null);
    }
    loadSession();
  }, []);

  if (!identityId) {
    return <FullScreenLoader text="Loading..." />;
  }

return (
    <>  

      <Box sx={{ mt: 3, px: 3 }}>
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
            { label: "Temp", value: "temp", content: <Temp />, },
          ]}
        />
      </Box>
    </>
  );
};
