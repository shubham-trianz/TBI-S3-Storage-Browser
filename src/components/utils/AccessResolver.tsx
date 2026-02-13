import { useParams, useNavigate } from "react-router-dom";
// import { Loader } from "@aws-amplify/ui-react";
import { useResolveCase } from "../../hooks/useAccessResolver";
import { useEffect } from "react";
import toast from "react-hot-toast";
import  FullScreenLoader  from './FullScreenLoader'


export function AccessResolver() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useResolveCase(caseId);

  useEffect(() => {
    if (isLoading) return;
    console.log('data: ', data)
    if (isError) {
      toast.error(`You don’t have permission to view the case - ${data?.case_number} `);
      navigate("/received", { replace: true });
      return;
    }

    if (!data) return;

    if (data.access === "owner") {
      navigate("/personal", { replace: true });
    } else if (data.access === "shared") {
      toast.success(`You have shared access to the case - ${data.case_number}`);
      navigate("/received", { replace: true });
    } else {
      toast.error(`You don’t have permission to view the case - ${data.case_number} `);
      navigate("/received", { replace: true });
    }
  }, [data, isError, isLoading, navigate]);

//   if (isLoading) return <Loader />;
  if (isLoading) return <FullScreenLoader text="Logging in..." />;

  return null;
}
