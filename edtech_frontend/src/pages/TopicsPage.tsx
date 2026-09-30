import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Search, ShoppingBag, Atom, FileCode2, Brain, Server, Palette, Database, Lock, Container, GitBranch } from 'lucide-react';
import { popularTopicsData } from '../data/mockData';

export const TopicsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Development', 'Data Science', 'AI & ML', 'Cloud', 'Design', 'Cybersecurity'];

  const getTopicIcon = (iconName: string) => {
    const classProps = "w-5 h-5 text-white";
    switch (iconName) {
      case 'Atom': return <Atom className={classProps} />;
      case 'FileCode2': return <FileCode2 className={classProps} />;
      case 'Brain': return <Brain className={classProps} />;
      case 'Server': return <Server className={classProps} />;
      case 'Figma': return <Palette className={classProps} />;
      case 'Database': return <Database className={classProps} />;
      case 'Lock': return <Lock className={classProps} />;
      case 'Container': return <Container className={classProps} />;
      case 'GitBranch': return <GitBranch className={classProps} />;
      default: return <Atom className={classProps} />;
    }
  };

  const filteredTopics = popularTopicsData.filter((t) => {
    const matchCat = selectedCategory === 'All' || t.category === selectedCategory;
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

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

        {/* Topics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${topic.bgColor}`}
                >
                  {getTopicIcon(topic.icon)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1">
                    {topic.title}
                  </h3>
                  <span className="text-xs text-slate-400">{topic.coursesCount}</span>
                </div>
              </div>

              <div className="text-right pl-3">
                <span className="text-sm font-extrabold text-slate-900 block mb-1">
                  ₹{topic.price}
                </span>
                <button
                  type="button"
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Buy</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};
