import { UserRole } from 'src/database/generated/prisma/enums';

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
