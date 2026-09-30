import React, { useState, useEffect } from 'react';
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
  Layers,
  AlertCircle,
} from 'lucide-react';
import { catalogApi, type CatalogTopic } from '../api/catalog';


export const PopularTopics: React.FC = () => {
  const [topics, setTopics] = useState<CatalogTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    catalogApi
      .getTopics({ limit: 6 })
      .then((data) => {
        setTopics(data);
      })
      .catch((err) => {
        console.error('Failed to load popular topics:', err);
        setError('Unable to load topics.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const getTopicIcon = (iconName?: string) => {
    const classProps = 'w-5 h-5 text-white';
    switch (iconName) {
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
        return <Atom className={classProps} />;
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

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white p-4 rounded-2xl border border-slate-100 animate-pulse flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-24" />
                  <div className="h-3 bg-slate-100 rounded w-16" />
                </div>
              </div>
              <div className="h-6 w-12 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center text-xs text-rose-700">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
          {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && topics.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-2">
          <Layers className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No modular topics available</h3>
          <p className="text-xs text-slate-500">Topics are dynamically synchronized with course modules.</p>
        </div>
      )}

      {/* Topics Grid */}
      {!isLoading && !error && topics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              to={topic.courseSlug ? `/course/${topic.courseSlug}` : `/topics`}
              className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-150 flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                {/* Icon Container */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-150 ${
                    topic.bgColor || 'bg-indigo-600'
                  }`}
                >
                  {getTopicIcon(topic.icon)}
                </div>

                {/* Title & Count */}
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-0.5">
                    {topic.title}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">{topic.courseTitle}</span>
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
      )}
    </section>
  );
};
