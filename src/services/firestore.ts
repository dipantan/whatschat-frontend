// static firestore operations
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  getDoc,
} from "firebase/firestore";

const db = getFirestore();

// create a new collection
export const createCollection = async (
  collectionName: string,
  data?: unknown,
  id?: string
) => {
  const ref = collection(db, collectionName);
  if (id) {
    const docRef = doc(ref, id);
    await setDoc(docRef, data);
    return docRef;
  }
  const docRef = await addDoc(ref, data);
  return docRef;
};

export const getDocument = async (collectionName: string, id: string) => {
  const ref = doc(db, collectionName, id);
  const docSnap = await getDoc(ref);
  return docSnap;
};
