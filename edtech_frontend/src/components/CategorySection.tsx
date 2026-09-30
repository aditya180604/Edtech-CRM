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
    const classProps = 'w-6 h-6 text-indigo-600';
    if (name.includes('data') || name.includes('analytics')) return <BarChart3 className={classProps} />;
    if (name.includes('ai') || name.includes('machine') || name.includes('intelligence')) return <BrainCircuit className={classProps} />;
    if (name.includes('cloud') || name.includes('devops')) return <Cloud className={classProps} />;
    if (name.includes('design') || name.includes('ui') || name.includes('ux')) return <Palette className={classProps} />;
    if (name.includes('security') || name.includes('cyber')) return <ShieldCheck className={classProps} />;
    return <Code2 className={classProps} />;
  };

  return (
    <section className="py-8 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Explore by Category
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Browse courses by industry demand and technologies</p>
        </div>
        <Link
          to="/courses"
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white p-4.5 rounded-2xl border border-slate-100 animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-16 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-12" />
            </div>
          ))}
        </div>
      )}

      {/* Categories Grid */}
      {!isLoading && categories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={`/courses?category=${encodeURIComponent(cat.name)}`}
              className="group relative bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-150 flex flex-col items-center text-center"
            >
              {/* Icon Container */}
              <div className="w-13 h-13 rounded-2xl bg-indigo-50/70 border border-indigo-100/50 flex items-center justify-center mb-3 transition-transform group-hover:scale-105 duration-150">
                {getCategoryIcon(cat.name)}
              </div>

              {/* Category Title */}
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-0.5">
                {cat.name}
              </h3>

              {/* Courses Count */}
              <p className="text-[11px] text-slate-400 font-medium">{cat.count}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};
