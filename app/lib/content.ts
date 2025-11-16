import { collection, doc, getDoc, setDoc, getDocs, query, orderBy, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";

export type Language = "en" | "ar";

export interface HeroSlide {
  id?: string;
  image: string;
  title: Record<Language, string>;
  subtitle: Record<Language, string>;
  action1: {
    title: Record<Language, string>;
    link: string;
  };
  action2: {
    title: Record<Language, string>;
    link: string;
  };
  order: number;
}

export const getHeroSlides = async (): Promise<HeroSlide[]> => {
  try {
    const slidesQuery = query(
      collection(db, "homeContent", "hero", "slides"),
      orderBy("order", "asc")
    );
    const querySnapshot = await getDocs(slidesQuery);
    const slides: HeroSlide[] = [];
    querySnapshot.forEach((doc) => {
      slides.push({ id: doc.id, ...doc.data() } as HeroSlide);
    });
    return slides;
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    return [];
  }
};

export const saveHeroSlide = async (slide: HeroSlide): Promise<void> => {
  try {
    if (slide.id) {
      // Update existing slide
      await setDoc(
        doc(db, "homeContent", "hero", "slides", slide.id),
        slide
      );
    } else {
      // Create new slide
      const slidesRef = collection(db, "homeContent", "hero", "slides");
      const maxOrderQuery = query(slidesRef, orderBy("order", "desc"));
      const snapshot = await getDocs(maxOrderQuery);
      const maxOrder = snapshot.empty ? 0 : (snapshot.docs[0].data().order || 0);
      
      await setDoc(doc(slidesRef), {
        ...slide,
        order: maxOrder + 1,
      });
    }
  } catch (error) {
    console.error("Error saving hero slide:", error);
    throw error;
  }
};

export const deleteHeroSlide = async (slideId: string): Promise<void> => {
  try {
    const slideDoc = await getDoc(doc(db, "homeContent", "hero", "slides", slideId));
    if (slideDoc.exists()) {
      const slideData = slideDoc.data() as HeroSlide;
      // Delete image from storage if it exists
      if (slideData.image && slideData.image.startsWith("https://")) {
        try {
          // Extract path from URL and delete
          const urlParts = slideData.image.split("/");
          const fileName = urlParts[urlParts.length - 1].split("?")[0];
          const imageRef = ref(storage, `hero-slides/${fileName}`);
          await deleteObject(imageRef);
        } catch (storageError) {
          console.warn("Error deleting image from storage:", storageError);
        }
      }
      await deleteDoc(doc(db, "homeContent", "hero", "slides", slideId));
    }
  } catch (error) {
    console.error("Error deleting hero slide:", error);
    throw error;
  }
};

export const uploadImage = async (file: File): Promise<string> => {
  try {
    const timestamp = Date.now();
    const fileName = `hero-slides/${timestamp}-${file.name}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

