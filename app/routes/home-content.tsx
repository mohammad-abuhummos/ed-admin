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
  type HeroSlide,
  type Language,
} from "~/lib/content";
import type { Route } from "./+types/home-content";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home Content - Emirates Delights Admin" },
    { name: "description", content: "Manage home page content" },
  ];
}

function HomeContentPage() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>("en");

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const data = await getHeroSlides();
      setSlides(data);
    } catch (error) {
      console.error("Error fetching slides:", error);
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
        await fetchSlides();
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
      await fetchSlides();
    } catch (error) {
      console.error("Error saving slide:", error);
      alert("Failed to save slide");
    }
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
                <p className="text-sm text-gray-600 mt-1">Hero Section - Slideshow</p>
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
              className={`px-4 py-2 font-medium transition-colors ${
                currentLang === "en"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              English
            </button>
            <button
              onClick={() => onLangChange("ar")}
              className={`px-4 py-2 font-medium transition-colors ${
                currentLang === "ar"
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

