// import { list } from 'aws-amplify/storage';
// import { useEffect, useState } from 'react';
// import { fetchAuthSession } from 'aws-amplify/auth';
import { Personal } from './tabs/Personal';
import { UploadButton } from './utils/UploadButton';

// type S3Item = {
//   path: string;
//   size?: number;
//   lastModified?: Date;
// };

export const MyStorageBrowser = () => {
  
  return (
    <>
        <Personal/>
        <UploadButton />
    </>
  );
};
