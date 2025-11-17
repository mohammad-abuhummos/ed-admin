import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { Sidebar } from "~/components/Sidebar";
import { useAuth } from "~/contexts/AuthContext";
import { logout } from "~/lib/auth";
import {
  getGallery,
  saveCountry,
  deleteCountry,
  saveAlbum,
  deleteAlbum,
  addImageToAlbum,
  deleteImageFromAlbum,
  uploadImage,
  type Country,
  type Album,
  type Language,
} from "~/lib/content";
import type { Route } from "./+types/gallery";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Gallery - Emirates Delights Admin" },
    { name: "description", content: "Manage gallery" },
  ];
}

function GalleryPage() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>("en");
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [expandedAlbums, setExpandedAlbums] = useState<Set<string>>(new Set());
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<{ countryId: string; album: Album } | null>(null);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const data = await getGallery();
      setCountries(data);
    } catch (error) {
      console.error("Error fetching gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleCountry = (countryId: string) => {
    const newExpanded = new Set(expandedCountries);
    if (newExpanded.has(countryId)) {
      newExpanded.delete(countryId);
    } else {
      newExpanded.add(countryId);
    }
    setExpandedCountries(newExpanded);
  };

  const toggleAlbum = (albumId: string) => {
    const newExpanded = new Set(expandedAlbums);
    if (newExpanded.has(albumId)) {
      newExpanded.delete(albumId);
    } else {
      newExpanded.add(albumId);
    }
    setExpandedAlbums(newExpanded);
  };

  const handleAddCountry = () => {
    setEditingCountry({
      name: { en: "", ar: "" },
      albums: [],
    });
  };

  const handleEditCountry = (country: Country) => {
    setEditingCountry({ ...country });
  };

  const handleSaveCountry = async () => {
    if (!editingCountry) return;

    try {
      await saveCountry(editingCountry);
      await fetchGallery();
      setEditingCountry(null);
      alert("Country saved successfully!");
    } catch (error) {
      console.error("Error saving country:", error);
      alert("Failed to save country");
    }
  };

  const handleDeleteCountry = async (countryId: string) => {
    if (confirm("Are you sure you want to delete this country? All albums and images will be deleted.")) {
      try {
        await deleteCountry(countryId);
        await fetchGallery();
        alert("Country deleted successfully!");
      } catch (error) {
        console.error("Error deleting country:", error);
        alert("Failed to delete country");
      }
    }
  };

  const handleAddAlbum = (countryId: string) => {
    setEditingAlbum({
      countryId,
      album: {
        name: { en: "", ar: "" },
        images: [],
      },
    });
  };

  const handleEditAlbum = (countryId: string, album: Album) => {
    setEditingAlbum({ countryId, album: { ...album } });
  };

  const handleSaveAlbum = async () => {
    if (!editingAlbum) return;

    // Validate album name
    if (!editingAlbum.album.name.en && !editingAlbum.album.name.ar) {
      alert("Please enter at least one album name (English or Arabic)");
      return;
    }

    try {
      await saveAlbum(editingAlbum.countryId, editingAlbum.album);
      await fetchGallery();
      setEditingAlbum(null);
      alert("Album saved successfully!");
    } catch (error) {
      console.error("Error saving album:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save album";
      alert(`Failed to save album: ${errorMessage}`);
    }
  };

  const handleDeleteAlbum = async (countryId: string, albumId: string) => {
    if (confirm("Are you sure you want to delete this album? All images will be deleted.")) {
      try {
        await deleteAlbum(countryId, albumId);
        await fetchGallery();
        alert("Album deleted successfully!");
      } catch (error) {
        console.error("Error deleting album:", error);
        alert("Failed to delete album");
      }
    }
  };

  const handleImageUpload = async (countryId: string, albumId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, "gallery");
      await addImageToAlbum(countryId, albumId, imageUrl);
      await fetchGallery();
      alert("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (countryId: string, albumId: string, imageIndex: number) => {
    if (confirm("Are you sure you want to delete this image?")) {
      try {
        await deleteImageFromAlbum(countryId, albumId, imageIndex);
        await fetchGallery();
        alert("Image deleted successfully!");
      } catch (error) {
        console.error("Error deleting image:", error);
        alert("Failed to delete image");
      }
    }
  };

  const updateCountryName = (lang: Language, value: string) => {
    if (!editingCountry) return;
    setEditingCountry({
      ...editingCountry,
      name: {
        ...editingCountry.name,
        [lang]: value,
      },
    });
  };

  const updateAlbumName = (lang: Language, value: string) => {
    if (!editingAlbum) return;
    setEditingAlbum({
      ...editingAlbum,
      album: {
        ...editingAlbum.album,
        name: {
          ...editingAlbum.album.name,
          [lang]: value,
        },
      },
    });
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
                <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
                <p className="text-sm text-gray-600 mt-1">Manage countries, albums, and images</p>
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
          {/* Language Tabs */}
          <div className="mb-6 bg-white rounded-xl shadow-md border border-blue-100 p-4">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentLang("en")}
                className={`px-4 py-2 font-medium transition-colors ${
                  currentLang === "en"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setCurrentLang("ar")}
                className={`px-4 py-2 font-medium transition-colors ${
                  currentLang === "ar"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                العربية (Arabic)
              </button>
            </div>
          </div>

          {/* Add Country Button */}
          <div className="mb-6">
            <button
              onClick={handleAddCountry}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Country
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading gallery...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {countries.map((country) => (
                <div key={country.id} className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
                  {/* Country Header */}
                  <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => country.id && toggleCountry(country.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <svg
                          className={`w-5 h-5 transition-transform ${expandedCountries.has(country.id || "") ? "rotate-90" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {country.name[currentLang] || country.name.en || country.name.ar || "Unnamed Country"}
                      </h2>
                      <span className="text-sm text-gray-500">
                        ({country.albums?.length || 0} {country.albums?.length === 1 ? "album" : "albums"})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCountry(country)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => country.id && handleAddAlbum(country.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Add Album
                      </button>
                      <button
                        onClick={() => country.id && handleDeleteCountry(country.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Albums */}
                  {expandedCountries.has(country.id || "") && (
                    <div className="p-4 space-y-4">
                      {country.albums && country.albums.length > 0 ? (
                        country.albums.map((album) => (
                          <div key={album.id} className="bg-gray-50 rounded-lg border border-gray-200">
                            {/* Album Header */}
                            <div className="p-3 bg-white border-b border-gray-200 flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <button
                                  onClick={() => album.id && toggleAlbum(album.id)}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  <svg
                                    className={`w-4 h-4 transition-transform ${expandedAlbums.has(album.id || "") ? "rotate-90" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                                <h3 className="font-medium text-gray-900">
                                  {album.name[currentLang] || album.name.en || album.name.ar || "Unnamed Album"}
                                </h3>
                                <span className="text-sm text-gray-500">
                                  ({album.images?.length || 0} {album.images?.length === 1 ? "image" : "images"})
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => country.id && handleEditAlbum(country.id, album)}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => country.id && album.id && handleDeleteAlbum(country.id, album.id)}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            {/* Images */}
                            {expandedAlbums.has(album.id || "") && (
                              <div className="p-4">
                                {/* Upload Image */}
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload Image
                                  </label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => country.id && album.id && handleImageUpload(country.id, album.id, e)}
                                    disabled={uploading}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                                  />
                                  {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                                </div>

                                {/* Images Grid */}
                                {album.images && album.images.length > 0 ? (
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {album.images.map((image, imageIndex) => (
                                      <div key={imageIndex} className="relative group">
                                        <img
                                          src={image.imageUrl}
                                          alt={`Image ${imageIndex + 1}`}
                                          className="w-full h-48 object-cover rounded-lg"
                                        />
                                        <button
                                          onClick={() => country.id && album.id && handleDeleteImage(country.id, album.id, imageIndex)}
                                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 text-center py-4">No images in this album yet.</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No albums in this country yet.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {countries.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl shadow-md border border-blue-100">
                  <p className="text-gray-500">No countries added yet. Click &quot;Add Country&quot; to get started.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Country Edit Modal */}
      {editingCountry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingCountry.id ? "Edit Country" : "Add Country"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country Name (English)
                </label>
                <input
                  type="text"
                  value={editingCountry.name.en || ""}
                  onChange={(e) => updateCountryName("en", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country Name (Arabic)
                </label>
                <input
                  type="text"
                  value={editingCountry.name.ar || ""}
                  onChange={(e) => updateCountryName("ar", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingCountry(null)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCountry}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Album Edit Modal */}
      {editingAlbum && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingAlbum.album.id ? "Edit Album" : "Add Album"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Album Name (English)
                </label>
                <input
                  type="text"
                  value={editingAlbum.album.name.en || ""}
                  onChange={(e) => updateAlbumName("en", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Album Name (Arabic)
                </label>
                <input
                  type="text"
                  value={editingAlbum.album.name.ar || ""}
                  onChange={(e) => updateAlbumName("ar", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingAlbum(null)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAlbum}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Gallery() {
  return (
    <ProtectedRoute>
      <GalleryPage />
    </ProtectedRoute>
  );
}

