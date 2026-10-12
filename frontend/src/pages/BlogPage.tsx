import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Search, Calendar, Clock, ArrowRight, Tag, BookOpen, Sparkles, User, X, Share2, ThumbsUp } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedAt: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  image: string;
  featured?: boolean;
  content?: string[];
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'How to Build Production-Ready Full Stack Apps in 2026',
    slug: 'production-fullstack-2026',
    excerpt: 'Explore modern architectural patterns, distributed caching, and zero-trust authentication workflows used by top engineering teams.',
    category: 'Engineering',
    readTime: '6 min read',
    publishedAt: 'Oct 10, 2026',
    author: {
      name: 'Alex Rivera',
      role: 'Staff Systems Architect',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    },
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    featured: true,
    content: [
      'Modern web application architecture demands resilience, horizontal scaling, and robust authentication right from day one.',
      '1. Zero-Trust Authentication: Instead of relying on vulnerable session cookies, contemporary production systems favor short-lived JWT access tokens paired with cryptographically rotated refresh tokens stored in secure, HttpOnly cookie containers.',
      '2. Distributed Caching with Redis: Minimize database read pressure by adopting multi-tier cache validation. Invalidate hot-path caches selectively using pub/sub events rather than arbitrary TTL expirations.',
      '3. Resilient Database Modeling: Structure schemas with clear indexing patterns for high-frequency queries. Use read replicas for heavy analytics queries while keeping mutation operations atomic.',
      'By decoupling your presentation layer, API gateways, and asynchronous background jobs, your platform can scale smoothly across unpredictable traffic spikes without costly downtime.'
    ]
  },
  {
    id: '2',
    title: 'Demystifying System Design: From Monolith to Event-Driven Microservices',
    slug: 'system-design-microservices',
    excerpt: 'A practical breakdown of event streaming, message queues, and idempotency guarantees for high-throughput backends.',
    category: 'Architecture',
    readTime: '8 min read',
    publishedAt: 'Oct 8, 2026',
    author: {
      name: 'Sophia Patel',
      role: 'Lead Cloud Instructor',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    },
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    featured: false,
    content: [
      'Transitioning from a monolithic code base to distributed microservices is rarely just about splitting code; it is about decoupling failure domains and managing eventual consistency.',
      'Key considerations include idempotent consumers, outbox patterns for reliable event publishing, and distributed tracing via OpenTelemetry to diagnose latency bottlenecks across network boundaries.'
    ]
  },
  {
    id: '3',
    title: 'Crack the Technical Interview: Algorithmic Thinking without Rote Memorization',
    slug: 'crack-technical-interview-patterns',
    excerpt: 'Master foundational problem patterns like sliding windows, two pointers, and dynamic programming with step-by-step visualizations.',
    category: 'Career',
    readTime: '5 min read',
    publishedAt: 'Oct 4, 2026',
    author: {
      name: 'Marcus Zhang',
      role: 'Ex-FAANG Interviewer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    },
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    featured: false,
    content: [
      'Stop trying to memorize 500 individual LeetCode problems. Instead, learn to classify problems into core conceptual templates.',
      'Recognizing whether an input requires Monotonic Stacks, Fast & Slow Pointers, or Topological Sort cuts problem-solving anxiety by 80% and lets you focus on clean edge-case handling.'
    ]
  },
  {
    id: '4',
    title: 'The Rise of AI-Assisted Development: Enhancing Productivity as a Junior Dev',
    slug: 'ai-assisted-developer-productivity',
    excerpt: 'How to use AI code assistants effectively without sacrificing fundamental problem-solving and critical debugging skills.',
    category: 'AI & Tools',
    readTime: '7 min read',
    publishedAt: 'Sep 29, 2026',
    author: {
      name: 'David Kim',
      role: 'AI Research Educator',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    },
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    featured: false,
    content: [
      'AI coding companions are phenomenal accelerators for boilerplate generation and test synthesis, but they cannot replace systems-level reasoning.',
      'Treat AI outputs like a junior pull request: rigorously test assumptions, inspect memory allocations, and never accept code without understanding why it works.'
    ]
  },
];

const CATEGORIES = ['All', 'Engineering', 'Architecture', 'Career', 'AI & Tools'];

export const BlogPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = BLOG_POSTS.find((p) => p.featured) || BLOG_POSTS[0];

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedPosts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col justify-between text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF5F2] border border-[#FFCCC2] text-[#FA5A36] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EduTech Engineering & Insights</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Articles, Tutorials & Industry Perspectives
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
            Deep-dives on distributed software systems, web engineering, system design architectures, and tech career growth from industry mentors.
          </p>

          {/* Search bar */}
          <div className="pt-2 max-w-md mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tutorials, topics, or system design..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:ring-1 focus:ring-[#FA5A36]/20 shadow-xs transition"
              />
            </div>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#FA5A36] text-white shadow-xs shadow-[#FA5A36]/25'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Article Banner - Opens inline reader */}
        {activeCategory === 'All' && !searchQuery && featuredPost && (
          <div
            onClick={() => setSelectedPost(featuredPost)}
            className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-7 aspect-video lg:aspect-auto overflow-hidden">
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#FFF5F2] text-[#FA5A36] text-[10px] font-black uppercase tracking-wider border border-[#FFCCC2]">
                      Featured
                    </span>
                    <span className="text-xs font-bold text-slate-400">• {featuredPost.category}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-[#FA5A36] transition-colors leading-snug">
                    {featuredPost.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={featuredPost.author.avatar} alt={featuredPost.author.name} className="w-9 h-9 rounded-xl object-cover" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{featuredPost.author.name}</p>
                      <p className="text-[10px] text-slate-400">{featuredPost.publishedAt} • {featuredPost.readTime}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPost(featuredPost)}
                    className="px-3.5 py-2 rounded-xl bg-[#FFF5F2] hover:bg-[#FA5A36] text-[#FA5A36] hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Articles Grid - All open inline without redirection */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">
              {activeCategory === 'All' ? 'Latest Publications' : `${activeCategory} Articles`} ({filteredPosts.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-[#FFCCC2] hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                      <span className="text-[#FA5A36] font-black uppercase text-[10px]">{post.category}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.readTime}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 text-base group-hover:text-[#FA5A36] transition-colors leading-snug line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2.5">
                    <img src={post.author.avatar} alt={post.author.name} className="w-7 h-7 rounded-lg object-cover" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-900">{post.author.name}</p>
                      <p className="text-[10px] text-slate-400">{post.publishedAt}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPost(post);
                    }}
                    className="text-xs font-bold text-[#FA5A36] hover:text-[#E04322] flex items-center gap-1"
                  >
                    <span>Read</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inline Article Reading Modal - 100% On-Page, Zero Redirection */}
        {selectedPost && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
              <div className="relative aspect-video sm:aspect-21/9 overflow-hidden rounded-t-3xl">
                <img
                  src={selectedPost.image}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-colors shadow-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 sm:p-10 space-y-6">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#FFF5F2] text-[#FA5A36] text-[10px] font-black uppercase tracking-wider border border-[#FFCCC2]">
                      {selectedPost.category}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">• {selectedPost.readTime}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleLike(selectedPost.id, e)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        likedPosts[selectedPost.id]
                          ? 'bg-[#FFF5F2] text-[#FA5A36] border-[#FFCCC2]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{likedPosts[selectedPost.id] ? 'Liked' : 'Helpful'}</span>
                    </button>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {selectedPost.title}
                </h1>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <img
                    src={selectedPost.author.avatar}
                    alt={selectedPost.author.name}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{selectedPost.author.name}</p>
                    <p className="text-[11px] text-slate-500">{selectedPost.author.role} • {selectedPost.publishedAt}</p>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
                  <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed border-l-4 border-[#FA5A36] pl-4 italic">
                    "{selectedPost.excerpt}"
                  </p>

                  {selectedPost.content ? (
                    selectedPost.content.map((paragraph, idx) => (
                      <p key={idx} className="font-normal text-slate-700">
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p className="font-normal text-slate-700">
                      Full technical breakdown and code architectures are continuously published by EduTech senior educators.
                    </p>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Published on EduTech Insights</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPost(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                  >
                    Close Article
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
