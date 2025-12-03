import { collection, doc, getDoc, setDoc, getDocs, query, orderBy, deleteDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";

export type Language = "en" | "ar";

const slugify = (text: string): string =>
  text
    .toString()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

const deleteStorageFileByUrl = async (fileUrl?: string) => {
  if (!fileUrl || typeof fileUrl !== "string" || !fileUrl.startsWith("http")) {
    return;
  }

  try {
    const [, pathPart] = fileUrl.split("/o/");
    if (!pathPart) return;
    const cleanPath = decodeURIComponent(pathPart.split("?")[0]);
    const fileRef = ref(storage, cleanPath);
    await deleteObject(fileRef);
  } catch (error) {
    console.warn("Error deleting file from storage:", error);
  }
};

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
  categoryId?: string;
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

// Seed products function
export const seedProducts = async (): Promise<void> => {
  const imageUrl = "https://firebasestorage.googleapis.com/v0/b/emiratesd-29ff7.firebasestorage.app/o/products%2F1763300395206-1.png?alt=media&token=dd38f7dc-08bb-441d-a0ac-d5b6238bcff3";

  const productsData = [
    {
      name: { en: "Ajwa Dates", ar: "تمر عجوة" },
      description: { en: "Premium Ajwa dates from Medina, Grade 1, 2 & 3", ar: "تمر عجوة ممتاز من المدينة المنورة، درجات 1 و 2 و 3" },
      mainImage: imageUrl,
      images: [imageUrl],
      packageSize: "0.5, 1, 2, 3, 5, 10 kg",
      grade: "Grade 1, Grade 2, Grade 3",
    },
    {
      name: { en: "Medjool Dates", ar: "تمر المجهول" },
      description: { en: "Premium Medjool from Palestine, Saudi Arabia & Jordan", ar: "مجهول ممتاز من فلسطين والمملكة العربية السعودية والأردن" },
      mainImage: imageUrl,
      images: [imageUrl],
      packageSize: "Small, Medium, Large, Jumbo, Super Jumbo",
      grade: "Palestine, Saudi Arabia, Jordan",
    },
    {
      name: { en: "Khalas Dates", ar: "تمر خلاص" },
      description: { en: "Authentic Khalas dates, Grade 1, 2 & 3", ar: "تمر خلاص أصيل، درجات 1 و 2 و 3" },
      mainImage: imageUrl,
      images: [imageUrl],
      packageSize: "1, 2, 3, 5, 10 kg",
      grade: "Grade 1, Grade 2, Grade 3",
    },
    {
      name: { en: "Sukkary Dates", ar: "تمر سكري" },
      description: { en: "Sweet Sukkary dates, Grade 1, 2 & 3", ar: "تمر سكري حلو، درجات 1 و 2 و 3" },
      mainImage: imageUrl,
      images: [imageUrl],
      packageSize: "1, 2, 3, 5, 10 kg",
      grade: "Grade 1, Grade 2, Grade 3",
    },
    {
      name: { en: "Zahidi Dates", ar: "تمر زاهدي" },
      description: { en: "Classic Zahidi dates, Grade 1, 2 & 3", ar: "تمر زاهدي كلاسيكي، درجات 1 و 2 و 3" },
      mainImage: imageUrl,
      images: [imageUrl],
      packageSize: "1, 2, 3, 5, 10 kg",
      grade: "Grade 1, Grade 2, Grade 3",
    },
    {
      name: { en: "Khodri Dates", ar: "تمر خضري" },
      description: { en: "Premium Khodri variety, Grade 1, 2 & 3", ar: "صنف خضري ممتاز، درجات 1 و 2 و 3" },
      mainImage: imageUrl,
      images: [imageUrl],
      packageSize: "1, 2, 3, 5, 10 kg",
      grade: "Grade 1, Grade 2, Grade 3",
    },
    {
      name: { en: "Sagai Dates", ar: "تمر سقاي" },
      description: { en: "Sagai dates with Grade options & Gift Pack", ar: "تمر سقاي مع خيارات الدرجات وعلبة هدايا" },
      mainImage: imageUrl,
      images: [imageUrl],
      packageSize: "1, 2, 3, 5, 10 kg",
      grade: "Grade 1, Grade 2, Grade 3, Gift Pack",
    },
    {
      name: { en: "Mabroom Dates", ar: "تمر مبروم" },
      description: { en: "Chewy Mabroom dates, Grade 1, 2 & 3", ar: "تمر مبروم مطاطي، درجات 1 و 2 و 3" },
      mainImage: imageUrl,
      images: [imageUrl],
      packageSize: "1, 2, 3, 5, 10 kg",
      grade: "Grade 1, Grade 2, Grade 3",
    },
    {
      name: { en: "Barhi (Berni) Dates", ar: "تمر برحي" },
      description: { en: "Fresh Barhi dates, premium quality", ar: "تمر برحي طازج، جودة ممتازة" },
      mainImage: imageUrl,
      images: [imageUrl],
      packageSize: "1, 2, 3, 5, 10 kg",
    },
    {
      name: { en: "Mix & Stuffed Dates", ar: "تمر محشو ومختلط" },
      description: { en: "Variety of stuffed and mixed date products", ar: "مجموعة متنوعة من منتجات التمر المحشو والمختلط" },
      mainImage: imageUrl,
      images: [imageUrl],
      packageSize: "1, 2, 3, 5 kg",
      grade: "Almonds Stuffed, Pistachios Stuffed, Cashew Stuffed, Chocolate Coated, Honey & Cardamom",
    },
  ];

  try {
    for (const product of productsData) {
      await setDoc(doc(collection(db, "products")), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    console.log(`Successfully seeded ${productsData.length} products`);
  } catch (error) {
    console.error("Error seeding products:", error);
    throw error;
  }
};

// Product Categories
export interface ProductCategory {
  id?: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  slug: string;
  href: string;
  iconKey: string;
  order: number;
  createdAt?: any;
  updatedAt?: any;
}

const productCategorySeedData: Array<Omit<ProductCategory, "id" | "createdAt" | "updatedAt">> = [
  {
    name: { en: "Medjool Dates", ar: "تمر المجهول" },
    description: { en: "Premium quality dates", ar: "تمور عالية الجودة" },
    slug: "medjool-dates",
    href: "/products",
    iconKey: "medjool-dates",
    order: 1,
  },
  {
    name: { en: "Date Paste", ar: "معجون التمر" },
    description: { en: "Smooth & creamy", ar: "معجون ناعم وكريمي" },
    slug: "date-paste",
    href: "/products",
    iconKey: "date-paste",
    order: 2,
  },
  {
    name: { en: "Rutab Dates", ar: "تمر رطب" },
    description: { en: "Fresh & soft", ar: "طازجة وطرية" },
    slug: "rutab-dates",
    href: "/products",
    iconKey: "rutab-dates",
    order: 3,
  },
  {
    name: { en: "Holy Land Dates", ar: "تمور الأرض المقدسة" },
    description: { en: "Sacred & blessed", ar: "مباركة ومقدسة" },
    slug: "holy-land-dates",
    href: "/products",
    iconKey: "holy-land-dates",
    order: 4,
  },
  {
    name: { en: "Vacuumed Dates", ar: "تمور مفرغة الهواء" },
    description: { en: "Sealed freshness", ar: "طزاجة مختومة" },
    slug: "vacuumed-dates",
    href: "/products",
    iconKey: "vacuumed-dates",
    order: 5,
  },
  {
    name: { en: "Dates Syrup", ar: "دبس التمر" },
    description: { en: "Natural sweetener", ar: "محلي طبيعي" },
    slug: "dates-syrup",
    href: "/products",
    iconKey: "dates-syrup",
    order: 6,
  },
  {
    name: { en: "Dates with Chocolate", ar: "تمور بالشوكولاتة" },
    description: { en: "Sweet indulgence", ar: "متعة حلوة بالشوكولاتة" },
    slug: "dates-with-chocolate",
    href: "/products",
    iconKey: "dates-with-chocolate",
    order: 7,
  },
  {
    name: { en: "Dates with Nuts", ar: "تمور بالمكسرات" },
    description: { en: "Crunchy delight", ar: "قرمشة لذيذة" },
    slug: "dates-with-nuts",
    href: "/products",
    iconKey: "dates-with-nuts",
    order: 8,
  },
  {
    name: { en: "Dates with Fruit", ar: "تمور بالفواكه" },
    description: { en: "Fruity fusion", ar: "مزيج فاكهي" },
    slug: "dates-with-fruit",
    href: "/products",
    iconKey: "dates-with-fruit",
    order: 9,
  },
  {
    name: { en: "AQSA Dates", ar: "تمور الأقصى" },
    description: { en: "Premium selection", ar: "اختيار فاخر" },
    slug: "aqsa-dates",
    href: "/products",
    iconKey: "aqsa-dates",
    order: 10,
  },
];

const sanitizeCategoryPayload = (category: ProductCategory) => {
  const { id, ...rest } = category;
  const slug = slugify(category.slug || category.name?.en || category.name?.ar || "category");
  return {
    ...rest,
    slug,
    iconKey: category.iconKey || "medjool-dates",
    href: category.href || "/products",
    order: typeof category.order === "number" ? category.order : 1,
  };
};

export const getProductCategories = async (): Promise<ProductCategory[]> => {
  try {
    const categoriesQuery = query(collection(db, "productCategories"), orderBy("order", "asc"));
    const querySnapshot = await getDocs(categoriesQuery);
    const categories: ProductCategory[] = [];
    querySnapshot.forEach((docSnapshot) => {
      categories.push({ id: docSnapshot.id, ...docSnapshot.data() } as ProductCategory);
    });
    return categories;
  } catch (error) {
    console.error("Error fetching product categories:", error);
    return [];
  }
};

export const saveProductCategory = async (category: ProductCategory): Promise<void> => {
  try {
    const payload = sanitizeCategoryPayload(category);
    if (category.id) {
      await setDoc(
        doc(db, "productCategories", category.id),
        {
          ...payload,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      const newSlug = payload.slug || slugify(payload.name.en);
      const docRef = doc(db, "productCategories", newSlug);
      await setDoc(docRef, {
        ...payload,
        slug: newSlug,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error saving product category:", error);
    throw error;
  }
};

export const deleteProductCategory = async (categoryId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "productCategories", categoryId));
  } catch (error) {
    console.error("Error deleting product category:", error);
    throw error;
  }
};

export const seedProductCategories = async (): Promise<void> => {
  try {
    for (const category of productCategorySeedData) {
      const docRef = doc(db, "productCategories", category.slug);
      await setDoc(docRef, {
        ...category,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    console.log(`Successfully seeded ${productCategorySeedData.length} product categories`);
  } catch (error) {
    console.error("Error seeding product categories:", error);
    throw error;
  }
};

// About Section
export type BackgroundType = "none" | "image" | "video";

export interface PromiseFeature {
  title: Record<Language, string>;
  description: Record<Language, string>;
  detail?: Record<Language, string>;
  icon?: string;
}

export interface PromiseSection {
  badge: Record<Language, string>;
  title: Record<Language, string>;
  description: Record<Language, string>;
  features: PromiseFeature[];
}

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
  promiseSection?: PromiseSection;
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

// Gift Products Section
export interface GiftProductsSection {
  id?: string;
  title: Record<Language, string>;
  subtitle: Record<Language, string>;
  giftProductIds: string[]; // Array of gift product IDs
  updatedAt?: any;
}

export const getGiftProductsSection = async (): Promise<GiftProductsSection | null> => {
  try {
    const giftSectionDoc = await getDoc(doc(db, "homeContent", "giftProducts"));
    if (giftSectionDoc.exists()) {
      return { id: giftSectionDoc.id, ...giftSectionDoc.data() } as GiftProductsSection;
    }
    return null;
  } catch (error) {
    console.error("Error fetching gift products section:", error);
    return null;
  }
};

export const saveGiftProductsSection = async (giftSection: GiftProductsSection): Promise<void> => {
  try {
    await setDoc(
      doc(db, "homeContent", "giftProducts"),
      {
        ...giftSection,
        updatedAt: serverTimestamp(),
      }
    );
  } catch (error) {
    console.error("Error saving gift products section:", error);
    throw error;
  }
};

// Events Section
export interface Event {
  id?: string;
  title: Record<Language, string>;
  imageUrl: string;
}

export interface EventsSection {
  id?: string;
  events: Event[];
  updatedAt?: any;
}

export const getEventsSection = async (): Promise<EventsSection | null> => {
  try {
    const eventsDoc = await getDoc(doc(db, "homeContent", "events"));
    if (eventsDoc.exists()) {
      return { id: eventsDoc.id, ...eventsDoc.data() } as EventsSection;
    }
    return null;
  } catch (error) {
    console.error("Error fetching events section:", error);
    return null;
  }
};

export const saveEventsSection = async (events: EventsSection): Promise<void> => {
  try {
    await setDoc(
      doc(db, "homeContent", "events"),
      {
        ...events,
        updatedAt: serverTimestamp(),
      }
    );
  } catch (error) {
    console.error("Error saving events section:", error);
    throw error;
  }
};

// Gallery Section
export interface GalleryImage {
  id?: string;
  imageUrl: string;
  createdAt?: any;
}

export interface Album {
  id?: string;
  name: Record<Language, string>;
  images: GalleryImage[];
  createdAt?: any;
  updatedAt?: any;
}

export interface Country {
  id?: string;
  name: Record<Language, string>;
  albums: Album[];
  createdAt?: any;
  updatedAt?: any;
}

export const getGallery = async (): Promise<Country[]> => {
  try {
    const countriesQuery = query(collection(db, "gallery"));
    const querySnapshot = await getDocs(countriesQuery);
    const countries: Country[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      countries.push({
        id: doc.id,
        ...data,
        albums: data.albums || [],
      } as Country);
    });
    // Sort by createdAt if available, otherwise by id
    countries.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        const aTime = a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        const bTime = b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        return bTime - aTime;
      }
      return 0;
    });
    return countries;
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return [];
  }
};

export const saveCountry = async (country: Country): Promise<void> => {
  try {
    // Exclude id field when saving to Firestore
    const { id, ...countryDataWithoutId } = country;

    if (country.id) {
      await setDoc(
        doc(db, "gallery", country.id),
        {
          ...countryDataWithoutId,
          updatedAt: serverTimestamp(),
        }
      );
    } else {
      const newCountryRef = doc(collection(db, "gallery"));
      await setDoc(newCountryRef, {
        ...countryDataWithoutId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error saving country:", error);
    throw error;
  }
};

export const deleteCountry = async (countryId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "gallery", countryId));
  } catch (error) {
    console.error("Error deleting country:", error);
    throw error;
  }
};

export const saveAlbum = async (countryId: string, album: Album): Promise<void> => {
  try {
    if (!countryId) {
      throw new Error("Country ID is required");
    }

    const countryRef = doc(db, "gallery", countryId);
    const countryDoc = await getDoc(countryRef);

    if (!countryDoc.exists()) {
      throw new Error("Country not found");
    }

    const countryData = countryDoc.data() as Country;
    const albums = countryData.albums || [];

    // Ensure album has required fields
    const albumToSave: Album = {
      name: album.name || { en: "", ar: "" },
      images: album.images || [],
    };

    if (album.id) {
      // Update existing album
      const index = albums.findIndex((a) => a.id === album.id);
      if (index > -1) {
        albums[index] = {
          ...albumToSave,
          id: album.id,
          createdAt: albums[index].createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } else {
        throw new Error("Album not found for update");
      }
    } else {
      // Add new album
      const newAlbumId = Date.now().toString();
      albums.push({
        ...albumToSave,
        id: newAlbumId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Exclude id field when saving to Firestore
    const { id, ...countryDataWithoutId } = countryData;
    await setDoc(countryRef, {
      ...countryDataWithoutId,
      albums,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving album:", error);
    throw error;
  }
};

export const deleteAlbum = async (countryId: string, albumId: string): Promise<void> => {
  try {
    const countryRef = doc(db, "gallery", countryId);
    const countryDoc = await getDoc(countryRef);

    if (!countryDoc.exists()) {
      throw new Error("Country not found");
    }

    const countryData = countryDoc.data() as Country;
    const albums = (countryData.albums || []).filter((a) => a.id !== albumId);

    // Exclude id field when saving to Firestore
    const { id, ...countryDataWithoutId } = countryData;
    await setDoc(countryRef, {
      ...countryDataWithoutId,
      albums,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error deleting album:", error);
    throw error;
  }
};

export const addImageToAlbum = async (countryId: string, albumId: string, imageUrl: string): Promise<void> => {
  try {
    const countryRef = doc(db, "gallery", countryId);
    const countryDoc = await getDoc(countryRef);

    if (!countryDoc.exists()) {
      throw new Error("Country not found");
    }

    const countryData = countryDoc.data() as Country;
    const albums = countryData.albums || [];
    const albumIndex = albums.findIndex((a) => a.id === albumId);

    if (albumIndex === -1) {
      throw new Error("Album not found");
    }

    const album = albums[albumIndex];
    const images = album.images || [];
    images.push({
      imageUrl,
      createdAt: new Date().toISOString(),
    });

    albums[albumIndex] = {
      ...album,
      images,
      updatedAt: new Date().toISOString(),
    };

    // Exclude id field when saving to Firestore
    const { id, ...countryDataWithoutId } = countryData;
    await setDoc(countryRef, {
      ...countryDataWithoutId,
      albums,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding image to album:", error);
    throw error;
  }
};

// Home Content Gallery Section
export interface HomeGalleryImage {
  id?: string;
  imageUrl: string;
  title: Record<Language, string>;
}

export interface HomeGallerySection {
  id?: string;
  title: Record<Language, string>;
  subtitle: Record<Language, string>;
  selectedAlbumIds: string[]; // Array of album IDs from gallery (format: "countryId:albumId")
  images: HomeGalleryImage[]; // Direct images added to this section
  updatedAt?: any;
}

export const getHomeGallerySection = async (): Promise<HomeGallerySection | null> => {
  try {
    const galleryDoc = await getDoc(doc(db, "homeContent", "gallery"));
    if (galleryDoc.exists()) {
      return { id: galleryDoc.id, ...galleryDoc.data() } as HomeGallerySection;
    }
    return null;
  } catch (error) {
    console.error("Error fetching home gallery section:", error);
    return null;
  }
};

export const saveHomeGallerySection = async (gallery: HomeGallerySection): Promise<void> => {
  try {
    await setDoc(
      doc(db, "homeContent", "gallery"),
      {
        ...gallery,
        updatedAt: serverTimestamp(),
      }
    );
  } catch (error) {
    console.error("Error saving home gallery section:", error);
    throw error;
  }
};

export interface ZeroFeeCountry {
  id?: string;
  countryCode: string;
  name: Record<Language, string>;
  note?: Record<Language, string>;
}

export interface ZeroFeesShippingSection {
  id?: string;
  title: Record<Language, string>;
  subtitle: Record<Language, string>;
  description: Record<Language, string>;
  countries: ZeroFeeCountry[];
  updatedAt?: any;
}

export const getZeroFeesShippingSection = async (): Promise<ZeroFeesShippingSection | null> => {
  try {
    const sectionDoc = await getDoc(doc(db, "homeContent", "zeroFeesShipping"));
    if (sectionDoc.exists()) {
      return { id: sectionDoc.id, ...sectionDoc.data() } as ZeroFeesShippingSection;
    }
    return null;
  } catch (error) {
    console.error("Error fetching zero fees shipping section:", error);
    return null;
  }
};

export const saveZeroFeesShippingSection = async (section: ZeroFeesShippingSection): Promise<void> => {
  try {
    await setDoc(
      doc(db, "homeContent", "zeroFeesShipping"),
      {
        ...section,
        updatedAt: serverTimestamp(),
      }
    );
  } catch (error) {
    console.error("Error saving zero fees shipping section:", error);
    throw error;
  }
};

// Website Settings
export interface ContactEntry {
  id?: string;
  label: string;
  value: string;
}

export interface LocationEntry {
  id?: string;
  title: string;
  address: string;
  mapLink?: string;
}

export interface WebsiteSettings {
  id?: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    google?: string;
  };
  phones: ContactEntry[];
  emails: ContactEntry[];
  locations: LocationEntry[];
  updatedAt?: any;
}

export const getWebsiteSettings = async (): Promise<WebsiteSettings | null> => {
  try {
    const settingsDoc = await getDoc(doc(db, "settings", "website"));
    if (settingsDoc.exists()) {
      return { id: settingsDoc.id, ...settingsDoc.data() } as WebsiteSettings;
    }
    return null;
  } catch (error) {
    console.error("Error fetching website settings:", error);
    return null;
  }
};

export const saveWebsiteSettings = async (settings: WebsiteSettings): Promise<void> => {
  try {
    await setDoc(
      doc(db, "settings", "website"),
      {
        ...settings,
        updatedAt: serverTimestamp(),
      }
    );
  } catch (error) {
    console.error("Error saving website settings:", error);
    throw error;
  }
};

export const deleteImageFromAlbum = async (countryId: string, albumId: string, imageIndex: number): Promise<void> => {
  try {
    const countryRef = doc(db, "gallery", countryId);
    const countryDoc = await getDoc(countryRef);

    if (!countryDoc.exists()) {
      throw new Error("Country not found");
    }

    const countryData = countryDoc.data() as Country;
    const albums = countryData.albums || [];
    const albumIndex = albums.findIndex((a) => a.id === albumId);

    if (albumIndex === -1) {
      throw new Error("Album not found");
    }

    const album = albums[albumIndex];
    const images = album.images || [];

    // Delete image from storage if needed
    if (images[imageIndex]?.imageUrl) {
      try {
        // Extract path from Firebase Storage URL
        // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
        const imageUrl = images[imageIndex].imageUrl;
        if (imageUrl && imageUrl.startsWith("https://")) {
          const urlParts = imageUrl.split("/o/");
          if (urlParts.length > 1) {
            const pathPart = urlParts[1].split("?")[0];
            const decodedPath = decodeURIComponent(pathPart);
            const imageRef = ref(storage, decodedPath);
            await deleteObject(imageRef);
          }
        }
      } catch (error) {
        console.warn("Error deleting image from storage:", error);
        // Continue with deletion even if storage deletion fails
      }
    }

    images.splice(imageIndex, 1);

    albums[albumIndex] = {
      ...album,
      images,
      updatedAt: new Date().toISOString(),
    };

    // Exclude id field when saving to Firestore
    const { id, ...countryDataWithoutId } = countryData;
    await setDoc(countryRef, {
      ...countryDataWithoutId,
      albums,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error deleting image from album:", error);
    throw error;
  }
};

// Gift Products
export interface GiftProduct {
  id?: string;
  name: Record<Language, string>;
  image: string;
  packageSize?: string;
  grade?: string;
  createdAt?: any;
  updatedAt?: any;
}

export const getGiftProducts = async (): Promise<GiftProduct[]> => {
  try {
    const giftProductsQuery = query(collection(db, "giftProducts"));
    const querySnapshot = await getDocs(giftProductsQuery);
    const giftProducts: GiftProduct[] = [];
    querySnapshot.forEach((doc) => {
      giftProducts.push({ id: doc.id, ...doc.data() } as GiftProduct);
    });
    // Sort by createdAt if available, otherwise by id
    giftProducts.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        const aTime = a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        const bTime = b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        return bTime - aTime;
      }
      return 0;
    });
    return giftProducts;
  } catch (error) {
    console.error("Error fetching gift products:", error);
    return [];
  }
};

export const saveGiftProduct = async (giftProduct: GiftProduct): Promise<void> => {
  try {
    if (giftProduct.id) {
      // Update existing gift product
      await setDoc(
        doc(db, "giftProducts", giftProduct.id),
        {
          ...giftProduct,
          updatedAt: serverTimestamp(),
        }
      );
    } else {
      // Create new gift product
      await setDoc(doc(collection(db, "giftProducts")), {
        ...giftProduct,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error saving gift product:", error);
    throw error;
  }
};

export const deleteGiftProduct = async (giftProductId: string): Promise<void> => {
  try {
    const giftProductDoc = await getDoc(doc(db, "giftProducts", giftProductId));
    if (giftProductDoc.exists()) {
      const giftProductData = giftProductDoc.data() as GiftProduct;

      // Delete image from storage
      if (giftProductData.image && giftProductData.image.startsWith("https://")) {
        try {
          const urlParts = giftProductData.image.split("/");
          const fileName = urlParts[urlParts.length - 1].split("?")[0];
          const imageRef = ref(storage, `gift-products/${fileName}`);
          await deleteObject(imageRef);
        } catch (storageError) {
          console.warn("Error deleting image from storage:", storageError);
        }
      }

      await deleteDoc(doc(db, "giftProducts", giftProductId));
    }
  } catch (error) {
    console.error("Error deleting gift product:", error);
    throw error;
  }
};

export const seedGiftProducts = async (): Promise<void> => {
  const imageUrl = "https://firebasestorage.googleapis.com/v0/b/emiratesd-29ff7.firebasestorage.app/o/products%2F1763300395206-1.png?alt=media&token=dd38f7dc-08bb-441d-a0ac-d5b6238bcff3";

  const giftProductsData = [
    {
      name: { en: "Premium Gift Box", ar: "صندوق هدايا ممتاز" },
      image: imageUrl,
      packageSize: "1kg, 2kg, 3kg, 5kg, 10kg",
      grade: "Grade 1, Grade 2, Grade 3",
    },
    {
      name: { en: "Deluxe Gift Set", ar: "مجموعة هدايا فاخرة" },
      image: imageUrl,
      packageSize: "1kg, 2kg, 3kg, 5kg, 10kg",
      grade: "Grade 1, Grade 2, Grade 3",
    },
    {
      name: { en: "Luxury Date Collection", ar: "مجموعة التمور الفاخرة" },
      image: imageUrl,
      packageSize: "1kg, 2kg, 3kg, 5kg, 10kg",
      grade: "Grade 1, Grade 2, Grade 3",
    },
  ];

  try {
    // Get existing gift products
    const existingProducts = await getGiftProducts();

    // Only seed if there are no existing products
    if (existingProducts.length === 0) {
      for (const giftProduct of giftProductsData) {
        await setDoc(doc(collection(db, "giftProducts")), {
          ...giftProduct,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      console.log(`Successfully seeded ${giftProductsData.length} gift products`);
    } else {
      // Update existing products to include packageSize and grade if they don't have them
      for (const existingProduct of existingProducts) {
        if (!existingProduct.packageSize || !existingProduct.grade) {
          await setDoc(
            doc(db, "giftProducts", existingProduct.id!),
            {
              ...existingProduct,
              packageSize: existingProduct.packageSize || "1kg, 2kg, 3kg, 5kg, 10kg",
              grade: existingProduct.grade || "Grade 1, Grade 2, Grade 3",
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }
      console.log(`Updated ${existingProducts.length} existing gift products with packageSize and grade`);
    }
  } catch (error) {
    console.error("Error seeding gift products:", error);
    throw error;
  }
};

// News Management
export interface NewsArticle {
  id?: string;
  title: Record<Language, string>;
  description: Record<Language, string>;
  contentHtml: Record<Language, string>;
  coverImage: string;
  gallery: string[];
  publishDate?: string;
  createdAt?: any;
  updatedAt?: any;
}

export const getNews = async (): Promise<NewsArticle[]> => {
  try {
    const newsQuery = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(newsQuery);
    const news: NewsArticle[] = [];
    querySnapshot.forEach((doc) => {
      news.push({ id: doc.id, ...doc.data() } as NewsArticle);
    });
    return news;
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
};

export const saveNews = async (news: NewsArticle): Promise<void> => {
  try {
    const baseData = {
      title: news.title || { en: "", ar: "" },
      description: news.description || { en: "", ar: "" },
      contentHtml: news.contentHtml || { en: "", ar: "" },
      coverImage: news.coverImage,
      gallery: news.gallery || [],
      publishDate: news.publishDate || null,
    };

    if (news.id) {
      await setDoc(
        doc(db, "news", news.id),
        {
          ...baseData,
          createdAt: news.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      const newsRef = doc(collection(db, "news"));
      await setDoc(newsRef, {
        ...baseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error saving news:", error);
    throw error;
  }
};

export const deleteNews = async (newsId: string): Promise<void> => {
  try {
    const newsDoc = await getDoc(doc(db, "news", newsId));
    if (newsDoc.exists()) {
      const newsData = newsDoc.data() as NewsArticle;
      const imagesToDelete = [newsData.coverImage, ...(newsData.gallery || [])].filter(Boolean);

      for (const imageUrl of imagesToDelete) {
        try {
          await deleteStorageFileByUrl(imageUrl);
        } catch (storageError) {
          console.warn("Error deleting news image from storage:", storageError);
        }
      }
    }

    await deleteDoc(doc(db, "news", newsId));
  } catch (error) {
    console.error("Error deleting news:", error);
    throw error;
  }
};

// Contact Messages
export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  seen: boolean;
  resolved: boolean;
  createdAt?: any;
}

export const getContactMessages = async (): Promise<ContactMessage[]> => {
  try {
    const messagesQuery = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(messagesQuery);
    const messages: ContactMessage[] = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as ContactMessage);
    });
    return messages;
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    return [];
  }
};

export const markMessageAsSeen = async (messageId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, "messages", messageId), {
      seen: true,
    });
  } catch (error) {
    console.error("Error marking message as seen:", error);
    throw error;
  }
};

export const markMessageAsResolved = async (messageId: string, resolved: boolean): Promise<void> => {
  try {
    await updateDoc(doc(db, "messages", messageId), {
      resolved: resolved,
    });
  } catch (error) {
    console.error("Error updating message resolved status:", error);
    throw error;
  }
};

export const deleteContactMessage = async (messageId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "messages", messageId));
  } catch (error) {
    console.error("Error deleting contact message:", error);
    throw error;
  }
};

// Orders
export interface OrderItem {
  productName?: string;
  name?: string; // Alternative field name
  product?: string; // Alternative field name
  grade?: string;
  packageSize?: string;
  quantity: number;
}

export interface Order {
  id?: string;
  status: "new" | "processing" | "completed";
  createdAt?: any;
  companyName?: string;
  contactName: string;
  contactPhone: string;
  items: OrderItem[];
}

export const getOrders = async (): Promise<Order[]> => {
  try {
    const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(ordersQuery);
    const orders: Order[] = [];
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order);
    });
    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

export const updateOrderStatus = async (orderId: string, status: "new" | "processing" | "completed"): Promise<void> => {
  try {
    await updateDoc(doc(db, "orders", orderId), {
      status,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "orders", orderId));
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
};


