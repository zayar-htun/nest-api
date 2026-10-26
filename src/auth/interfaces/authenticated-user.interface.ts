import { Role } from '../../generated/prisma/enums.js';

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}
