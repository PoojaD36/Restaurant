/**
 * Offer Module Constants
 */

export const OFFOR_ERROR_MESSAGES = {
  OFFER_NOT_FOUND: 'Offer not found',
  OFFER_EXPIRED: 'Offer has expired',
  OFFER_NOT_STARTED: 'Offer has not started yet',
  OFFER_INACTIVE: 'Offer is not active',
  OFFER_PAUSED: 'Offer is currently paused',
  INVALID_CODE: 'Invalid offer code',
  CODE_REQUIRED: 'Offer code is required',
  MIN_ORDER_AMOUNT: `Minimum order amount required`,
  FIRST_ORDER_ONLY: 'Offer is valid for first order only',
  MAX_USES_REACHED: 'Offer maximum uses reached',
  CUSTOMER_LIMIT_REACHED: 'You have reached the maximum usage limit for this offer',
  INVALID_TIME: 'Offer is not valid at this time',
  INVALID_DAY: 'Offer is not valid on this day',
  NO_APPLICABLE_ITEMS: 'No applicable items in cart for this offer',
  OFFER_NOT_APPLICABLE: 'Offer is not applicable for this outlet',
  EXCLUSIVE_OFFER: 'This offer cannot be combined with other offers',
  MENU_ITEMS_REQUIRED: 'Offer requires specific menu items',
  CART_EMPTY: 'Cart is empty',
  INVALID_OUTLET: 'Invalid outlet',
};

export const OFFER_DAYS = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export const OFFER_TYPE_REQUIREMENTS = {
  PERCENTAGE: ['percentageValue'],
  FIXED: ['fixedAmountValue'],
  FREE_DELIVERY: [],
  BUY_ONE_GET_ONE: ['menuItemIds'],
};
