import React, { useState, useEffect } from 'react';
import {
  Star,
  ThumbsUp,
  Flag,
  CheckCircle2,
  AlertCircle,
  MessageSquarePlus,
  X,
  User,
} from 'lucide-react';
import {
  coursesApi,
  type CourseReviewItem,
  type CourseReviewsResponse,
} from '../../api/courses';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface CourseReviewsSectionProps {
  courseSlug: string;
  isEnrolled: boolean;
}

export const CourseReviewsSection: React.FC<CourseReviewsSectionProps> = ({
  courseSlug,
  isEnrolled,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reviewsData, setReviewsData] = useState<CourseReviewsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [starFilter, setStarFilter] = useState<number | null>(null);

  // My review & write review modal state
  const [isWriteModalOpen, setIsWriteModalOpen] = useState<boolean>(false);
  const [myReview, setMyReview] = useState<CourseReviewItem | null>(null);
  const [isEligible, setIsEligible] = useState<boolean>(isEnrolled);
  const [inputRating, setInputRating] = useState<number>(5);
  const [inputTitle, setInputTitle] = useState<string>('');
  const [inputComment, setInputComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleOpenWriteReview = () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setIsWriteModalOpen(true);
  };

  const fetchReviews = () => {
    setLoading(true);
    coursesApi
      .getCourseReviews(courseSlug, { rating: starFilter || undefined })
      .then((res) => {
        if (res.success && res.data) {
          setReviewsData(res.data);
        }
      })
      .catch((err) => {
        console.error('Error fetching course reviews', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReviews();
  }, [courseSlug, starFilter]);

  useEffect(() => {
    if (user && courseSlug) {
      coursesApi
        .getMyReview(courseSlug)
        .then((res) => {
          if (res.success && res.data) {
            const data: any = res.data;
            if (data.review) {
              setMyReview(data.review);
              setInputRating(data.review.rating || 5);
              setInputTitle(data.review.title || '');
              setInputComment(data.review.comment || data.review.review || '');
            } else if (data.rating) {
              setMyReview(data);
              setInputRating(data.rating);
              setInputComment(data.review || data.comment || '');
            }
            if (typeof data.isEligible === 'boolean') {
              setIsEligible(data.isEligible);
            }
          }
        })
        .catch((err) => {
          console.error('Failed to load my review', err);
        });
    }
  }, [user, courseSlug]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setFormError('Please sign in to write and submit a review.');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!inputComment.trim()) {
      setFormError('Please write your review feedback.');
      return;
    }

    setSubmittingReview(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await coursesApi.submitReview(courseSlug, {
        rating: inputRating,
        title: inputTitle.trim(),
        comment: inputComment.trim(),
      });

      if (res.success) {
        setFormSuccess('Thank you! Your verified review has been published.');
        setMyReview(res.data.review);
        setTimeout(() => {
          setIsWriteModalOpen(false);
          setFormSuccess(null);
          fetchReviews();
        }, 1200);
      } else {
        setFormError('Could not submit review.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit review.';
      setFormError(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleVoteHelpful = async (reviewId: string) => {
    if (!user) return;
    try {
      const res = await coursesApi.voteHelpfulReview(reviewId);
      if (res.success) {
        setReviewsData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            reviews: prev.reviews.map((r) =>
              r._id === reviewId ? { ...r, helpfulVotesCount: res.data.helpfulVotesCount } : r
            ),
          };
        });
      }
    } catch (err) {
      console.error('Failed to vote', err);
    }
  };

  const handleFlagReview = async (reviewId: string) => {
    if (!user) return;
    try {
      await coursesApi.flagReview(reviewId, { reason: 'Inappropriate or offensive content' });
      alert('Review has been reported for moderation.');
    } catch (err) {
      console.error('Failed to flag review', err);
    }
  };

  const metrics = reviewsData?.metrics || { avgRating: 0, totalReviews: 0, breakdown: {} };
  const total = metrics.totalReviews || 0;
  const breakdown = metrics.breakdown || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 bg-slate-50/70 rounded-3xl border border-slate-100 items-center">
        {/* Left Rating score */}
        <div className="md:col-span-4 text-center md:text-left flex flex-col items-center md:items-start justify-center">
          <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            {metrics.avgRating > 0 ? metrics.avgRating.toFixed(1) : '0.0'}
          </div>
          <div className="flex items-center gap-1 my-2 text-amber-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${
                  s <= Math.round(metrics.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-slate-500">
            {total > 0 ? `Based on ${total.toLocaleString()} verified student ratings` : 'No ratings yet'}
          </p>

          {/* Write review button trigger */}
          <div className="mt-4">
            {user ? (
              <button
                onClick={handleOpenWriteReview}
                className="px-4 py-2.5 bg-[#FA5A36] hover:bg-[#E04322] text-white rounded-xl text-xs font-bold shadow-xs shadow-[#FA5A36]/25 transition cursor-pointer flex items-center gap-2"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>{myReview ? 'Edit Your Review' : 'Write a Review'}</span>
              </button>
            ) : (
              <button
                onClick={handleOpenWriteReview}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5" />
                <span>Log In to Write a Review</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Star Breakdown Bars */}
        <div className="md:col-span-8 space-y-2 border-t md:border-t-0 md:border-l border-slate-200/60 pt-4 md:pt-0 md:pl-8">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = breakdown[stars] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const isSelected = starFilter === stars;

            return (
              <div
                key={stars}
                onClick={() => setStarFilter(isSelected ? null : stars)}
                className={`flex items-center gap-3 text-xs cursor-pointer group p-1 rounded-lg transition ${
                  isSelected ? 'bg-amber-50 font-bold' : 'hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-1 w-12 text-slate-600 shrink-0">
                  <span>{stars}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-12 text-right text-slate-400 text-[11px] shrink-0 font-medium">
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Reset pill if active */}
      {starFilter && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200/80 px-4 py-2 rounded-xl text-xs text-amber-900">
          <span>Filtering reviews by {starFilter} stars only</span>
          <button
            onClick={() => setStarFilter(null)}
            className="font-bold underline text-amber-800 hover:text-amber-950 cursor-pointer"
          >
            Show All
          </button>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-[#FA5A36] rounded-full animate-spin" />
            <span>Loading verified reviews...</span>
          </div>
        ) : !reviewsData?.reviews || reviewsData.reviews.length === 0 ? (
          <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-slate-100 text-slate-400 text-xs space-y-1">
            <Star className="w-8 h-8 mx-auto text-slate-300 mb-1 stroke-1" />
            <p className="font-semibold text-slate-700">No reviews found</p>
            <p className="text-[11px] text-slate-400">
              {isEnrolled
                ? 'Be the first enrolled student to share your thoughts!'
                : 'Enroll in this course to share your learning experience.'}
            </p>
          </div>
        ) : (
          reviewsData.reviews.map((rev) => (
            <div
              key={rev._id}
              className="p-5 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition space-y-3 shadow-2xs"
            >
              {/* Header: Student Info & Stars */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {rev.studentAvatar ? (
                    <img
                      src={rev.studentAvatar}
                      alt={rev.studentName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">{rev.studentName}</p>
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          Verified Student
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Flag Report Button */}
                <button
                  onClick={() => handleFlagReview(rev._id)}
                  title="Report inappropriate review"
                  className="text-slate-300 hover:text-red-500 p-1 rounded transition cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Review Content */}
              {rev.title && <h5 className="text-xs font-bold text-slate-800">{rev.title}</h5>}
              <p className="text-xs text-slate-600 leading-relaxed">{rev.comment || rev.review}</p>

              {/* Footer: Helpful vote */}
              <div className="pt-2 flex items-center gap-4 text-[11px] text-slate-400 border-t border-slate-50">
                <button
                  onClick={() => handleVoteHelpful(rev._id)}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-[#FA5A36] transition cursor-pointer font-medium"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>Helpful ({rev.helpfulVotesCount || 0})</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Write a Review Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {myReview ? 'Edit Your Review' : 'Write a Review'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Share your genuine feedback with other students
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              {/* Eligibility Warning if not enrolled */}
              {!isEligible && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Verified Enrollment Notice: Only students enrolled in this course or session can submit verified reviews.
                  </span>
                </div>
              )}

              {/* Status alerts */}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Your Overall Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setInputRating(star)}
                      className="p-1 transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= inputRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {inputRating === 5 && 'Outstanding (5/5)'}
                    {inputRating === 4 && 'Very Good (4/5)'}
                    {inputRating === 3 && 'Average (3/5)'}
                    {inputRating === 2 && 'Below Average (2/5)'}
                    {inputRating === 1 && 'Poor (1/5)'}
                  </span>
                </div>
              </div>

              {/* Review Headline Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Headline <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={inputTitle}
                  onChange={(e) => setInputTitle(e.target.value)}
                  placeholder="e.g. In-depth explanations with real-world examples"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FA5A36]/30 focus:border-[#FA5A36] transition"
                />
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Written Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={inputComment}
                  onChange={(e) => setInputComment(e.target.value)}
                  placeholder="What did you like about the curriculum, teaching style, or assignments? How did it help you?"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FA5A36]/30 focus:border-[#FA5A36] transition"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2.5 bg-[#FA5A36] hover:bg-[#E04322] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs shadow-[#FA5A36]/25 transition cursor-pointer flex items-center gap-2"
                >
                  {submittingReview ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
