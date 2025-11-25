import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { Sidebar } from "~/components/Sidebar";
import { RichTextEditor } from "~/components/RichTextEditor";
import { logout } from "~/lib/auth";
import {
  deleteNews,
  getNews,
  saveNews,
  uploadImage,
  type NewsArticle,
} from "~/lib/content";
import type { Route } from "./+types/news";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "News - Emirates Delights Admin" },
    { name: "description", content: "Manage news articles" },
  ];
}

const getDateFromValue = (value?: unknown): Date | null => {
  if (!value) return null;

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed);
    }
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "object") {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybeTimestamp?.toDate === "function") {
      return maybeTimestamp.toDate();
    }
    if (typeof maybeTimestamp?.seconds === "number") {
      return new Date(maybeTimestamp.seconds * 1000);
    }
  }

  return null;
};

const toDisplayDate = (value?: unknown) => {
  const date = getDateFromValue(value);
  if (!date) return "No date";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const toInputDate = (value?: unknown) => {
  const date = getDateFromValue(value);
  if (!date) return "";
  return date.toISOString().split("T")[0];
};

const getPlainText = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function NewsPage() {
  const navigate = useNavigate();
  const [newsItems, setNewsItems] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const data = await getNews();
      setNewsItems(data);
    } catch (error) {
      console.error("Error fetching news:", error);
      alert("Failed to load news articles");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAddArticle = () => {
    const today = new Date();
    setEditingArticle({
      title: "",
      description: "",
      contentHtml: "",
      coverImage: "",
      gallery: [],
      publishDate: today.toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const handleEditArticle = (article: NewsArticle) => {
    setEditingArticle({
      ...article,
      gallery: article.gallery || [],
      publishDate: typeof article.publishDate === "string" && article.publishDate.includes("-")
        ? article.publishDate
        : toInputDate(article.publishDate || article.createdAt),
    });
    setIsModalOpen(true);
  };

  const handleDeleteArticle = async (articleId?: string) => {
    if (!articleId) return;
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      await deleteNews(articleId);
      await fetchNews();
      alert("Article deleted successfully");
    } catch (error) {
      console.error("Error deleting article:", error);
      alert("Failed to delete article");
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingArticle) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, "news/cover");
      setEditingArticle({ ...editingArticle, coverImage: imageUrl });
    } catch (error) {
      console.error("Error uploading cover image:", error);
      alert("Failed to upload cover image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingArticle) return;

    setUploading(true);
    try {
      const uploads = Array.from(files).map((file) => uploadImage(file, "news/gallery"));
      const imageUrls = await Promise.all(uploads);
      setEditingArticle({
        ...editingArticle,
        gallery: [...(editingArticle.gallery || []), ...imageUrls],
      });
    } catch (error) {
      console.error("Error uploading gallery images:", error);
      alert("Failed to upload gallery images");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    if (!editingArticle) return;
    const updatedGallery = [...(editingArticle.gallery || [])];
    updatedGallery.splice(index, 1);
    setEditingArticle({ ...editingArticle, gallery: updatedGallery });
  };

  const handleSaveArticle = async () => {
    if (!editingArticle) return;

    if (!editingArticle.title.trim()) {
      alert("Title is required");
      return;
    }

    if (!editingArticle.description.trim()) {
      alert("Description is required");
      return;
    }

    if (!editingArticle.contentHtml || getPlainText(editingArticle.contentHtml).length === 0) {
      alert("Please add the article content");
      return;
    }

    if (!editingArticle.coverImage) {
      alert("Cover image is required");
      return;
    }

    try {
      await saveNews(editingArticle);
      setIsModalOpen(false);
      setEditingArticle(null);
      await fetchNews();
      alert("Article saved successfully");
    } catch (error) {
      console.error("Error saving article:", error);
      alert("Failed to save article");
    }
  };

  const newsStats = useMemo(() => {
    const totalImages = newsItems.reduce((sum, article) => sum + (article.gallery?.length || 0), 0);
    return {
      totalArticles: newsItems.length,
      totalGalleryImages: totalImages,
    };
  }, [newsItems]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-blue-100">
          <div className="px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">News Management</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Create and update news articles for the Emirates Delights website
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAddArticle}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Article
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm text-blue-600 font-semibold">Total Articles</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{newsStats.totalArticles}</p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-sm text-green-600 font-semibold">Gallery Images</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{newsStats.totalGalleryImages}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="mt-4 text-gray-600">Loading news articles...</p>
            </div>
          ) : newsItems.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl shadow-md border border-blue-100">
              <p className="text-gray-600 mb-4">No news articles found.</p>
              <button
                onClick={handleAddArticle}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Create First Article
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {newsItems.map((article) => {
                const preview = getPlainText(article.contentHtml || "");
                const previewText = preview.length > 180 ? `${preview.slice(0, 180)}…` : preview;
                return (
                  <article
                    key={article.id}
                    className="bg-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden"
                  >
                    {article.coverImage && (
                      <div className="relative h-64 w-full">
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute top-4 left-4 bg-white/90 text-sm font-medium text-gray-800 px-3 py-1 rounded-full shadow">
                          {toDisplayDate(article.publishDate || article.createdAt)}
                        </span>
                      </div>
                    )}
                    <div className="p-6 space-y-4">
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900">{article.title}</h2>
                        <p className="text-gray-600 mt-1">{article.description}</p>
                      </div>
                      {previewText && (
                        <p className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-xl p-4">
                          {previewText}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-600">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {(article.gallery || []).length} gallery image{(article.gallery || []).length === 1 ? "" : "s"}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditArticle(article)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteArticle(article.id)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {isModalOpen && editingArticle && (
        <NewsEditModal
          article={editingArticle}
          uploading={uploading}
          onCoverUpload={handleCoverUpload}
          onGalleryUpload={handleGalleryUpload}
          onRemoveGalleryImage={handleRemoveGalleryImage}
          onClose={() => {
            setIsModalOpen(false);
            setEditingArticle(null);
          }}
          onSave={handleSaveArticle}
          onUpdate={(updatedArticle) => setEditingArticle(updatedArticle)}
        />
      )}
    </div>
  );
}

interface NewsEditModalProps {
  article: NewsArticle;
  uploading: boolean;
  onCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGalleryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveGalleryImage: (index: number) => void;
  onClose: () => void;
  onSave: () => void;
  onUpdate: (article: NewsArticle) => void;
}

function NewsEditModal({
  article,
  uploading,
  onCoverUpload,
  onGalleryUpload,
  onRemoveGalleryImage,
  onClose,
  onSave,
  onUpdate,
}: NewsEditModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4" onClick={onClose}>
        <div
          className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full p-8 border border-blue-100 max-h-[95vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {article.id ? "Edit Article" : "Add Article"}
            </h2>
            <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={article.title}
                onChange={(e) => onUpdate({ ...article, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter article title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Short Description *</label>
              <textarea
                rows={3}
                value={article.description}
                onChange={(e) => onUpdate({ ...article, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter a concise summary for the article"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Publish Date</label>
                <input
                  type="date"
                  value={article.publishDate || ""}
                  onChange={(e) => onUpdate({ ...article, publishDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onCoverUpload}
                  disabled={uploading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                />
                {uploading && <p className="text-xs text-gray-500 mt-1">Uploading image...</p>}
              </div>
            </div>

            {article.coverImage && (
              <img
                src={article.coverImage}
                alt="Cover preview"
                className="w-full h-64 object-cover rounded-xl border border-gray-100"
              />
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onGalleryUpload}
                disabled={uploading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              />
              {uploading && <p className="text-xs text-gray-500 mt-1">Uploading images...</p>}
              {(article.gallery || []).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {(article.gallery || []).map((image, index) => (
                    <div key={`${image}-${index}`} className="relative">
                      <img src={image} alt={`Gallery ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                      <button
                        onClick={() => onRemoveGalleryImage(index)}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rich Text Content *</label>
              <RichTextEditor
                value={article.contentHtml || ""}
                onChange={(value) => onUpdate({ ...article, contentHtml: value })}
                placeholder="Write the full article content here..."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={onSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Save Article
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
  );
}

export default function News() {
  return (
    <ProtectedRoute>
      <NewsPage />
    </ProtectedRoute>
  );
}


