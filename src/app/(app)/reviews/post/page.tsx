"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewForm } from '@/components/ReviewForm';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext'; // Fixed import casing
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Define ReviewFormData to match ReviewForm's expected props
interface ReviewFormData {
  reviewText: string;
  rating?: number;
}

export default function PostReviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmitReview = async (data: ReviewFormData) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to submit a review.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    try {
      const db = getFirestore();
      await addDoc(collection(db, 'reviews'), {
        userId: user.uid,
        author: user.displayName || user.email || 'Anonymous',
        avatarUrl: user.photoURL || null,
        rating: data.rating ?? 0, // Fixed: Use data.rating
        text: data.reviewText,
        timestamp: serverTimestamp(),
      });
      toast({
        title: 'Review Submitted!',
        description: 'Thank you for your feedback.',
        className: 'bg-green-600 text-white',
      });
      router.push('/reviews/view');
    } catch (error) {
      console.error('PostReviewPage: Failed to submit review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6 flex items-center text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="p-6 bg-blue-50 dark:bg-blue-900">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Write a Review</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">Share your thoughts about FaceLocker.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ReviewForm onSubmitReview={handleSubmitReview} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}