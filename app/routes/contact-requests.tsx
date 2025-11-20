import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { Sidebar } from "~/components/Sidebar";
import { useAuth } from "~/contexts/AuthContext";
import { logout } from "~/lib/auth";
import {
  getContactMessages,
  markMessageAsSeen,
  markMessageAsResolved,
  deleteContactMessage,
  type ContactMessage,
} from "~/lib/content";
import type { Route } from "./+types/contact-requests";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Contact Requests - Emirates Delights Admin" },
    { name: "description", content: "Manage contact form submissions" },
  ];
}

type FilterType = "all" | "unread" | "unresolved";

function ContactRequestsPage() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const data = await getContactMessages();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleViewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
    
    // Mark as seen if not already seen
    if (message.id && !message.seen) {
      try {
        await markMessageAsSeen(message.id);
        // Update local state
        setMessages(prev => 
          prev.map(m => m.id === message.id ? { ...m, seen: true } : m)
        );
      } catch (error) {
        console.error("Error marking message as seen:", error);
      }
    }
  };

  const handleToggleResolved = async (messageId: string, currentResolved: boolean) => {
    try {
      await markMessageAsResolved(messageId, !currentResolved);
      // Update local state
      setMessages(prev => 
        prev.map(m => m.id === messageId ? { ...m, resolved: !currentResolved } : m)
      );
      // Update selected message if it's the one being toggled
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(prev => prev ? { ...prev, resolved: !currentResolved } : null);
      }
    } catch (error) {
      console.error("Error toggling resolved status:", error);
      alert("Failed to update resolved status");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteContactMessage(messageId);
        await fetchMessages();
        if (selectedMessage?.id === messageId) {
          setIsModalOpen(false);
          setSelectedMessage(null);
        }
      } catch (error) {
        console.error("Error deleting message:", error);
        alert("Failed to delete message");
      }
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (error) {
      return "Invalid date";
    }
  };

  const filteredMessages = messages.filter((message) => {
    if (filter === "unread") return !message.seen;
    if (filter === "unresolved") return !message.resolved;
    return true;
  });

  const unreadCount = messages.filter(m => !m.seen).length;
  const unresolvedCount = messages.filter(m => !m.resolved).length;

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
                  Contact Requests
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage contact form submissions
                </p>
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
          {/* Filter Tabs */}
          <div className="mb-6 flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                filter === "all"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-600 border-transparent hover:text-gray-900"
              }`}
            >
              All ({messages.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 font-medium transition-colors border-b-2 relative ${
                filter === "unread"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-600 border-transparent hover:text-gray-900"
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter("unresolved")}
              className={`px-4 py-2 font-medium transition-colors border-b-2 relative ${
                filter === "unresolved"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-600 border-transparent hover:text-gray-900"
              }`}
            >
              Unresolved
              {unresolvedCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-orange-600 rounded-full">
                  {unresolvedCount}
                </span>
              )}
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl shadow-md border border-blue-100">
              <p className="text-gray-600">
                {filter === "all" 
                  ? "No contact messages found" 
                  : filter === "unread"
                  ? "No unread messages"
                  : "No unresolved messages"}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMessages.map((message) => (
                      <tr
                        key={message.id}
                        className={`hover:bg-blue-50 transition-all duration-200 ${
                          !message.seen ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {!message.seen && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                New
                              </span>
                            )}
                            {!message.resolved && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                Unresolved
                              </span>
                            )}
                            {message.resolved && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                Resolved
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {message.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {message.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {message.phone || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {message.subject}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDate(message.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewMessage(message)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                            {message.id && (
                              <button
                                onClick={() => handleDeleteMessage(message.id!)}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            )}
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

      {/* Message Detail Modal */}
      {isModalOpen && selectedMessage && (
        <MessageDetailModal
          message={selectedMessage}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMessage(null);
          }}
          onToggleResolved={handleToggleResolved}
          onDelete={handleDeleteMessage}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

interface MessageDetailModalProps {
  message: ContactMessage;
  onClose: () => void;
  onToggleResolved: (messageId: string, currentResolved: boolean) => void;
  onDelete: (messageId: string) => void;
  formatDate: (timestamp: any) => string;
}

function MessageDetailModal({
  message,
  onClose,
  onToggleResolved,
  onDelete,
  formatDate,
}: MessageDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full p-8 border border-blue-100 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Contact Message
                </h2>
                {!message.seen && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                    New
                  </span>
                )}
                {message.resolved ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    Resolved
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                    Unresolved
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Received on {formatDate(message.createdAt)}
              </p>
            </div>
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

          <div className="space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                  {message.name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                  <a href={`mailto:${message.email}`} className="text-blue-600 hover:text-blue-800">
                    {message.email}
                  </a>
                </p>
              </div>
              {message.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                    <a href={`tel:${message.phone}`} className="text-blue-600 hover:text-blue-800">
                      {message.phone}
                    </a>
                  </p>
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                {message.subject}
              </p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 px-4 py-3 rounded-lg whitespace-pre-wrap min-h-[150px]">
                {message.message}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              {message.id && (
                <>
                  <button
                    onClick={() => onToggleResolved(message.id!, message.resolved)}
                    className={`flex-1 font-semibold py-3 px-4 rounded-lg transition-all duration-200 ${
                      message.resolved
                        ? "bg-orange-600 hover:bg-orange-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {message.resolved ? "Mark as Unresolved" : "Mark as Resolved"}
                  </button>
                  <button
                    onClick={() => message.id && onDelete(message.id)}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200"
                  >
                    Delete
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactRequests() {
  return (
    <ProtectedRoute>
      <ContactRequestsPage />
    </ProtectedRoute>
  );
}

