export interface CustomerJwtPayload {
  sub: number;
  email?: string;
  phone: string;
  type: 'customer';
  iat?: number;
  exp?: number;
}
