import { IsNotEmpty, IsInt } from 'class-validator';

/**
 * DTO for claiming an order
 * Empty DTO - no params needed, orderId comes from route parameter
 */
export class ClaimOrderDto {
  // No fields needed - orderId comes from route parameter
}
