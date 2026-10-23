import React from 'react';
import { CouponsAndDiscountsManager } from '../coupons/CouponsAndDiscountsManager';

export const SuperAdminCouponsTab: React.FC = () => {
  return <CouponsAndDiscountsManager role="SUPER_ADMIN" />;
};
