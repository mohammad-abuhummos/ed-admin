import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { Sidebar } from "~/components/Sidebar";
import { useAuth } from "~/contexts/AuthContext";
import { logout } from "~/lib/auth";
import {
  getProducts,
  saveProduct,
  deleteProduct,
  uploadImage,
  seedProducts,
  type Product,
  type Language,
} from "~/lib/content";
import type { Route } from "./+types/products";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Products - Emirates Delights Admin" },
    { name: "description", content: "Manage products" },
  ];
}

function ProductsPage() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>("en");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAddProduct = () => {
    setEditingProduct({
      name: { en: "", ar: "" },
      description: { en: "", ar: "" },
      mainImage: "",
      images: [],
      packageSize: "",
      grade: "",
    });
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct({ ...product });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(productId);
        await fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product");
      }
    }
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, "products");
      setEditingProduct({ ...editingProduct, mainImage: imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingProduct) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) =>
        uploadImage(file, "products")
      );
      const imageUrls = await Promise.all(uploadPromises);
      setEditingProduct({
        ...editingProduct,
        images: [...(editingProduct.images || []), ...imageUrls],
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    if (!editingProduct) return;
    const newImages = [...(editingProduct.images || [])];
    newImages.splice(index, 1);
    setEditingProduct({ ...editingProduct, images: newImages });
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;

    try {
      await saveProduct(editingProduct);
      setIsModalOpen(false);
      setEditingProduct(null);
      await fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product");
    }
  };

  const updateField = (field: string, lang: Language, value: string) => {
    if (!editingProduct) return;
    const newProduct = { ...editingProduct };
    const keys = field.split(".");
    let target: any = newProduct;

    for (let i = 0; i < keys.length - 1; i++) {
      target = target[keys[i]];
    }

    target[keys[keys.length - 1]][lang] = value;
    setEditingProduct(newProduct);
  };

  const handleSeedProducts = async () => {
    if (confirm("This will add 10 seed products to the database. Continue?")) {
      try {
        setLoading(true);
        await seedProducts();
        await fetchProducts();
        alert("Products seeded successfully!");
      } catch (error) {
        console.error("Error seeding products:", error);
        alert("Failed to seed products");
      } finally {
        setLoading(false);
      }
    }
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
                  Products Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your product catalog
                </p>
              </div>
              <div className="flex gap-3">
                {/* <button
                  onClick={handleSeedProducts}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Seed Products
                </button> */}
                <button
                  onClick={handleAddProduct}
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
                  Add Product
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
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl shadow-md border border-blue-100">
              <p className="text-gray-600 mb-4">No products found</p>
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Add First Product
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Image
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Package Size
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Images
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => {
                      // Parse package sizes and grades into arrays
                      const packageSizes = product.packageSize
                        ? product.packageSize.split(",").map((s) => s.trim()).filter(Boolean)
                        : [];
                      const grades = product.grade
                        ? product.grade.split(",").map((g) => g.trim()).filter(Boolean)
                        : [];

                      return (
                        <tr key={product.id} className="hover:bg-blue-50 transition-all duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.mainImage ? (
                              <div className="h-20 w-20 rounded-xl overflow-hidden shadow-md ring-2 ring-blue-100">
                                <img
                                  src={product.mainImage}
                                  alt={product.name.en || product.name.ar || "Product"}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs shadow-md">
                                No Image
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900 mb-1">
                              {product.name.en || product.name.ar || "No name"}
                            </div>
                            <div className="text-xs text-gray-500 line-clamp-2 max-w-xs">
                              {product.description.en || product.description.ar || "No description"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {packageSizes.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-w-xs">
                                {packageSizes.map((size, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                  >
                                    {size}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {grades.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-w-xs">
                                {grades.map((grade, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                                  >
                                    {grade}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {(product.images || []).length}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => product.id && handleDeleteProduct(product.id)}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingProduct && (
        <ProductEditModal
          product={editingProduct}
          currentLang={currentLang}
          onLangChange={setCurrentLang}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          onUpdate={setEditingProduct}
          onMainImageUpload={handleMainImageUpload}
          onImagesUpload={handleImagesUpload}
          onRemoveImage={handleRemoveImage}
          uploading={uploading}
          updateField={updateField}
        />
      )}
    </div>
  );
}

interface ProductEditModalProps {
  product: Product;
  currentLang: Language;
  onLangChange: (lang: Language) => void;
  onClose: () => void;
  onSave: () => void;
  onUpdate: (product: Product) => void;
  onMainImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImagesUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  uploading: boolean;
  updateField: (field: string, lang: Language, value: string) => void;
}

function ProductEditModal({
  product,
  currentLang,
  onLangChange,
  onClose,
  onSave,
  onUpdate,
  onMainImageUpload,
  onImagesUpload,
  onRemoveImage,
  uploading,
  updateField,
}: ProductEditModalProps) {
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
            <h2 className="text-2xl font-bold text-gray-900">
              {product.id ? "Edit Product" : "Add Product"}
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
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name ({currentLang === "en" ? "English" : "Arabic"}) *
              </label>
              <input
                type="text"
                value={product.name[currentLang] || ""}
                onChange={(e) => updateField("name", currentLang, e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={currentLang === "en" ? "Enter product name" : "أدخل اسم المنتج"}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description ({currentLang === "en" ? "English" : "Arabic"}) *
              </label>
              <textarea
                value={product.description[currentLang] || ""}
                onChange={(e) => updateField("description", currentLang, e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={currentLang === "en" ? "Enter product description" : "أدخل وصف المنتج"}
              />
            </div>

            {/* Main Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Image *
              </label>
              {product.mainImage && (
                <img
                  src={product.mainImage}
                  alt="Main preview"
                  className="w-full h-64 object-cover rounded-lg mb-2"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={onMainImageUpload}
                disabled={uploading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              />
              {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
            </div>

            {/* Additional Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onImagesUpload}
                disabled={uploading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 mb-2"
              />
              {uploading && <p className="text-sm text-gray-500 mb-2">Uploading...</p>}

              {/* Display uploaded images */}
              {(product.images || []).length > 0 && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {(product.images || []).map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => onRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Package Size and Grade */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Package Size (Optional)
                </label>
                <input
                  type="text"
                  value={product.packageSize || ""}
                  onChange={(e) => {
                    const newProduct = { ...product };
                    newProduct.packageSize = e.target.value;
                    onUpdate(newProduct);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 500g, 1kg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade (Optional)
                </label>
                <input
                  type="text"
                  value={product.grade || ""}
                  onChange={(e) => {
                    const newProduct = { ...product };
                    newProduct.grade = e.target.value;
                    onUpdate(newProduct);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Premium, Standard"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={onSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Save Product
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

export default function Products() {
  return (
    <ProtectedRoute>
      <ProductsPage />
    </ProtectedRoute>
  );
}

