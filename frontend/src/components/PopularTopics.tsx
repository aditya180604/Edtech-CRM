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
} from 'lucide-react';
import { coursesApi, type TopicItem } from '../api/courses';
import { popularTopicsData } from '../data/mockData';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { TopicDetailModal } from './TopicDetailModal';

export const PopularTopics: React.FC = () => {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);
  const { addToCart } = useCart();
  const { success, error: showError } = useToast();

  const handleBuyTopic = async (topic: TopicItem, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      await addToCart(topic.id || topic._id, 'TOPIC', {
        title: topic.title,
        price: topic.price || 0,
        courseId: topic.courseId,
        category: topic.category,
      });
      success('Added to Cart', `"${topic.title}" has been added to your shopping cart.`);
    } catch (err: any) {
      showError('Cart Error', err.message || 'Failed to add topic to cart.');
    }
  };

  useEffect(() => {
    const loadPopular = async () => {
      try {
        const res = await coursesApi.getTopics();
        if (res.success && res.data && res.data.length > 0) {
          setTopics(res.data.slice(0, 9));
        } else {
          setTopics(
            popularTopicsData.map((t) => ({
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
              moduleTitle: 'Core Concepts',
              lessonsCount: 4,
              hasVideo: true,
            }))
          );
        }
      } catch (err) {
        console.warn('Using initial popular topics data:', err);
      }
    };
    loadPopular();
  }, []);

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

  return (
    <section className="py-10 w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Popular Topics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-normal">
            Learn specific skills. Buy only what you need.
          </p>
        </div>
        <Link
          to="/topics"
          className="group inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-[#FA5A36] hover:text-[#E04322] transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topic, idx) => (
          <div
            key={topic.id || topic._id || idx}
            onClick={() => setSelectedTopic(topic)}
            className="group bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-md hover:border-[#FFCCC2] transition-all duration-150 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              {/* Icon Container */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-150 ${getTopicBg(
                  idx
                )}`}
              >
                {getTopicIcon(idx, topic.title)}
              </div>

              {/* Title & Duration */}
              <div className="min-w-0 flex-1 pr-2">
                <span className="text-[10px] font-semibold uppercase text-[#FA5A36] tracking-wider block truncate">
                  {topic.category}
                </span>
                <h3 className="text-xs sm:text-sm font-medium text-slate-800 group-hover:text-[#FA5A36] transition-colors leading-tight truncate mb-0.5">
                  {topic.title}
                </h3>
                <span className="text-[11px] text-slate-400 font-normal">
                  {topic.duration}m • {topic.lessonsCount || 1} Lessons
                </span>
              </div>
            </div>

            {/* Price Tag & Dedicated Buy Topic Button */}
            <div className="text-right pl-2 shrink-0 flex flex-col items-end gap-1.5">
              <span className="text-sm font-semibold text-slate-900 block">
                {topic.isFree || topic.price === 0
                  ? 'FREE'
                  : `₹${topic.price.toLocaleString('en-IN')}`}
              </span>
              <button
                type="button"
                onClick={(e) => handleBuyTopic(topic, e)}
                className="text-[10px] font-semibold text-[#FA5A36] bg-[#FFF5F2] hover:bg-[#FA5A36] hover:text-white px-2.5 py-1 rounded-md border border-[#FFCCC2] hover:border-[#FA5A36] transition-all cursor-pointer shadow-2xs"
              >
                Buy Topic
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Topic Details Modal */}
      <TopicDetailModal
        topic={selectedTopic}
        isOpen={!!selectedTopic}
        onClose={() => setSelectedTopic(null)}
        onAddToCart={(topic) => {
          handleBuyTopic(topic);
          setSelectedTopic(null);
        }}
      />
    </section>
  );
};
