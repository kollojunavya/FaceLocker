"use client";

import { useState, useEffect } from 'react';
import { ReviewCard, type Review } from '@/components/ReviewCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getFirestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

// Define ReviewCardProps to include className
interface ReviewCardProps {
  review: Review;
  className?: string;
}

export default function ViewReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirestore();
    const reviewsQuery = query(collection(db, 'reviews'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
      const fetchedReviews: Review[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        author: doc.data().author,
        avatarUrl: doc.data().avatarUrl || 'https://placehold.co/100x100.png?text=User',
        date: doc.data().timestamp
          ? new Date(doc.data().timestamp.toDate()).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'Unknown date',
        rating: doc.data().rating,
        text: doc.data().text,
      }));
      setReviews(fetchedReviews);
      setLoading(false);
    }, (error) => {
      console.error('ViewReviewsPage: Failed to fetch reviews:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User Reviews</h1>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-xl text-gray-600 dark:text-gray-400 mt-4">Loading reviews...</p>
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <p className="text-xl text-gray-600 dark:text-gray-400">No reviews yet.</p>
            <Button
              onClick={() => router.push('/reviews/post')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Be the first to write a review
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}