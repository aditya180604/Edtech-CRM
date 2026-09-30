import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, Video, ArrowRight } from 'lucide-react';
import { liveWebinarsData } from '../data/mockData';

export const LiveWebinarsSection: React.FC = () => {
  return (
    <section className="py-8 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Live Webinars
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Join live sessions with industry experts. Learn, ask questions, and interact in real time.
          </p>
        </div>
        <Link
          to="/webinars"
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Webinars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {liveWebinarsData.map((webinar) => (
          <div
            key={webinar.id}
            className="group bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-150 overflow-hidden flex flex-col justify-between"
          >
            <div>
              {/* Thumbnail / Speaker Banner */}
              <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-900">
                <img
                  src={webinar.thumbnail}
                  alt={webinar.title}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300"
                />
                {webinar.isLive ? (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-md flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    LIVE
                  </span>
                ) : (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-md flex items-center gap-1 shadow-sm">
                    <Video className="w-3 h-3" />
                    WEBINAR
                  </span>
                )}
                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold rounded-md flex items-center gap-1">
                  <Users className="w-3 h-3 text-indigo-400" />
                  {webinar.attendingCount}
                </span>
              </div>

              {/* Content Body */}
              <div className="p-4.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug mb-1.5">
                  {webinar.title}
                </h3>
                <p className="text-xs font-semibold text-slate-700 mb-3 truncate">
                  By {webinar.instructorName}
                </p>

                {/* Date & Time */}
                <div className="space-y-1.5 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{webinar.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{webinar.time}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-4.5 pt-0">
              <button
                type="button"
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white font-bold text-xs rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Register Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
