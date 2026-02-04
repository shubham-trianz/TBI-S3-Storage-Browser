import { createContext, useContext } from 'react';

export interface UserContextType {
  user_name: string;
  email?: string;
}

export const UserContext = createContext<UserContextType | null>(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserContext.Provider');
  }
  return context;
};
