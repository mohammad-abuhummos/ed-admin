import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useNavigate } from "react-router";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { Sidebar } from "~/components/Sidebar";
import { useAuth } from "~/contexts/AuthContext";
import { logout } from "~/lib/auth";
import {
  deleteProductCategory,
  getProductCategories,
  saveProductCategory,
  seedProductCategories,
  type Language,
  type ProductCategory,
} from "~/lib/content";
import type { Route } from "./+types/product-categories";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Product Categories - Emirates Delights Admin" },
    { name: "description", content: "Manage product categories" },
  ];
}

const slugifyValue = (value: string) =>
  value
    .toString()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

const categoryIcons: Record<string, ReactElement> = {
  "medjool-dates": (
    <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" fill="#8B4513" opacity="0.2" />
      <ellipse cx="32" cy="28" rx="14" ry="18" fill="#654321" />
      <ellipse cx="32" cy="28" rx="10" ry="14" fill="#8B4513" />
      <path d="M32 10 Q28 20 32 28 Q36 20 32 10" fill="#A0522D" />
    </svg>
  ),
  "date-paste": (
    <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none">
      <rect x="16" y="20" width="32" height="28" rx="4" fill="#D2691E" opacity="0.3" />
      <path d="M20 32 Q32 28 44 32 Q44 38 32 42 Q20 38 20 32" fill="#8B4513" />
      <ellipse cx="32" cy="30" rx="12" ry="4" fill="#A0522D" />
    </svg>
  ),
  "rutab-dates": (
    <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="34" r="16" fill="#CD853F" opacity="0.3" />
      <ellipse cx="32" cy="32" rx="12" ry="16" fill="#DAA520" />
      <ellipse cx="32" cy="30" rx="8" ry="12" fill="#F4A460" />
      <circle cx="28" cy="28" r="2" fill="#FFF" opacity="0.6" />
    </svg>
  ),
  "holy-land-dates": (
    <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="20" fill="#DEB887" opacity="0.2" />
      <path d="M32 16 L28 28 L16 28 L26 36 L22 48 L32 40 L42 48 L38 36 L48 28 L36 28 Z" fill="#D2691E" />
      <circle cx="32" cy="32" r="6" fill="#8B4513" />
    </svg>
  ),
  "vacuumed-dates": (
    <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none">
      <rect x="18" y="18" width="28" height="28" rx="2" fill="#E8E8E8" opacity="0.4" />
      <rect x="22" y="22" width="20" height="20" rx="2" fill="#8B4513" />
      <path d="M26 26 L38 26 L38 38 L26 38 Z" fill="#A0522D" opacity="0.7" />
      <line x1="22" y1="28" x2="42" y2="28" stroke="#666" strokeWidth="0.5" opacity="0.3" />
    </svg>
  ),
  "dates-syrup": (
    <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none">
      <path d="M32 16 L28 48 L36 48 Z" fill="#8B4513" opacity="0.3" />
      <ellipse cx="32" cy="48" rx="14" ry="6" fill="#654321" />
      <path d="M28 20 Q32 30 32 40 Q32 30 36 20" fill="#A0522D" />
      <circle cx="30" cy="35" r="2" fill="#D2691E" opacity="0.6" />
    </svg>
  ),
  "dates-with-chocolate": (
    <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="32" rx="16" ry="20" fill="#3E2723" />
      <ellipse cx="32" cy="28" rx="12" ry="16" fill="#5D4037" />
      <path d="M26 22 Q32 26 38 22" stroke="#8D6E63" strokeWidth="2" fill="none" />
      <circle cx="28" cy="28" r="1.5" fill="#A0522D" />
    </svg>
  ),
  "dates-with-nuts": (
    <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="32" rx="16" ry="20" fill="#8B4513" opacity="0.3" />
      <ellipse cx="32" cy="30" rx="12" ry="16" fill="#A0522D" />
      <ellipse cx="32" cy="32" rx="6" ry="8" fill="#DEB887" />
      <path d="M28 28 L30 32 L26 30 Z" fill="#CD853F" />
    </svg>
  ),
  "dates-with-fruit": (
    <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none">
      <circle cx="28" cy="32" r="12" fill="#8B4513" opacity="0.3" />
      <circle cx="38" cy="30" r="10" fill="#FF6347" opacity="0.4" />
      <ellipse cx="28" cy="32" rx="8" ry="12" fill="#A0522D" />
      <circle cx="38" cy="30" r="6" fill="#FF7F50" />
    </svg>
  ),
  "aqsa-dates": (
    <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="22" fill="#DAA520" opacity="0.2" />
      <path d="M32 16 Q28 24 32 32 Q36 24 32 16" fill="#B8860B" />
      <ellipse cx="32" cy="36" rx="14" ry="16" fill="#CD853F" />
      <ellipse cx="32" cy="36" rx="10" ry="12" fill="#DAA520" />
      <circle cx="32" cy="32" r="3" fill="#FFF" opacity="0.5" />
    </svg>
  ),
};

const iconOptions = Object.entries(categoryIcons).map(([key, icon]) => ({
  key,
  icon,
}));

function ProductCategoriesPage() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>("en");
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      let data = await getProductCategories();
      if (data.length === 0) {
        await seedProductCategories();
        data = await getProductCategories();
      }
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAddCategory = () => {
    setEditingCategory({
      name: { en: "", ar: "" },
      description: { en: "", ar: "" },
      slug: "",
      href: "/products",
      iconKey: iconOptions[0]?.key || "medjool-dates",
      order: categories.length + 1,
    });
    setCurrentLang("en");
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: ProductCategory) => {
    setEditingCategory({ ...category });
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (categoryId?: string) => {
    if (!categoryId) return;
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await deleteProductCategory(categoryId);
      await fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
    }
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    setSaving(true);
    try {
      await saveProductCategory(editingCategory);
      setIsModalOpen(false);
      setEditingCategory(null);
      await fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const updateLocalizedField = (
    field: "name" | "description",
    lang: Language,
    value: string
  ) => {
    if (!editingCategory) return;
    const updated = { ...editingCategory };
    updated[field] = {
      ...updated[field],
      [lang]: value,
    };
    if (field === "name" && lang === "en" && (!updated.slug || updated.slug.length === 0)) {
      updated.slug = slugifyValue(value);
    }
    setEditingCategory(updated);
  };

  const updateCategoryField = (field: keyof ProductCategory, value: any) => {
    if (!editingCategory) return;
    setEditingCategory({ ...editingCategory, [field]: value });
  };

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [categories]
  );

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
                  Product Categories
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Create, edit, and organize product categories.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Category
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
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="mt-4 text-gray-600">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl shadow-md border border-blue-100">
              <p className="text-gray-600 mb-4">No categories found</p>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Create First Category
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Icon
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedCategories.map((category) => (
                      <tr key={category.id} className="hover:bg-blue-50 transition-all duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-16 w-16 rounded-xl bg-amber-50 flex items-center justify-center shadow-inner border border-amber-100">
                            {category.iconKey && categoryIcons[category.iconKey]
                              ? categoryIcons[category.iconKey]
                              : categoryIcons["medjool-dates"]}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {category.name.en || category.name.ar || "Unnamed"}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Slug: <span className="font-mono">{category.slug}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 line-clamp-2 max-w-sm">
                            {category.description.en || category.description.ar || "—"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200">
                            {category.order ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {isModalOpen && editingCategory && (
        <CategoryModal
          category={editingCategory}
          currentLang={currentLang}
          onLangChange={setCurrentLang}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
          onSave={handleSaveCategory}
          onUpdate={setEditingCategory}
          onLocalizedChange={updateLocalizedField}
          updateField={updateCategoryField}
          saving={saving}
        />
      )}
    </div>
  );
}

interface CategoryModalProps {
  category: ProductCategory;
  currentLang: Language;
  onLangChange: (lang: Language) => void;
  onClose: () => void;
  onSave: () => void;
  onUpdate: (category: ProductCategory) => void;
  onLocalizedChange: (field: "name" | "description", lang: Language, value: string) => void;
  updateField: (field: keyof ProductCategory, value: any) => void;
  saving: boolean;
}

function CategoryModal({
  category,
  currentLang,
  onLangChange,
  onClose,
  onSave,
  onUpdate,
  onLocalizedChange,
  updateField,
  saving,
}: CategoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full p-8 border border-blue-100 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {category.id ? "Edit Category" : "Add Category"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => onLangChange("en")}
              className={`px-4 py-2 font-medium transition-colors ${currentLang === "en"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              English
            </button>
            <button
              onClick={() => onLangChange("ar")}
              className={`px-4 py-2 font-medium transition-colors ${currentLang === "ar"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              العربية (Arabic)
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name ({currentLang === "en" ? "English" : "Arabic"}) *
              </label>
              <input
                type="text"
                value={category.name[currentLang] || ""}
                onChange={(e) => onLocalizedChange("name", currentLang, e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={currentLang === "en" ? "Enter category name" : "أدخل اسم الفئة"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description ({currentLang === "en" ? "English" : "Arabic"})
              </label>
              <textarea
                value={category.description[currentLang] || ""}
                onChange={(e) => onLocalizedChange("description", currentLang, e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={currentLang === "en" ? "Short description" : "وصف قصير"}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={category.slug || ""}
                  onChange={(e) => updateField("slug", slugifyValue(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="e.g. medjool-dates"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used in public URLs. Auto-formatted as you type.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Target
                </label>
                <input
                  type="text"
                  value={category.href || ""}
                  onChange={(e) => updateField("href", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="/products"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Icon Style
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {iconOptions.map(({ key, icon }) => {
                  const active = category.iconKey === key;
                  const label = key.replace(/-/g, " ");
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateField("iconKey", key)}
                      className={`p-3 rounded-xl border transition-all ${active
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-16 w-16 flex items-center justify-center rounded-lg bg-white">{icon}</div>
                        <span className="text-xs font-medium capitalize text-center">
                          {label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order
              </label>
              <input
                type="number"
                min={1}
                value={category.order ?? 1}
                onChange={(e) => updateField("order", Number(e.target.value) || 1)}
                className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={onSave}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Category"}
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

export default function ProductCategories() {
  return (
    <ProtectedRoute>
      <ProductCategoriesPage />
    </ProtectedRoute>
  );
}
