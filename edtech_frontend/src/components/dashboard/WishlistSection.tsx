import React from 'react';
import type { WishlistItem } from '../../types/studentDashboard';
import { Heart, ArrowRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WishlistSectionProps {
  wishlist: WishlistItem[];
}

export const WishlistSection: React.FC<WishlistSectionProps> = ({ wishlist }) => {
  const navigate = useNavigate();

  if (!wishlist || wishlist.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Your Saved Items</h3>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {wishlist.map((item) => {
          const currencySymbol = item.currency === 'INR' ? '₹' : '$';
          return (
            <div
              key={item.wishlistId}
              onClick={() => navigate(`/courses/${item.slug}`)}
              className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                )}
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-400 font-semibold">{item.productType}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs font-black text-slate-900">{currencySymbol}{item.price}</p>
                <span className="text-[11px] text-indigo-600 font-bold flex items-center gap-0.5 justify-end group-hover:translate-x-0.5 transition-transform">
                  <span>View</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
