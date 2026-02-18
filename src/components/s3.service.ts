import { S3Client } from "@aws-sdk/client-s3";
import { fetchAuthSession } from "aws-amplify/auth";
import amplifyConfig from '../../amplify_outputs.json';


export const createS3Client = async () => {
  const session = await fetchAuthSession();
  
  return new S3Client({
    region: amplifyConfig.storage.aws_region,
    credentials: session.credentials
  });
};
