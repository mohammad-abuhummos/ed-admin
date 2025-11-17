import { collection, doc, getDoc, setDoc, getDocs, query, orderBy, deleteDoc, serverTimestamp } from "firebase/firestore";
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

export const uploadImage = async (file: File, folder: string = "hero-slides"): Promise<string> => {
  try {
    const timestamp = Date.now();
    const fileName = `${folder}/${timestamp}-${file.name}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

// Products
export interface Product {
  id?: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  mainImage: string;
  images: string[];
  packageSize?: string;
  grade?: string;
  price?: number;
  createdAt?: any;
  updatedAt?: any;
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    const productsQuery = query(collection(db, "products"));
    const querySnapshot = await getDocs(productsQuery);
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    // Sort by createdAt if available, otherwise by id
    products.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        const aTime = a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        const bTime = b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        return bTime - aTime;
      }
      return 0;
    });
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const saveProduct = async (product: Product): Promise<void> => {
  try {
    if (product.id) {
      // Update existing product
      await setDoc(
        doc(db, "products", product.id),
        {
          ...product,
          updatedAt: serverTimestamp(),
        }
      );
    } else {
      // Create new product
      await setDoc(doc(collection(db, "products")), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error saving product:", error);
    throw error;
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const productDoc = await getDoc(doc(db, "products", productId));
    if (productDoc.exists()) {
      const productData = productDoc.data() as Product;

      // Delete images from storage
      const imagesToDelete = [
        productData.mainImage,
        ...(productData.images || []),
      ].filter(Boolean);

      for (const imageUrl of imagesToDelete) {
        try {
          if (imageUrl && imageUrl.startsWith("https://")) {
            const urlParts = imageUrl.split("/");
            const fileName = urlParts[urlParts.length - 1].split("?")[0];
            const imageRef = ref(storage, `products/${fileName}`);
            await deleteObject(imageRef);
          }
        } catch (storageError) {
          console.warn("Error deleting image from storage:", storageError);
        }
      }

      await deleteDoc(doc(db, "products", productId));
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

// About Section
export type BackgroundType = "none" | "image" | "video";

export interface AboutSection {
  id?: string;
  aboutUs: {
    title: Record<Language, string>;
    content: Record<Language, string>;
    backgroundType: BackgroundType;
    backgroundImage?: string;
    backgroundVideo?: string;
  };
  mission: {
    title: Record<Language, string>;
    content: Record<Language, string>;
    backgroundType: BackgroundType;
    backgroundImage?: string;
    backgroundVideo?: string;
  };
  vision: {
    title: Record<Language, string>;
    content: Record<Language, string>;
    backgroundType: BackgroundType;
    backgroundImage?: string;
    backgroundVideo?: string;
  };
  updatedAt?: any;
}

export const getAboutSection = async (): Promise<AboutSection | null> => {
  try {
    const aboutDoc = await getDoc(doc(db, "homeContent", "about"));
    if (aboutDoc.exists()) {
      return { id: aboutDoc.id, ...aboutDoc.data() } as AboutSection;
    }
    return null;
  } catch (error) {
    console.error("Error fetching about section:", error);
    return null;
  }
};

export const saveAboutSection = async (about: AboutSection): Promise<void> => {
  try {
    await setDoc(
      doc(db, "homeContent", "about"),
      {
        ...about,
        updatedAt: serverTimestamp(),
      }
    );
  } catch (error) {
    console.error("Error saving about section:", error);
    throw error;
  }
};

export const uploadVideo = async (file: File): Promise<string> => {
  try {
    const timestamp = Date.now();
    const fileName = `about/videos/${timestamp}-${file.name}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading video:", error);
    throw error;
  }
};

// Why Choose Section
export interface WhyChoosePoint {
  title: Record<Language, string>;
  content: Record<Language, string>;
}

export interface WhyChooseSection {
  id?: string;
  title: Record<Language, string>;
  points: WhyChoosePoint[];
  updatedAt?: any;
}

export const getWhyChooseSection = async (): Promise<WhyChooseSection | null> => {
  try {
    const whyChooseDoc = await getDoc(doc(db, "homeContent", "whyChoose"));
    if (whyChooseDoc.exists()) {
      return { id: whyChooseDoc.id, ...whyChooseDoc.data() } as WhyChooseSection;
    }
    return null;
  } catch (error) {
    console.error("Error fetching why choose section:", error);
    return null;
  }
};

export const saveWhyChooseSection = async (whyChoose: WhyChooseSection): Promise<void> => {
  try {
    await setDoc(
      doc(db, "homeContent", "whyChoose"),
      {
        ...whyChoose,
        updatedAt: serverTimestamp(),
      }
    );
  } catch (error) {
    console.error("Error saving why choose section:", error);
    throw error;
  }
};

// Video Section
export interface VideoSection {
  id?: string;
  title: Record<Language, string>;
  subtitle: Record<Language, string>;
  videoUrl: string;
  updatedAt?: any;
}

export const getVideoSection = async (): Promise<VideoSection | null> => {
  try {
    const videoDoc = await getDoc(doc(db, "homeContent", "video"));
    if (videoDoc.exists()) {
      return { id: videoDoc.id, ...videoDoc.data() } as VideoSection;
    }
    return null;
  } catch (error) {
    console.error("Error fetching video section:", error);
    return null;
  }
};

export const saveVideoSection = async (video: VideoSection): Promise<void> => {
  try {
    await setDoc(
      doc(db, "homeContent", "video"),
      {
        ...video,
        updatedAt: serverTimestamp(),
      }
    );
  } catch (error) {
    console.error("Error saving video section:", error);
    throw error;
  }
};

// Trending Products Section
export interface TrendingProductsSection {
  id?: string;
  title: Record<Language, string>;
  subtitle: Record<Language, string>;
  productIds: string[]; // Array of product IDs
  updatedAt?: any;
}

export const getTrendingProductsSection = async (): Promise<TrendingProductsSection | null> => {
  try {
    const trendingDoc = await getDoc(doc(db, "homeContent", "trendingProducts"));
    if (trendingDoc.exists()) {
      return { id: trendingDoc.id, ...trendingDoc.data() } as TrendingProductsSection;
    }
    return null;
  } catch (error) {
    console.error("Error fetching trending products section:", error);
    return null;
  }
};

export const saveTrendingProductsSection = async (trending: TrendingProductsSection): Promise<void> => {
  try {
    await setDoc(
      doc(db, "homeContent", "trendingProducts"),
      {
        ...trending,
        updatedAt: serverTimestamp(),
      }
    );
  } catch (error) {
    console.error("Error saving trending products section:", error);
    throw error;
  }
};

