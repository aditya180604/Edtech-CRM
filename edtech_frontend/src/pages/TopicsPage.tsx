import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  Search,
  ShoppingBag,
  Atom,
  FileCode2,
  Brain,
  Server,
  Palette,
  Database,
  Lock,
  Container,
  GitBranch,
  AlertCircle,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { catalogApi, type CatalogTopic } from '../api/catalog';
import { Link } from 'react-router-dom';


export const TopicsPage: React.FC = () => {
  const [topics, setTopics] = useState<CatalogTopic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<string[]>(['All']);

  useEffect(() => {
    catalogApi.getCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setCategories(['All', ...cats.map((c) => c.name)]);
      }
    }).catch(() => {
      // Keep ['All'] if categories fail to load
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

  const loadTopics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await catalogApi.getTopics({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
      });
      setTopics(data);
    } catch (err: any) {
      console.error('Failed to load topics:', err);
      setError('Unable to load topics. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            All Topics
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Learn specific skills. Buy only what you need, upgrade later to full course with credit.
          </p>
        </div>

        {/* Search & Category Pills */}
        <div className="space-y-4 mb-8">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 bg-white text-sm text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white p-5 rounded-2xl border border-slate-100 animate-pulse flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-28" />
                    <div className="h-3 bg-slate-100 rounded w-20" />
                  </div>
                </div>
                <div className="h-8 w-16 bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-rose-900">Failed to load topics</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
            <button
              onClick={loadTopics}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && topics.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No topics found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no individual modular topics currently matching your filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Reset search
            </button>
          </div>
        )}

        {/* Topics Grid */}
        {!isLoading && !error && topics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      topic.bgColor || 'bg-indigo-600'
                    }`}
                  >
                    {getTopicIcon(topic.icon)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1">
                      {topic.title}
                    </h3>
                    <span className="text-xs text-slate-400">{topic.courseTitle}</span>
                  </div>
                </div>

                <div className="text-right pl-3">
                  <span className="text-sm font-extrabold text-slate-900 block mb-1">
                    ₹{topic.price}
                  </span>
                  <Link
                    to={topic.courseSlug ? `/course/${topic.courseSlug}` : '/cart'}
                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Buy</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};
