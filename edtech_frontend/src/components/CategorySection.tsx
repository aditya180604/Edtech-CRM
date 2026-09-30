import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, BarChart3, BrainCircuit, Cloud, Palette, ShieldCheck, ArrowRight } from 'lucide-react';
import { categoriesData } from '../data/mockData';

export const CategorySection: React.FC = () => {
  const getCategoryIcon = (iconName: string) => {
    const classProps = "w-6 h-6";
    switch (iconName) {
      case 'Code2':
        return <Code2 className={classProps} />;
      case 'BarChart3':
        return <BarChart3 className={classProps} />;
      case 'BrainCircuit':
        return <BrainCircuit className={classProps} />;
      case 'Cloud':
        return <Cloud className={classProps} />;
      case 'Palette':
        return <Palette className={classProps} />;
      case 'ShieldCheck':
        return <ShieldCheck className={classProps} />;
      default:
        return <Code2 className={classProps} />;
    }
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

      {/* Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {categoriesData.map((cat) => (
          <Link
            key={cat.id}
            to={`/courses?category=${encodeURIComponent(cat.name)}`}
            className="group relative bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-150 flex flex-col items-center text-center"
          >
            {/* Icon Container */}
            <div className={`w-13 h-13 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105 duration-150 ${cat.iconColor}`}>
              {getCategoryIcon(cat.icon)}
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
    </section>
  );
};
