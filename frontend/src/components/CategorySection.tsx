import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Code2, BarChart3, BrainCircuit, Cloud, Palette, ShieldCheck, ArrowRight } from 'lucide-react';
import { catalogApi, type CatalogCategory } from '../api/catalog';



export const CategorySection: React.FC = () => {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    catalogApi
      .getCategories()
      .then((data) => {
        setCategories(data);
      })
      .catch((err) => {
        console.error('Failed to load categories:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const getCategoryIcon = (catName: string) => {
    const name = catName.toLowerCase();
    if (name.includes('data') || name.includes('analytics')) {
      return {
        icon: <BarChart3 className="w-6 h-6 text-purple-600" />,
        bg: 'bg-purple-50 border-purple-100',
      };
    }
    if (name.includes('ai') || name.includes('machine') || name.includes('intelligence')) {
      return {
        icon: <BrainCircuit className="w-6 h-6 text-blue-600" />,
        bg: 'bg-blue-50 border-blue-100',
      };
    }
    if (name.includes('cloud') || name.includes('devops')) {
      return {
        icon: <Cloud className="w-6 h-6 text-emerald-600" />,
        bg: 'bg-emerald-50 border-emerald-100',
      };
    }
    if (name.includes('design') || name.includes('ui') || name.includes('ux')) {
      return {
        icon: <Palette className="w-6 h-6 text-indigo-600" />,
        bg: 'bg-indigo-50 border-indigo-100',
      };
    }
    if (name.includes('security') || name.includes('cyber')) {
      return {
        icon: <ShieldCheck className="w-6 h-6 text-rose-600" />,
        bg: 'bg-rose-50 border-rose-100',
      };
    }
    return {
      icon: <Code2 className="w-6 h-6 text-[#FA5A36]" />,
      bg: 'bg-[#FFF5F2] border-[#FFCCC2]',
    };
  };

  return (
    <section className="py-10 w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
      {/* Header from Screen 1 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Popular Learning Categories
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-normal">Explore specialized domains and in-demand skills</p>
        </div>
        <Link
          to="/courses"
          className="group inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-[#FA5A36] hover:text-[#E04322] transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white p-5 rounded-2xl border border-slate-100 animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-20 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-14" />
            </div>
          ))}
        </div>
      )}

      {/* Categories Grid */}
      {!isLoading && categories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const { icon, bg } = getCategoryIcon(cat.name);
            return (
              <Link
                key={cat.name}
                to={`/courses?category=${encodeURIComponent(cat.name)}`}
                className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:border-[#FFCCC2] hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center"
              >
                {/* Icon Container with Custom Category Tint */}
                <div className={`w-13 h-13 rounded-2xl border flex items-center justify-center mb-3 transition-transform group-hover:scale-105 duration-150 ${bg}`}>
                  {icon}
                </div>

                {/* Category Title */}
                <h3 className="text-xs sm:text-sm font-medium text-slate-800 group-hover:text-[#FA5A36] transition-colors leading-snug mb-1">
                  {cat.name}
                </h3>

                {/* Courses Count */}
                <p className="text-[11px] text-slate-400 font-normal">{cat.count}</p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};
