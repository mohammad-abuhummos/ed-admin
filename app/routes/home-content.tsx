import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { Sidebar } from "~/components/Sidebar";
import { useAuth } from "~/contexts/AuthContext";
import { logout } from "~/lib/auth";
import {
  getHeroSlides,
  saveHeroSlide,
  deleteHeroSlide,
  uploadImage,
  getAboutSection,
  saveAboutSection,
  uploadVideo,
  getWhyChooseSection,
  saveWhyChooseSection,
  getVideoSection,
  saveVideoSection,
  getTrendingProductsSection,
  saveTrendingProductsSection,
  getProducts,
  type HeroSlide,
  type AboutSection,
  type WhyChooseSection,
  type WhyChoosePoint,
  type VideoSection,
  type TrendingProductsSection,
  type Product,
  type Language,
  type BackgroundType,
} from "~/lib/content";
import type { Route } from "./+types/home-content";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Home Content - Emirates Delights Admin" },
    { name: "description", content: "Manage home page content" },
  ];
}

function HomeContentPage() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"hero" | "video" | "about" | "whyChoose" | "trendingProducts">("hero");
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [aboutSection, setAboutSection] = useState<AboutSection | null>(null);
  const [whyChooseSection, setWhyChooseSection] = useState<WhyChooseSection | null>(null);
  const [videoSection, setVideoSection] = useState<VideoSection | null>(null);
  const [trendingProductsSection, setTrendingProductsSection] = useState<TrendingProductsSection | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>("en");
  const [savingAbout, setSavingAbout] = useState(false);
  const [savingWhyChoose, setSavingWhyChoose] = useState(false);
  const [savingVideo, setSavingVideo] = useState(false);
  const [savingTrendingProducts, setSavingTrendingProducts] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [slidesData, aboutData, whyChooseData, videoData, trendingData, productsData] = await Promise.all([
        getHeroSlides(),
        getAboutSection(),
        getWhyChooseSection(),
        getVideoSection(),
        getTrendingProductsSection(),
        getProducts(),
      ]);
      setSlides(slidesData);
      if (aboutData) {
        setAboutSection(aboutData);
      } else {
        // Initialize with seed content
        setAboutSection({
          aboutUs: {
            title: {
              en: "Who We Are",
              ar: "من نحن",
            },
            content: {
              en: "From the city of Al Ain, home to the date farms of the United Arab Emirates, Emirates Delight for Dates was founded twenty years ago. Since then, it has distinguished itself as a pioneer in offering a wide selection of the world's finest date varieties all in one place, bringing them directly to your hands.\n\nBuilding on the UAE's marketing and logistical advantages and its commitment to world-class quality, the company delivers premium date products sourced from the best cultivation regions to serve all segments of the market — locally, regionally, and internationally.\n\nEmirates Delight for Dates offers packaging solutions designed to suit all market channels — retail, wholesale, catering, gifting, and special occasions — featuring a full range of date types and date-based products such as fresh dates, date syrup, paste, chopped dates, and confectionery, among many others.\n\nProducts are available in a wide variety of packages, shapes, and sizes upon request, meeting all customer needs. Each product is manufactured using the latest technologies under the supervision of qualified engineers and specialists in the field of date production.\n\nEmirates Delight for Dates — The world of dates in your hands.",
              ar: "من مدينة العين حيث مزارع التمور في الامارات ، تأسست طيبات الامارات للتمور قبل عشرون عاماً وتميزت بكونها الرائدة التي توفر معظم أجود أنواع التمور العالمية في مكان واحد ... لتضعة بين يديك منطلقه من ميزات الامارات التسويقية واللوجستية وتحقيق الجوده العالمية ، لتقدم منتجاتها من التمور من معظم أماكن زراعتها لجميع شرائح السوق ، محلياً واقليمياً وعالمياً\n\nإبتداءً من ( التمور الاماراتية ، السعودية ، العراقية ، التونسية ، الُعُمانية ، الأردنية ، الفلسطينية .. الخ )\n\nوتتميز عبوات التعبأة لطيبات الامارات أنها تتلائم جميع القنوات في السوق ( التجزئة ، الجملة ، التموين ، الهدايا، وجميع المناسبات ) .. بجميع أصناف التمور ومنتجاتها مثل ( الرطب ، الدبس، المعجون ، المقُطع ، وللحلويات) وغيرها الكثير )\n\nوتتوفر بعبوات وأشكال وأحجام حس ب الطلب وتتناسب مع الجميع والتي تصنع بأحدث الأجهزة وتحت إشراف كوادر هندسية متخصصة وكفاءات في مجال تصنيع التمور ..\n\nطيبات الامارات للتمور .. عالم التمور بين يديك",
            },
            backgroundType: "none",
          },
          mission: {
            title: {
              en: "Our Mission",
              ar: "الرسالة",
            },
            content: {
              en: "At Tayyibat Al Emarat Dates, our mission is to curate, craft, and deliver the world's finest dates and date-based creations with passion and purpose. We honor the timeless heritage of Arabian dates while embracing innovation, sustainability, and excellence at every stage from cultivation to global distribution. With integrity and dedication at our core, we strive to exceed expectations, build enduring partnerships, and share the natural luxury and wellness of dates with discerning customers across the world.",
              ar: "مهمتنا في مجموعة طيبات الامارات للتمور هي الحصول على أجود أنواع التمر ومنتجاته وإنتاجها وتوزيعها بشغف للعملاء حول العالم. نحن ملتزمون بالحفاظ على الإرث الغني بالتمور مع تبني الابتكار والاستدامة في جميع عملياتنا. من خلال توفير خدمة لا مثيل لها، والنزاهة، والسعي المستمر نحو التميز، نسعى لتجاوز توقعات العملاء، وتعزيز الشراكات طويلة الأمد، وإثراء الحياة بالفوائد الطبيعية للتمور .",
            },
            backgroundType: "none",
          },
          vision: {
            title: {
              en: "Our Vision",
              ar: "الرؤية",
            },
            content: {
              en: "To stand as the global symbol of excellence in the world of dates — renowned for exceptional quality, distinguished variety, and an unwavering commitment to perfection. We envision Tayyibat Al Emarat Dates Group as a name synonymous with purity, elegance, and wellbeing — where every date embodies our promise of heritage, innovation, and refined taste, enriching lives and delighting palates worldwide.",
              ar: "أن تكون طيبات الامارات للتمور الرائد العالمي في تجارة التمور، معروفين بجودتنا الفائقة، وتنوع عروضنا، والتزامنا الثابت بإرضاء العملاء. نتصور عالماً تكون فيه كل ثمرة تمر من مجموعة طيبات الامارات تجسيداً للتميز، تسعد المستهلكين حول العالم وتساهم في مجتمع أكثر صحة وسعادة .",
            },
            backgroundType: "none",
          },
        });
      }
      if (whyChooseData) {
        setWhyChooseSection(whyChooseData);
      } else {
        // Initialize with seed content
        setWhyChooseSection({
          title: {
            en: "Why Choose Emirates Delights",
            ar: "لماذا تختار طيبات الامارات للتمور",
          },
          points: [
            {
              title: {
                en: "1. A World of Dates at Your Fingertips",
                ar: "أولاً : تمور العالم بين يديك",
              },
              content: {
                en: "Indulge in a distinguished collection of the world's finest dates, carefully curated and delivered with exceptional quality.",
                ar: "جوده وفقاً لمواصفات ومقاييس دولة الامارات",
              },
            },
            {
              title: {
                en: "2. Certified Excellence — UAE Standards",
                ar: "ثانياً : جوده وفقاً لمواصفات ومقاييس دولة الامارات",
              },
              content: {
                en: "Every Emirates Delights product is crafted in full compliance with the UAE's rigorous quality standards, reflecting authenticity and superior taste.",
                ar: "",
              },
            },
            {
              title: {
                en: "3. Elegant Packaging for Every Market",
                ar: "ثالثاً : عبوات تلائم جميع القطاعات وقنوات السوق",
              },
              content: {
                en: "From luxury hospitality to global retail and wholesale, our packaging solutions are designed to meet the highest international expectations.",
                ar: "",
              },
            },
            {
              title: {
                en: "4. Exclusive Private Label Opportunities",
                ar: "رابعاً : إمكانيه التعبئة بعلامة خاصة",
              },
              content: {
                en: "Elevate your brand with our premium private-label packaging, tailored to reflect your unique identity while maintaining the Emirates Delights standard of excellence.",
                ar: "",
              },
            },
            {
              title: {
                en: "5. Duty-Free Access to Over 20 Countries",
                ar: "خامساً : الاعفاء الجمركي لأكثر من ٢٠ دوله بنسبة 0% بالمئة وتشمل",
              },
              content: {
                en: "Our products benefit from 0% customs duty in more than 20 countries — opening doors to effortless global expansion.\n\nCountries Included\n\nCEPA Agreements Currently in Force:\nIndia · Turkey · Indonesia · Cambodia · Georgia · Costa Rica · Mauritius · Jordan · Serbia\n\nCEPA Signed:\nColombia · South Korea · Chile · Vietnam · Australia · Eurasia EPA · Malaysia · Kenya · Ukraine · Central African Republic · Congo Brazzaville\n\nCEPA Concluded:\nMorocco · Armenia · Belarus · Azerbaijan · Philippines · Angola",
                ar: "",
              },
            },
            {
              title: {
                en: "6. Unmatched Quality and Exquisite Variety",
                ar: "سادساً : جودة ومواصفات لكل درجات التمور وجميع الاذواق",
              },
              content: {
                en: "We offer a refined selection of grades and flavors, crafted to satisfy even the most discerning palates.",
                ar: "",
              },
            },
            {
              title: {
                en: "7. Thoughtful Selections for Every Occasion",
                ar: "سابعاُ : توفير عبوات وأصناف لجميع المناسبات ( الضيافة / الهدايا /التبرعات)",
              },
              content: {
                en: "Whether for elegant hospitality, memorable gifting, or meaningful charitable giving, our dates are presented with sophistication and care.",
                ar: "",
              },
            },
            {
              title: {
                en: "8. End-to-End Farm & Farmer Services",
                ar: "ثامناُ : ⁠توفير خدمه المزارع والمزارعين ( غسيل/  تعقيم/  تعبئة)",
              },
              content: {
                en: "We proudly support local farms and farmers with professional washing, sterilization, and packaging — ensuring unparalleled freshness and quality from harvest to table.",
                ar: "",
              },
            },
          ],
        });
      }
      if (videoData) {
        setVideoSection(videoData);
      } else {
        // Initialize with empty content
        setVideoSection({
          title: {
            en: "",
            ar: "",
          },
          subtitle: {
            en: "",
            ar: "",
          },
          videoUrl: "",
        });
      }
      setAllProducts(productsData);
      if (trendingData) {
        setTrendingProductsSection(trendingData);
      } else {
        // Initialize with empty content
        setTrendingProductsSection({
          title: {
            en: "",
            ar: "",
          },
          subtitle: {
            en: "",
            ar: "",
          },
          productIds: [],
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAddSlide = () => {
    setEditingSlide({
      image: "",
      title: { en: "", ar: "" },
      subtitle: { en: "", ar: "" },
      action1: { title: { en: "", ar: "" }, link: "" },
      action2: { title: { en: "", ar: "" }, link: "" },
      order: slides.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleEditSlide = (slide: HeroSlide) => {
    setEditingSlide({ ...slide });
    setIsModalOpen(true);
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (confirm("Are you sure you want to delete this slide?")) {
      try {
        await deleteHeroSlide(slideId);
        await fetchData();
      } catch (error) {
        console.error("Error deleting slide:", error);
        alert("Failed to delete slide");
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSlide) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      setEditingSlide({ ...editingSlide, image: imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSlide = async () => {
    if (!editingSlide) return;

    try {
      await saveHeroSlide(editingSlide);
      setIsModalOpen(false);
      setEditingSlide(null);
      await fetchData();
    } catch (error) {
      console.error("Error saving slide:", error);
      alert("Failed to save slide");
    }
  };

  const handleBackgroundTypeChange = (section: "aboutUs" | "mission" | "vision", type: BackgroundType) => {
    if (!aboutSection) return;
    const newSection = { ...aboutSection };
    newSection[section].backgroundType = type;
    if (type !== "image") {
      newSection[section].backgroundImage = undefined;
    }
    if (type !== "video") {
      newSection[section].backgroundVideo = undefined;
    }
    setAboutSection(newSection);
  };

  const handleAboutImageUpload = async (section: "aboutUs" | "mission" | "vision", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !aboutSection) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, "about");
      const newSection = { ...aboutSection };
      newSection[section].backgroundImage = imageUrl;
      setAboutSection(newSection);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleAboutVideoUpload = async (section: "aboutUs" | "mission" | "vision", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !aboutSection) return;

    setUploading(true);
    try {
      const videoUrl = await uploadVideo(file);
      const newSection = { ...aboutSection };
      newSection[section].backgroundVideo = videoUrl;
      setAboutSection(newSection);
    } catch (error) {
      console.error("Error uploading video:", error);
      alert("Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveAbout = async () => {
    if (!aboutSection) return;

    setSavingAbout(true);
    try {
      await saveAboutSection(aboutSection);
      alert("About section saved successfully!");
    } catch (error) {
      console.error("Error saving about section:", error);
      alert("Failed to save about section");
    } finally {
      setSavingAbout(false);
    }
  };

  const updateAboutField = (section: "aboutUs" | "mission" | "vision", field: "title" | "content", lang: Language, value: string) => {
    if (!aboutSection) return;
    const newSection = { ...aboutSection };
    newSection[section][field][lang] = value;
    setAboutSection(newSection);
  };

  const handleSaveWhyChoose = async () => {
    if (!whyChooseSection) return;

    setSavingWhyChoose(true);
    try {
      await saveWhyChooseSection(whyChooseSection);
      alert("Why Choose section saved successfully!");
    } catch (error) {
      console.error("Error saving why choose section:", error);
      alert("Failed to save why choose section");
    } finally {
      setSavingWhyChoose(false);
    }
  };

  const updateWhyChooseTitle = (lang: Language, value: string) => {
    if (!whyChooseSection) return;
    const newSection = { ...whyChooseSection };
    newSection.title[lang] = value;
    setWhyChooseSection(newSection);
  };

  const updateWhyChoosePoint = (index: number, field: "title" | "content", lang: Language, value: string) => {
    if (!whyChooseSection) return;
    const newSection = { ...whyChooseSection };
    newSection.points[index][field][lang] = value;
    setWhyChooseSection(newSection);
  };

  const addWhyChoosePoint = () => {
    if (!whyChooseSection) return;
    const newSection = { ...whyChooseSection };
    newSection.points.push({
      title: { en: "", ar: "" },
      content: { en: "", ar: "" },
    });
    setWhyChooseSection(newSection);
  };

  const removeWhyChoosePoint = (index: number) => {
    if (!whyChooseSection) return;
    const newSection = { ...whyChooseSection };
    newSection.points.splice(index, 1);
    setWhyChooseSection(newSection);
  };

  const handleSaveVideo = async () => {
    if (!videoSection) return;

    setSavingVideo(true);
    try {
      await saveVideoSection(videoSection);
      alert("Video section saved successfully!");
    } catch (error) {
      console.error("Error saving video section:", error);
      alert("Failed to save video section");
    } finally {
      setSavingVideo(false);
    }
  };

  const updateVideoField = (field: "title" | "subtitle", lang: Language, value: string) => {
    if (!videoSection) return;
    const newSection = { ...videoSection };
    newSection[field][lang] = value;
    setVideoSection(newSection);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !videoSection) return;

    setUploading(true);
    try {
      const videoUrl = await uploadVideo(file);
      setVideoSection({ ...videoSection, videoUrl });
    } catch (error) {
      console.error("Error uploading video:", error);
      alert("Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveTrendingProducts = async () => {
    if (!trendingProductsSection) return;

    setSavingTrendingProducts(true);
    try {
      await saveTrendingProductsSection(trendingProductsSection);
      alert("Trending Products section saved successfully!");
    } catch (error) {
      console.error("Error saving trending products section:", error);
      alert("Failed to save trending products section");
    } finally {
      setSavingTrendingProducts(false);
    }
  };

  const updateTrendingProductsField = (field: "title" | "subtitle", lang: Language, value: string) => {
    if (!trendingProductsSection) return;
    const newSection = { ...trendingProductsSection };
    newSection[field][lang] = value;
    setTrendingProductsSection(newSection);
  };

  const toggleProductSelection = (productId: string) => {
    if (!trendingProductsSection) return;
    const newSection = { ...trendingProductsSection };
    const index = newSection.productIds.indexOf(productId);
    if (index > -1) {
      newSection.productIds.splice(index, 1);
    } else {
      newSection.productIds.push(productId);
    }
    setTrendingProductsSection(newSection);
  };

  const updateField = (
    field: string,
    lang: Language,
    value: string
  ) => {
    if (!editingSlide) return;
    const newSlide = { ...editingSlide };
    const keys = field.split(".");
    let target: any = newSlide;

    for (let i = 0; i < keys.length - 1; i++) {
      target = target[keys[i]];
    }

    target[keys[keys.length - 1]][lang] = value;
    setEditingSlide(newSlide);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-blue-100">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Home Content Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">Manage hero slides and about section</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("hero")}
                className={`px-4 py-2 font-medium transition-colors ${activeTab === "hero"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Hero Section
              </button>
              <button
                onClick={() => setActiveTab("video")}
                className={`px-4 py-2 font-medium transition-colors ${activeTab === "video"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Video Section
              </button>
              <button
                onClick={() => setActiveTab("about")}
                className={`px-4 py-2 font-medium transition-colors ${activeTab === "about"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                About Section
              </button>
              <button
                onClick={() => setActiveTab("whyChoose")}
                className={`px-4 py-2 font-medium transition-colors ${activeTab === "whyChoose"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Why Choose Us
              </button>
              <button
                onClick={() => setActiveTab("trendingProducts")}
                className={`px-4 py-2 font-medium transition-colors ${activeTab === "trendingProducts"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Trending Products
              </button>
            </div>
          </div>

          {/* Video Section Tab */}
          {activeTab === "video" && videoSection && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Language Tabs */}
              <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6">
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                  <button
                    onClick={() => setCurrentLang("en")}
                    className={`px-4 py-2 font-medium transition-colors ${currentLang === "en"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setCurrentLang("ar")}
                    className={`px-4 py-2 font-medium transition-colors ${currentLang === "ar"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    العربية (Arabic)
                  </button>
                </div>

                {/* Video Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video
                  </label>
                  {videoSection.videoUrl && (
                    <div className="mb-4">
                      <video
                        src={videoSection.videoUrl}
                        controls
                        className="w-full h-96 object-contain rounded-lg bg-black"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={uploading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                  />
                  {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                </div>

                {/* Title */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title ({currentLang === "en" ? "English" : "Arabic"})
                  </label>
                  <input
                    type="text"
                    value={videoSection.title[currentLang] || ""}
                    onChange={(e) => updateVideoField("title", currentLang, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Subtitle */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle ({currentLang === "en" ? "English" : "Arabic"})
                  </label>
                  <textarea
                    value={videoSection.subtitle[currentLang] || ""}
                    onChange={(e) => updateVideoField("subtitle", currentLang, e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveVideo}
                  disabled={savingVideo}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingVideo ? "Saving..." : "Save Video Section"}
                </button>
              </div>
            </div>
          )}

          {/* Hero Section Tab */}
          {activeTab === "hero" && (
            <>
              <div className="mb-6">
                <button
                  onClick={handleAddSlide}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Slide
                </button>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Loading slides...</p>
                </div>
              ) : slides.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl shadow-md border border-blue-100">
                  <p className="text-gray-600 mb-4">No slides found</p>
                  <button
                    onClick={handleAddSlide}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Add First Slide
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {slides.map((slide) => (
                    <div
                      key={slide.id}
                      className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden"
                    >
                      <div className="relative h-48 bg-gray-200">
                        {slide.image ? (
                          <img
                            src={slide.image}
                            alt={slide.title.en || slide.title.ar || "Slide"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {slide.title.en || slide.title.ar || "No title"}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {slide.subtitle.en || slide.subtitle.ar || "No subtitle"}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSlide(slide)}
                            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => slide.id && handleDeleteSlide(slide.id)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* About Section Tab */}
          {activeTab === "about" && aboutSection && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Language Tabs */}
              <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6">
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                  <button
                    onClick={() => setCurrentLang("en")}
                    className={`px-4 py-2 font-medium transition-colors ${currentLang === "en"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setCurrentLang("ar")}
                    className={`px-4 py-2 font-medium transition-colors ${currentLang === "ar"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    العربية (Arabic)
                  </button>
                </div>

                {/* About Us Section */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About Us</h3>

                    {/* Background Controls */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Type
                      </label>
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleBackgroundTypeChange("aboutUs", "none")}
                          className={`px-4 py-2 rounded-lg transition-colors ${aboutSection.aboutUs.backgroundType === "none"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                          None
                        </button>
                        <button
                          onClick={() => handleBackgroundTypeChange("aboutUs", "image")}
                          className={`px-4 py-2 rounded-lg transition-colors ${aboutSection.aboutUs.backgroundType === "image"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                          Image
                        </button>
                        <button
                          onClick={() => handleBackgroundTypeChange("aboutUs", "video")}
                          className={`px-4 py-2 rounded-lg transition-colors ${aboutSection.aboutUs.backgroundType === "video"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                          Video
                        </button>
                      </div>
                    </div>

                    {aboutSection.aboutUs.backgroundType === "image" && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Background Image
                        </label>
                        {aboutSection.aboutUs.backgroundImage && (
                          <img
                            src={aboutSection.aboutUs.backgroundImage}
                            alt="About Us background preview"
                            className="w-full h-48 object-cover rounded-lg mb-2"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAboutImageUpload("aboutUs", e)}
                          disabled={uploading}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                        />
                        {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                      </div>
                    )}

                    {aboutSection.aboutUs.backgroundType === "video" && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Background Video
                        </label>
                        {aboutSection.aboutUs.backgroundVideo && (
                          <video
                            src={aboutSection.aboutUs.backgroundVideo}
                            controls
                            className="w-full h-48 object-cover rounded-lg mb-2"
                          />
                        )}
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleAboutVideoUpload("aboutUs", e)}
                          disabled={uploading}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                        />
                        {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title ({currentLang === "en" ? "English" : "Arabic"})
                        </label>
                        <input
                          type="text"
                          value={aboutSection.aboutUs.title[currentLang] || ""}
                          onChange={(e) => updateAboutField("aboutUs", "title", currentLang, e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Content ({currentLang === "en" ? "English" : "Arabic"})
                        </label>
                        <textarea
                          value={aboutSection.aboutUs.content[currentLang] || ""}
                          onChange={(e) => updateAboutField("aboutUs", "content", currentLang, e.target.value)}
                          rows={8}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mission Section */}
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Mission</h3>

                    {/* Background Controls */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Type
                      </label>
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleBackgroundTypeChange("mission", "none")}
                          className={`px-4 py-2 rounded-lg transition-colors ${aboutSection.mission.backgroundType === "none"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                          None
                        </button>
                        <button
                          onClick={() => handleBackgroundTypeChange("mission", "image")}
                          className={`px-4 py-2 rounded-lg transition-colors ${aboutSection.mission.backgroundType === "image"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                          Image
                        </button>
                        <button
                          onClick={() => handleBackgroundTypeChange("mission", "video")}
                          className={`px-4 py-2 rounded-lg transition-colors ${aboutSection.mission.backgroundType === "video"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                          Video
                        </button>
                      </div>
                    </div>

                    {aboutSection.mission.backgroundType === "image" && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Background Image
                        </label>
                        {aboutSection.mission.backgroundImage && (
                          <img
                            src={aboutSection.mission.backgroundImage}
                            alt="Mission background preview"
                            className="w-full h-48 object-cover rounded-lg mb-2"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAboutImageUpload("mission", e)}
                          disabled={uploading}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                        />
                        {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                      </div>
                    )}

                    {aboutSection.mission.backgroundType === "video" && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Background Video
                        </label>
                        {aboutSection.mission.backgroundVideo && (
                          <video
                            src={aboutSection.mission.backgroundVideo}
                            controls
                            className="w-full h-48 object-cover rounded-lg mb-2"
                          />
                        )}
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleAboutVideoUpload("mission", e)}
                          disabled={uploading}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                        />
                        {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title ({currentLang === "en" ? "English" : "Arabic"})
                        </label>
                        <input
                          type="text"
                          value={aboutSection.mission.title[currentLang] || ""}
                          onChange={(e) => updateAboutField("mission", "title", currentLang, e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Content ({currentLang === "en" ? "English" : "Arabic"})
                        </label>
                        <textarea
                          value={aboutSection.mission.content[currentLang] || ""}
                          onChange={(e) => updateAboutField("mission", "content", currentLang, e.target.value)}
                          rows={6}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vision Section */}
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Vision</h3>

                    {/* Background Controls */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Type
                      </label>
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleBackgroundTypeChange("vision", "none")}
                          className={`px-4 py-2 rounded-lg transition-colors ${aboutSection.vision.backgroundType === "none"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                          None
                        </button>
                        <button
                          onClick={() => handleBackgroundTypeChange("vision", "image")}
                          className={`px-4 py-2 rounded-lg transition-colors ${aboutSection.vision.backgroundType === "image"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                          Image
                        </button>
                        <button
                          onClick={() => handleBackgroundTypeChange("vision", "video")}
                          className={`px-4 py-2 rounded-lg transition-colors ${aboutSection.vision.backgroundType === "video"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                          Video
                        </button>
                      </div>
                    </div>

                    {aboutSection.vision.backgroundType === "image" && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Background Image
                        </label>
                        {aboutSection.vision.backgroundImage && (
                          <img
                            src={aboutSection.vision.backgroundImage}
                            alt="Vision background preview"
                            className="w-full h-48 object-cover rounded-lg mb-2"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAboutImageUpload("vision", e)}
                          disabled={uploading}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                        />
                        {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                      </div>
                    )}

                    {aboutSection.vision.backgroundType === "video" && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Background Video
                        </label>
                        {aboutSection.vision.backgroundVideo && (
                          <video
                            src={aboutSection.vision.backgroundVideo}
                            controls
                            className="w-full h-48 object-cover rounded-lg mb-2"
                          />
                        )}
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleAboutVideoUpload("vision", e)}
                          disabled={uploading}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                        />
                        {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title ({currentLang === "en" ? "English" : "Arabic"})
                        </label>
                        <input
                          type="text"
                          value={aboutSection.vision.title[currentLang] || ""}
                          onChange={(e) => updateAboutField("vision", "title", currentLang, e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Content ({currentLang === "en" ? "English" : "Arabic"})
                        </label>
                        <textarea
                          value={aboutSection.vision.content[currentLang] || ""}
                          onChange={(e) => updateAboutField("vision", "content", currentLang, e.target.value)}
                          rows={6}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveAbout}
                  disabled={savingAbout}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingAbout ? "Saving..." : "Save About Section"}
                </button>
              </div>
            </div>
          )}

          {/* Why Choose Section Tab */}
          {activeTab === "whyChoose" && whyChooseSection && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Language Tabs */}
              <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6">
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                  <button
                    onClick={() => setCurrentLang("en")}
                    className={`px-4 py-2 font-medium transition-colors ${currentLang === "en"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setCurrentLang("ar")}
                    className={`px-4 py-2 font-medium transition-colors ${currentLang === "ar"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    العربية (Arabic)
                  </button>
                </div>

                {/* Section Title */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Title ({currentLang === "en" ? "English" : "Arabic"})
                  </label>
                  <input
                    type="text"
                    value={whyChooseSection.title[currentLang] || ""}
                    onChange={(e) => updateWhyChooseTitle(currentLang, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Points */}
                <div className="space-y-6">
                  {whyChooseSection.points.map((point, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Point {index + 1}
                        </h3>
                        <button
                          onClick={() => removeWhyChoosePoint(index)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title ({currentLang === "en" ? "English" : "Arabic"})
                          </label>
                          <input
                            type="text"
                            value={point.title[currentLang] || ""}
                            onChange={(e) => updateWhyChoosePoint(index, "title", currentLang, e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content ({currentLang === "en" ? "English" : "Arabic"})
                          </label>
                          <textarea
                            value={point.content[currentLang] || ""}
                            onChange={(e) => updateWhyChoosePoint(index, "content", currentLang, e.target.value)}
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Point Button */}
                <div className="mt-6">
                  <button
                    onClick={addWhyChoosePoint}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    + Add Point
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveWhyChoose}
                  disabled={savingWhyChoose}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingWhyChoose ? "Saving..." : "Save Why Choose Section"}
                </button>
              </div>
            </div>
          )}

          {/* Trending Products Section Tab */}
          {activeTab === "trendingProducts" && trendingProductsSection && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Language Tabs */}
              <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6">
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                  <button
                    onClick={() => setCurrentLang("en")}
                    className={`px-4 py-2 font-medium transition-colors ${currentLang === "en"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setCurrentLang("ar")}
                    className={`px-4 py-2 font-medium transition-colors ${currentLang === "ar"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    العربية (Arabic)
                  </button>
                </div>

                {/* Title */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title ({currentLang === "en" ? "English" : "Arabic"})
                  </label>
                  <input
                    type="text"
                    value={trendingProductsSection.title[currentLang] || ""}
                    onChange={(e) => updateTrendingProductsField("title", currentLang, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Subtitle */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle ({currentLang === "en" ? "English" : "Arabic"})
                  </label>
                  <textarea
                    value={trendingProductsSection.subtitle[currentLang] || ""}
                    onChange={(e) => updateTrendingProductsField("subtitle", currentLang, e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Products Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Select Trending Products ({trendingProductsSection.productIds.length} selected)
                  </label>
                  {allProducts.length === 0 ? (
                    <p className="text-sm text-gray-500">No products available. Please add products first.</p>
                  ) : (
                    <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                              Select
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                              Image
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {allProducts.map((product) => {
                            const isSelected = product.id && trendingProductsSection.productIds.includes(product.id);
                            return (
                              <tr
                                key={product.id}
                                className={`hover:bg-blue-50 transition-colors cursor-pointer ${isSelected ? "bg-blue-50" : ""}`}
                                onClick={() => product.id && toggleProductSelection(product.id)}
                              >
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={isSelected || false}
                                    onChange={() => product.id && toggleProductSelection(product.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  {product.mainImage ? (
                                    <img
                                      src={product.mainImage}
                                      alt={product.name.en || product.name.ar || "Product"}
                                      className="h-16 w-16 object-cover rounded-lg"
                                    />
                                  ) : (
                                    <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                      No Image
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {product.name.en || product.name.ar || "No name"}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm text-gray-500 line-clamp-2">
                                    {product.description.en || product.description.ar || "No description"}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveTrendingProducts}
                  disabled={savingTrendingProducts}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingTrendingProducts ? "Saving..." : "Save Trending Products Section"}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingSlide && (
        <SlideEditModal
          slide={editingSlide}
          currentLang={currentLang}
          onLangChange={setCurrentLang}
          onClose={() => {
            setIsModalOpen(false);
            setEditingSlide(null);
          }}
          onSave={handleSaveSlide}
          onUpdate={setEditingSlide}
          onImageUpload={handleImageUpload}
          uploading={uploading}
          updateField={updateField}
        />
      )}
    </div>
  );
}

interface SlideEditModalProps {
  slide: HeroSlide;
  currentLang: Language;
  onLangChange: (lang: Language) => void;
  onClose: () => void;
  onSave: () => void;
  onUpdate: (slide: HeroSlide) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  updateField: (field: string, lang: Language, value: string) => void;
}

function SlideEditModal({
  slide,
  currentLang,
  onLangChange,
  onClose,
  onSave,
  onUpdate,
  onImageUpload,
  uploading,
  updateField,
}: SlideEditModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full p-8 border border-blue-100 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Slide</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Language Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => onLangChange("en")}
              className={`px-4 py-2 font-medium transition-colors ${currentLang === "en"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              English
            </button>
            <button
              onClick={() => onLangChange("ar")}
              className={`px-4 py-2 font-medium transition-colors ${currentLang === "ar"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              العربية (Arabic)
            </button>
          </div>

          <div className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image *
              </label>
              {slide.image && (
                <img
                  src={slide.image}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg mb-2"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={onImageUpload}
                disabled={uploading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              />
              {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title ({currentLang === "en" ? "English" : "Arabic"}) *
              </label>
              <input
                type="text"
                value={slide.title[currentLang] || ""}
                onChange={(e) => updateField("title", currentLang, e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={currentLang === "en" ? "Enter title in English" : "أدخل العنوان بالعربية"}
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle ({currentLang === "en" ? "English" : "Arabic"}) *
              </label>
              <textarea
                value={slide.subtitle[currentLang] || ""}
                onChange={(e) => updateField("subtitle", currentLang, e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={currentLang === "en" ? "Enter subtitle in English" : "أدخل العنوان الفرعي بالعربية"}
              />
            </div>

            {/* Action 1 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action 1 Title ({currentLang === "en" ? "English" : "Arabic"}) *
                </label>
                <input
                  type="text"
                  value={slide.action1.title[currentLang] || ""}
                  onChange={(e) =>
                    updateField("action1.title", currentLang, e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={currentLang === "en" ? "e.g., Shop Now" : "مثال: تسوق الآن"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action 1 Link *
                </label>
                <input
                  type="url"
                  value={slide.action1.link || ""}
                  onChange={(e) => {
                    const newSlide = { ...slide };
                    newSlide.action1.link = e.target.value;
                    onUpdate(newSlide);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Action 2 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action 2 Title ({currentLang === "en" ? "English" : "Arabic"}) *
                </label>
                <input
                  type="text"
                  value={slide.action2.title[currentLang] || ""}
                  onChange={(e) =>
                    updateField("action2.title", currentLang, e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={currentLang === "en" ? "e.g., Learn More" : "مثال: اعرف المزيد"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action 2 Link *
                </label>
                <input
                  type="url"
                  value={slide.action2.link || ""}
                  onChange={(e) => {
                    const newSlide = { ...slide };
                    newSlide.action2.link = e.target.value;
                    onUpdate(newSlide);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={onSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Save Slide
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomeContent() {
  return (
    <ProtectedRoute>
      <HomeContentPage />
    </ProtectedRoute>
  );
}

