import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { Sidebar } from "~/components/Sidebar";
import { useAuth } from "~/contexts/AuthContext";
import { logout } from "~/lib/auth";
import {
  getGiftProducts,
  saveGiftProduct,
  deleteGiftProduct,
  uploadImage,
  seedGiftProducts,
  type GiftProduct,
  type Language,
} from "~/lib/content";
import type { Route } from "./+types/gift-products";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Gift Products - Emirates Delights Admin" },
    { name: "description", content: "Manage gift products" },
  ];
}

interface PillInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function PillInput({ value, onChange, placeholder }: PillInputProps) {
  const [inputValue, setInputValue] = useState("");

  const pills = value
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      const newPill = inputValue.trim();
      if (!pills.includes(newPill)) {
        const updatedPills = [...pills, newPill];
        onChange(updatedPills.join(", "));
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && pills.length > 0) {
      // Remove last pill when backspace is pressed on empty input
      const updatedPills = pills.slice(0, -1);
      onChange(updatedPills.join(", "));
    }
  };

  const handleRemovePill = (index: number) => {
    const updatedPills = pills.filter((_, i) => i !== index);
    onChange(updatedPills.join(", "));
  };

  return (
    <div className="w-full min-h-[48px] px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white flex flex-wrap gap-2 items-center">
      {pills.map((pill, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200"
        >
          {pill}
          <button
            type="button"
            onClick={() => handleRemovePill(index)}
            className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={pills.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
      />
    </div>
  );
}

function GiftProductsPage() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [giftProducts, setGiftProducts] = useState<GiftProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGiftProduct, setEditingGiftProduct] = useState<GiftProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>("en");

  useEffect(() => {
    fetchGiftProducts();
  }, []);

  const fetchGiftProducts = async () => {
    try {
      let data = await getGiftProducts();
      // Seed gift products with packageSize and grade if needed
      if (data.length > 0) {
        const needsSeeding = data.some(p => !p.packageSize || !p.grade);
        if (needsSeeding) {
          await seedGiftProducts();
          data = await getGiftProducts();
        }
      }
      setGiftProducts(data);
    } catch (error) {
      console.error("Error fetching gift products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAddGiftProduct = () => {
    setEditingGiftProduct({
      name: { en: "", ar: "" },
      image: "",
      packageSize: "",
      grade: "",
    });
    setIsModalOpen(true);
  };

  const handleEditGiftProduct = (giftProduct: GiftProduct) => {
    setEditingGiftProduct({ ...giftProduct });
    setIsModalOpen(true);
  };

  const handleDeleteGiftProduct = async (giftProductId: string) => {
    if (confirm("Are you sure you want to delete this gift product?")) {
      try {
        await deleteGiftProduct(giftProductId);
        await fetchGiftProducts();
      } catch (error) {
        console.error("Error deleting gift product:", error);
        alert("Failed to delete gift product");
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingGiftProduct) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, "gift-products");
      setEditingGiftProduct({ ...editingGiftProduct, image: imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveGiftProduct = async () => {
    if (!editingGiftProduct) return;

    if (!editingGiftProduct.name.en && !editingGiftProduct.name.ar) {
      alert("Please enter a name in at least one language");
      return;
    }

    if (!editingGiftProduct.image) {
      alert("Please upload an image");
      return;
    }

    try {
      await saveGiftProduct(editingGiftProduct);
      setIsModalOpen(false);
      setEditingGiftProduct(null);
      await fetchGiftProducts();
    } catch (error) {
      console.error("Error saving gift product:", error);
      alert("Failed to save gift product");
    }
  };

  const updateField = (field: string, lang: Language, value: string) => {
    if (!editingGiftProduct) return;
    const newGiftProduct = { ...editingGiftProduct };
    const keys = field.split(".");
    let target: any = newGiftProduct;

    for (let i = 0; i < keys.length - 1; i++) {
      target = target[keys[i]];
    }

    target[keys[keys.length - 1]][lang] = value;
    setEditingGiftProduct(newGiftProduct);
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
                  Gift Products Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your gift products catalog
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddGiftProduct}
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
                  Add Gift Product
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading gift products...</p>
            </div>
          ) : giftProducts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl shadow-md border border-blue-100">
              <p className="text-gray-600 mb-4">No gift products found</p>
              <button
                onClick={handleAddGiftProduct}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Add First Gift Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {giftProducts.map((giftProduct) => (
                <div
                  key={giftProduct.id}
                  className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden hover:shadow-xl transition-shadow duration-200"
                >
                  <div className="aspect-square w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    {giftProduct.image ? (
                      <img
                        src={giftProduct.image}
                        alt={giftProduct.name.en || giftProduct.name.ar || "Gift Product"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {giftProduct.name.en || giftProduct.name.ar || "No name"}
                    </h3>
                    {(giftProduct.name.en && giftProduct.name.ar) && (
                      <p className="text-sm text-gray-600 mb-2">
                        {giftProduct.name.en !== giftProduct.name.ar ? giftProduct.name.ar : ""}
                      </p>
                    )}
                    {/* Package Size and Grade */}
                    {(giftProduct.packageSize || giftProduct.grade) && (
                      <div className="mb-3 space-y-2">
                        {giftProduct.packageSize && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Package Size:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {giftProduct.packageSize.split(",").map((size, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                >
                                  {size.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {giftProduct.grade && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Grade:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {giftProduct.grade.split(",").map((grade, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                                >
                                  {grade.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => giftProduct.id && handleEditGiftProduct(giftProduct)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => giftProduct.id && handleDeleteGiftProduct(giftProduct.id)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
      {isModalOpen && editingGiftProduct && (
        <GiftProductEditModal
          giftProduct={editingGiftProduct}
          currentLang={currentLang}
          onLangChange={setCurrentLang}
          onClose={() => {
            setIsModalOpen(false);
            setEditingGiftProduct(null);
          }}
          onSave={handleSaveGiftProduct}
          onUpdate={setEditingGiftProduct}
          onImageUpload={handleImageUpload}
          uploading={uploading}
          updateField={updateField}
        />
      )}
    </div>
  );
}

interface GiftProductEditModalProps {
  giftProduct: GiftProduct;
  currentLang: Language;
  onLangChange: (lang: Language) => void;
  onClose: () => void;
  onSave: () => void;
  onUpdate: (giftProduct: GiftProduct) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  updateField: (field: string, lang: Language, value: string) => void;
}

function GiftProductEditModal({
  giftProduct,
  currentLang,
  onLangChange,
  onClose,
  onSave,
  onUpdate,
  onImageUpload,
  uploading,
  updateField,
}: GiftProductEditModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 border border-blue-100 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {giftProduct.id ? "Edit Gift Product" : "Add Gift Product"}
            </h2>
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
            {/* Gift Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name ({currentLang === "en" ? "English" : "Arabic"}) *
              </label>
              <input
                type="text"
                value={giftProduct.name[currentLang] || ""}
                onChange={(e) => updateField("name", currentLang, e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={currentLang === "en" ? "Enter gift product name" : "أدخل اسم منتج الهدية"}
              />
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image *
              </label>
              {giftProduct.image && (
                <img
                  src={giftProduct.image}
                  alt="Gift product preview"
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

            {/* Package Size and Grade */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Package Size (Optional)
                </label>
                <PillInput
                  value={giftProduct.packageSize || ""}
                  onChange={(value) => {
                    const newGiftProduct = { ...giftProduct };
                    newGiftProduct.packageSize = value;
                    onUpdate(newGiftProduct);
                  }}
                  placeholder="e.g., 1kg, 2kg, 3kg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade (Optional)
                </label>
                <PillInput
                  value={giftProduct.grade || ""}
                  onChange={(value) => {
                    const newGiftProduct = { ...giftProduct };
                    newGiftProduct.grade = value;
                    onUpdate(newGiftProduct);
                  }}
                  placeholder="e.g., Grade 1, Grade 2"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={onSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Save Gift Product
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

export default function GiftProducts() {
  return (
    <ProtectedRoute>
      <GiftProductsPage />
    </ProtectedRoute>
  );
}

