import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  Video,
  Layers,
} from 'lucide-react';
import { coursesApi, type TopicItem } from '../api/courses';
import { popularTopicsData } from '../data/mockData';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const TopicsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { success } = useToast();

  const courseIdParam = searchParams.get('courseId') || '';
  const initialCat = searchParams.get('category') || 'All';

  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>(['All']);

  // Fetch dynamic topics from database
  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await coursesApi.getTopics({
        courseId: courseIdParam || undefined,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: searchQuery.trim() || undefined,
      });

      if (res.success && res.data && res.data.length > 0) {
        setTopics(res.data);
        // Compute distinct categories
        const cats = Array.from(
          new Set(res.data.map((t) => t.category).filter(Boolean))
        );
        setCategories(['All', ...cats]);
      } else {
        // Map mock fallback if database has no standalone topics yet
        const mappedMock: TopicItem[] = popularTopicsData.map((t) => ({
          id: t.id,
          _id: t.id,
          title: t.title,
          price: t.price,
          duration: 30,
          isFree: false,
          category: t.category,
          courseTitle: `${t.category} Masterclass`,
          courseSlug: t.slug,
          courseId: t.id,
          moduleTitle: 'Core Fundamentals',
          lessonsCount: 4,
          hasVideo: true,
        }));

        let filtered = mappedMock;
        if (selectedCategory !== 'All') {
          filtered = filtered.filter(
            (t) => t.category.toLowerCase() === selectedCategory.toLowerCase()
          );
        }
        if (searchQuery.trim()) {
          filtered = filtered.filter((t) =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setTopics(filtered);
        const cats = Array.from(new Set(mappedMock.map((t) => t.category)));
        setCategories(['All', ...cats]);
      }
    } catch (err) {
      console.warn('Failed to load topics from backend, using fallback:', err);
    } finally {
      setLoading(false);
    }
  }, [courseIdParam, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const getTopicIcon = (index: number, title: string) => {
    const classProps = 'w-5 h-5 text-white';
    const lower = title.toLowerCase();
    if (lower.includes('docker') || lower.includes('container'))
      return <Container className={classProps} />;
    if (lower.includes('react') || lower.includes('hook') || lower.includes('js'))
      return <Atom className={classProps} />;
    if (lower.includes('python') || lower.includes('data') || lower.includes('pandas'))
      return <Brain className={classProps} />;
    if (lower.includes('aws') || lower.includes('cloud') || lower.includes('server'))
      return <Server className={classProps} />;
    if (lower.includes('figma') || lower.includes('design') || lower.includes('ui'))
      return <Palette className={classProps} />;
    if (lower.includes('sql') || lower.includes('database') || lower.includes('mongo'))
      return <Database className={classProps} />;
    if (lower.includes('auth') || lower.includes('security') || lower.includes('jwt'))
      return <Lock className={classProps} />;
    if (lower.includes('git') || lower.includes('github') || lower.includes('ci'))
      return <GitBranch className={classProps} />;

    const icons = [
      <Atom className={classProps} />,
      <FileCode2 className={classProps} />,
      <Brain className={classProps} />,
      <Server className={classProps} />,
      <Container className={classProps} />,
      <Database className={classProps} />,
    ];
    return icons[index % icons.length];
  };

  const getTopicBg = (index: number) => {
    const bgs = [
      'bg-cyan-500',
      'bg-blue-600',
      'bg-purple-600',
      'bg-amber-500',
      'bg-rose-500',
      'bg-emerald-600',
      'bg-indigo-600',
      'bg-violet-600',
    ];
    return bgs[index % bgs.length];
  };

  const handleBuyTopic = async (topic: TopicItem) => {
    const topicId = topic._id || topic.id;
    if (!topicId) return;
    await addToCart(topicId, 'CONTENT_OFFERING');
    success('Topic Added to Cart', `"${topic.title}" is ready for checkout.`);
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Title Header with Course context if present */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                All Topics & Atomic Skills
              </h1>
              <p className="text-sm sm:text-base text-slate-500 mt-1">
                Learn specific skills. Buy only what you need, upgrade later to full course with credit.
              </p>
            </div>

            {courseIdParam && (
              <button
                onClick={() => {
                  setSearchParams({});
                  setSelectedCategory('All');
                }}
                className="self-start sm:self-auto px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                View All Courses' Topics ✕
              </button>
            )}
          </div>
        </div>

        {/* Search & Dynamic Category Filter Tabs */}
        <div className="space-y-4 mb-8">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search topics by title or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2.5 bg-white text-sm text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 shadow-2xs font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 shadow-2xs'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Topics Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-xs font-bold text-slate-500">Loading dynamic topics from courses...</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
            <Layers className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">No Topics Found</h3>
            <p className="text-xs text-slate-500 font-medium">
              No standalone topics match your search criteria. Try selecting another category or clear search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topics.map((topic, idx) => (
              <div
                key={topic.id || topic._id || idx}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Colorful Icon Container */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${getTopicBg(
                      idx
                    )}`}
                  >
                    {getTopicIcon(idx, topic.title)}
                  </div>

                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block mb-0.5 truncate">
                      {topic.category}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2">
                      {topic.title}
                    </h3>
                    {topic.description && (
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">{topic.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-medium truncate">
                      <span>{topic.duration}m</span>
                      <span>•</span>
                      <span>{topic.lessonsCount || 1} Lessons</span>
                      {topic.hasVideo && (
                        <>
                          <span>•</span>
                          <span className="text-purple-600 font-bold flex items-center gap-0.5">
                            <Video className="w-3 h-3" /> Video
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price & Buy Action Button */}
                <div className="text-right shrink-0 pl-2">
                  <span className="text-base font-black text-slate-900 block mb-1.5">
                    {topic.isFree || topic.price === 0
                      ? 'FREE'
                      : `₹${topic.price.toLocaleString('en-IN')}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleBuyTopic(topic)}
                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Buy</span>
                  </button>
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
