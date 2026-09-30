import React from 'react';
import type { RecentOrderItem } from '../../types/studentDashboard';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecentOrdersSectionProps {
  orders: RecentOrderItem[];
}

export const RecentOrdersSection: React.FC<RecentOrdersSectionProps> = ({ orders }) => {
  const navigate = useNavigate();

  if (!orders || orders.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
        </div>
        <button
          onClick={() => navigate('/orders')}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
        >
          <span>All Orders</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {orders.map((order) => {
          const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          const currencySymbol = order.currency === 'INR' ? '₹' : '$';

          return (
            <div key={order.orderId} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">Order #{order.orderNumber}</p>
                <p className="text-slate-400 text-[11px]">{formattedDate} • {order.itemsCount} item(s)</p>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-900">{currencySymbol}{order.payableAmount}</p>
                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  {order.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
