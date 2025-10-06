'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null | undefined; // Document data with ID, or null, or undefined when loading.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

export interface UseDocOptions<T> {
    initialData?: WithId<T>;
}


/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Handles nullable references.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *
 *
 * @template T Optional type for document data. Defaults to DocumentData.
 * @param {DocumentReference<DocumentData> | null | undefined} docRef -
 * The Firestore DocumentReference. Waits if null/undefined.
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = DocumentData>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
  options?: UseDocOptions<T>
): UseDocResult<T> {
  // Initialize data to `undefined` to represent the "not yet loaded" state.
  const [data, setData] = useState<WithId<T> | null | undefined>(options?.initialData ?? undefined);
  const [isLoading, setIsLoading] = useState<boolean>(!options?.initialData); // Start in loading state
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // If there's no docRef, we are not loading and there's no data.
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Start loading when a valid docRef is provided.
    if (!options?.initialData) {
        setIsLoading(true);
        setData(undefined);
    }
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          // Document does not exist, set data to `null` to indicate this.
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (_error: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        })

        setError(contextualError)
        setData(null) // On error, data is null
        setIsLoading(false)

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef, options?.initialData]); // Re-run if the memoizedDocRef or initialData changes.

  return { data, isLoading, error };
}
