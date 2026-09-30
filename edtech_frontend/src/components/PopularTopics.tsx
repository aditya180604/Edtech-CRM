import React from 'react';
import { Link } from 'react-router-dom';
import {
  Atom,
  FileCode2,
  Brain,
  Server,
  Palette,
  Database,
  Lock,
  Container,
  GitBranch,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { popularTopicsData } from '../data/mockData';

export const PopularTopics: React.FC = () => {
  const getTopicIcon = (iconName: string) => {
    const classProps = "w-5 h-5 text-white";
    switch (iconName) {
      case 'Atom':
        return <Atom className={classProps} />;
      case 'FileCode2':
        return <FileCode2 className={classProps} />;
      case 'Brain':
        return <Brain className={classProps} />;
      case 'Server':
        return <Server className={classProps} />;
      case 'Figma':
        return <Palette className={classProps} />;
      case 'Database':
        return <Database className={classProps} />;
      case 'Lock':
        return <Lock className={classProps} />;
      case 'Container':
        return <Container className={classProps} />;
      case 'GitBranch':
        return <GitBranch className={classProps} />;
      default:
        return <Sparkles className={classProps} />;
    }
  };

  return (
    <section className="py-8 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Popular Topics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Learn specific skills. Buy only what you need.
          </p>
        </div>
        <Link
          to="/topics"
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {popularTopicsData.map((topic) => (
          <Link
            key={topic.id}
            to={`/topics?topic=${encodeURIComponent(topic.slug)}`}
            className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-150 flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              {/* Icon Container */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-150 ${topic.bgColor}`}
              >
                {getTopicIcon(topic.icon)}
              </div>

              {/* Title & Count */}
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-0.5">
                  {topic.title}
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">{topic.coursesCount}</span>
              </div>
            </div>

            {/* Price Tag */}
            <div className="text-right pl-3">
              <span className="text-sm font-black text-slate-900 block">
                ₹{topic.price}
              </span>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Buy Skill
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
