import { useQuery } from '@tanstack/react-query';
import { UsersAPI } from '../api/users/users.api';
import type { User } from '../api/users/users.types';

export function useCognitoUser() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: UsersAPI.getAll,
  });
}