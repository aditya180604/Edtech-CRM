import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, Video, ArrowRight, AlertCircle } from 'lucide-react';
import { catalogApi, type CatalogWebinar } from '../api/catalog';


export const LiveWebinarsSection: React.FC = () => {
  const [webinars, setWebinars] = useState<CatalogWebinar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    catalogApi
      .getWebinars({ limit: 8 })
      .then((data) => {
        setWebinars(data);
      })
      .catch((err) => {
        console.error('Failed to load webinars:', err);
        setError('Unable to load live workshops.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <section className="py-8 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Live Webinars & Workshops
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

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse space-y-3">
              <div className="aspect-16/10 bg-slate-200 rounded-xl w-full" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-8 bg-slate-100 rounded-xl w-full" />
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
      {!isLoading && !error && webinars.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-2">
          <Video className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No upcoming live workshops scheduled</h3>
          <p className="text-xs text-slate-500">
            Check back soon as instructors announce new live coding sessions and interactive masterclasses.
          </p>
        </div>
      )}

      {/* Webinars Grid */}
      {!isLoading && !error && webinars.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {webinars.map((webinar) => (
            <div
              key={webinar.id}
              className="group bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-150 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail / Speaker Banner */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-900">
                  {webinar.thumbnail ? (
                    <img
                      src={webinar.thumbnail}
                      alt={webinar.title}
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-slate-900 text-indigo-300 font-extrabold text-sm">
                      {webinar.title.slice(0, 20)}
                    </div>
                  )}
                  {webinar.badge === 'LIVE NOW' ? (
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
                    {webinar.attendeesCount} spots
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
                      <span>{new Date(webinar.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{webinar.duration}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4.5 pt-0">
                <Link
                  to="/cart"
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white font-bold text-xs rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{webinar.price > 0 ? `Register (₹${webinar.price})` : 'Register Free'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
