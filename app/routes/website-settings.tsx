import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { Sidebar } from "~/components/Sidebar";
import { useAuth } from "~/contexts/AuthContext";
import { logout } from "~/lib/auth";
import {
  getWebsiteSettings,
  saveWebsiteSettings,
  type WebsiteSettings,
  type ContactEntry,
  type LocationEntry,
} from "~/lib/content";
import type { Route } from "./+types/website-settings";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Website Settings - Emirates Delights Admin" },
    { name: "description", content: "Manage website-wide social and contact information" },
  ];
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const buildEmptyContact = (type: "phone" | "email"): ContactEntry => ({
  id: generateId(),
  label: type === "phone" ? "Phone" : "Email",
  value: "",
});

const buildEmptyLocation = (): LocationEntry => ({
  id: generateId(),
  title: "",
  address: "",
  mapLink: "",
});

const buildDefaultSettings = (): WebsiteSettings => ({
  socialLinks: {
    facebook: "",
    instagram: "",
    whatsapp: "",
    google: "",
  },
  phones: [buildEmptyContact("phone")],
  emails: [buildEmptyContact("email")],
  locations: [buildEmptyLocation()],
});

function normalizeContacts(entries: ContactEntry[] | undefined, type: "phone" | "email") {
  if (!entries || entries.length === 0) {
    return [buildEmptyContact(type)];
  }
  return entries.map((entry) => ({
    id: entry.id || generateId(),
    label: entry.label || (type === "phone" ? "Phone" : "Email"),
    value: entry.value || "",
  }));
}

function normalizeLocations(entries: LocationEntry[] | undefined) {
  if (!entries || entries.length === 0) {
    return [buildEmptyLocation()];
  }
  return entries.map((entry) => ({
    id: entry.id || generateId(),
    title: entry.title || "",
    address: entry.address || "",
    mapLink: entry.mapLink || "",
  }));
}

function WebsiteSettingsPage() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<WebsiteSettings>(buildDefaultSettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getWebsiteSettings();
      if (data) {
        setSettings({
          ...buildDefaultSettings(),
          ...data,
          socialLinks: {
            ...buildDefaultSettings().socialLinks,
            ...(data.socialLinks || {}),
          },
          phones: normalizeContacts(data.phones, "phone"),
          emails: normalizeContacts(data.emails, "email"),
          locations: normalizeLocations(data.locations),
        });
      } else {
        setSettings(buildDefaultSettings());
      }
    } catch (error) {
      console.error("Error fetching website settings:", error);
      alert("Failed to load website settings");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const updateSocialLink = (platform: keyof WebsiteSettings["socialLinks"], value: string) => {
    setSettings((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const updateContactEntry = (type: "phone" | "email", index: number, field: keyof ContactEntry, value: string) => {
    setSettings((prev) => {
      const key = type === "phone" ? "phones" : "emails";
      const updatedEntries = [...prev[key]];
      updatedEntries[index] = {
        ...updatedEntries[index],
        [field]: value,
      };
      return {
        ...prev,
        [key]: updatedEntries,
      };
    });
  };

  const addContactEntry = (type: "phone" | "email") => {
    setSettings((prev) => {
      const key = type === "phone" ? "phones" : "emails";
      return {
        ...prev,
        [key]: [...prev[key], buildEmptyContact(type)],
      };
    });
  };

  const removeContactEntry = (type: "phone" | "email", index: number) => {
    setSettings((prev) => {
      const key = type === "phone" ? "phones" : "emails";
      const updatedEntries = prev[key].length > 1 ? prev[key].filter((_, i) => i !== index) : prev[key];
      return {
        ...prev,
        [key]: updatedEntries,
      };
    });
  };

  const updateLocation = (index: number, field: keyof LocationEntry, value: string) => {
    setSettings((prev) => {
      const updatedLocations = [...prev.locations];
      updatedLocations[index] = {
        ...updatedLocations[index],
        [field]: value,
      };
      return {
        ...prev,
        locations: updatedLocations,
      };
    });
  };

  const addLocation = () => {
    setSettings((prev) => ({
      ...prev,
      locations: [...prev.locations, buildEmptyLocation()],
    }));
  };

  const removeLocation = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      locations: prev.locations.length > 1 ? prev.locations.filter((_, i) => i !== index) : prev.locations,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveWebsiteSettings(settings);
      alert("Website settings saved successfully!");
    } catch (error) {
      console.error("Error saving website settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-blue-100">
          <div className="px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Website Settings</h1>
              <p className="text-sm text-gray-600 mt-1">
                Control social media links, contact information, and office locations
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                {userData?.email || "User"}
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

        <main className="flex-1 p-6">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading settings...</p>
            </div>
          ) : (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Social Media */}
              <section className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Social Media Links</h2>
                    <p className="text-sm text-gray-500">Add the URLs for each platform below.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
                    { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourprofile" },
                    { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/971..." },
                    { key: "google", label: "Google Business", placeholder: "https://goo.gl/maps/..." },
                  ].map((item) => (
                    <div key={item.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {item.label}
                      </label>
                      <input
                        type="url"
                        value={settings.socialLinks[item.key as keyof WebsiteSettings["socialLinks"]] || ""}
                        onChange={(e) => updateSocialLink(item.key as keyof WebsiteSettings["socialLinks"], e.target.value)}
                        placeholder={item.placeholder}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Phone Numbers */}
              <section className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Contact Phone Numbers</h2>
                    <p className="text-sm text-gray-500">Add all customer-facing phone numbers.</p>
                  </div>
                  <button
                    onClick={() => addContactEntry("phone")}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                  >
                    + Add Phone
                  </button>
                </div>

                <div className="space-y-4">
                  {settings.phones.map((phone, index) => (
                    <div key={phone.id || index} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
                          <input
                            type="text"
                            value={phone.label}
                            onChange={(e) => updateContactEntry("phone", index, "label", e.target.value)}
                            placeholder="e.g., Sales, Support"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Number</label>
                          <input
                            type="tel"
                            value={phone.value}
                            onChange={(e) => updateContactEntry("phone", index, "value", e.target.value)}
                            placeholder="+971 ..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex items-start justify-end">
                          <button
                            onClick={() => removeContactEntry("phone", index)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                            title="Remove phone"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Emails */}
              <section className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Contact Emails</h2>
                    <p className="text-sm text-gray-500">Add multiple inboxes for customer inquiries.</p>
                  </div>
                  <button
                    onClick={() => addContactEntry("email")}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                  >
                    + Add Email
                  </button>
                </div>

                <div className="space-y-4">
                  {settings.emails.map((email, index) => (
                    <div key={email.id || index} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
                          <input
                            type="text"
                            value={email.label}
                            onChange={(e) => updateContactEntry("email", index, "label", e.target.value)}
                            placeholder="e.g., Sales, Support"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={email.value}
                            onChange={(e) => updateContactEntry("email", index, "value", e.target.value)}
                            placeholder="support@example.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex items-start justify-end">
                          <button
                            onClick={() => removeContactEntry("email", index)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                            title="Remove email"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Locations */}
              <section className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Locations</h2>
                    <p className="text-sm text-gray-500">Add offices, warehouses, or pickup spots.</p>
                  </div>
                  <button
                    onClick={addLocation}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                  >
                    + Add Location
                  </button>
                </div>

                <div className="space-y-4">
                  {settings.locations.map((location, index) => (
                    <div key={location.id || index} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Location Name</label>
                          <input
                            type="text"
                            value={location.title}
                            onChange={(e) => updateLocation(index, "title", e.target.value)}
                            placeholder="e.g., Dubai HQ"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Map Link (Optional)</label>
                          <input
                            type="url"
                            value={location.mapLink || ""}
                            onChange={(e) => updateLocation(index, "mapLink", e.target.value)}
                            placeholder="https://goo.gl/maps/..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <textarea
                          value={location.address}
                          onChange={(e) => updateLocation(index, "address", e.target.value)}
                          rows={3}
                          placeholder="Street, City, Country"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => removeLocation(index)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                          title="Remove location"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function WebsiteSettings() {
  return (
    <ProtectedRoute>
      <WebsiteSettingsPage />
    </ProtectedRoute>
  );
}


