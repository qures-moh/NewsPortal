
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Video,
  Upload,
  Search,
  Copy,
  Trash2,
  RefreshCw,
  X,
  FileImage,
  FileVideo,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/api";
import ConfirmModal from "../../components/common/ConfirmModal";
import "./MediaLibrary.css";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");

const getMediaUrl = (url) => {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const formatDate = (date) => {
  if (!date) return "Unknown date";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const MediaLibrary = () => {
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [copiedFilename, setCopiedFilename] = useState("");

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    variant: "danger",
    onConfirm: null,
    isLoading: false,
  });

  const fetchMedia = async () => {
    try {
      setLoading(true);

      const response = await api.get("/media");

      if (response.data.success) {
        setMedia(response.data.data || []);
      } else {
        toast.error(response.data.message || "Unable to load media");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load media library"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (event, type) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (type === "image") {
      const allowedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
        "image/gif",
      ];
      if (!allowedImageTypes.includes(file.type)) {
        toast.error("Only JPG, PNG, WEBP, AVIF, and GIF image files are allowed.");
        event.target.value = "";
        return;
      }
    } else if (type === "video") {
      const allowedVideoTypes = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo",
        "video/x-matroska",
      ];
      if (!allowedVideoTypes.includes(file.type) && !file.type.startsWith("video/")) {
        toast.error("Only MP4, WEBM, MOV, AVI, and MKV video files are allowed.");
        event.target.value = "";
        return;
      }
    }

    const maxSize =
      type === "image" ? 5 * 1024 * 1024 : 100 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error(
        `${type === "image" ? "Image" : "Video"} must be smaller than ${
          type === "image" ? "5 MB" : "100 MB"
        }`
      );

      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append(type, file);

    try {
      setUploading(true);

      const response = await api.post(`/media/${type}`, formData);

      if (response.data.success) {
        toast.success(response.data.message || "Upload successful");
        await fetchMedia();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "File upload failed"
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = (item) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete ${item.type === "image" ? "Image" : "Video"}`,
      message: `Are you sure you want to permanently delete "${item.filename}"? This action cannot be undone and may affect articles using this media.`,
      confirmText: "Delete Media",
      variant: "danger",
      isLoading: false,
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          const response = await api.delete(
            `/media/${item.type}/${encodeURIComponent(item.filename)}`
          );

          if (response.data.success) {
            setMedia((previous) =>
              previous.filter(
                (mediaItem) =>
                  !(
                    mediaItem.type === item.type &&
                    mediaItem.filename === item.filename
                  )
              )
            );

            if (
              selectedMedia?.filename === item.filename &&
              selectedMedia?.type === item.type
            ) {
              setSelectedMedia(null);
            }

            toast.success("Media deleted successfully");
            setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          } else {
            throw new Error(response.data.message || "Unable to delete media");
          }
        } catch (error) {
          toast.error(
            error.response?.data?.message || error.message || "Unable to delete media"
          );
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleCopyUrl = async (item) => {
    const url = getMediaUrl(item.url);

    try {
      await navigator.clipboard.writeText(url);
      setCopiedFilename(item.filename);
      toast.success("Media URL copied");

      window.setTimeout(() => {
        setCopiedFilename("");
      }, 1800);
    } catch {
      toast.error("Unable to copy URL");
    }
  };

  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      const matchesFilter =
        activeFilter === "all" || item.type === activeFilter;

      const matchesSearch = item.filename
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [media, activeFilter, search]);

  const imageCount = media.filter(
    (item) => item.type === "image"
  ).length;

  const videoCount = media.filter(
    (item) => item.type === "video"
  ).length;

  return (
    <div className="media-library">
      <div className="media-header">
        <div>
          <h1>Media Library</h1>
          <p>Manage all your uploaded images and videos in one place.</p>
        </div>

        <div className="media-upload-actions">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            hidden
            onChange={(event) => handleUpload(event, "image")}
          />

          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            hidden
            onChange={(event) => handleUpload(event, "video")}
          />

          <button
            className="media-btn media-btn-light"
            type="button"
            disabled={uploading}
            onClick={() => imageInputRef.current?.click()}
          >
            <ImageIcon size={17} />
            Upload Image
          </button>

          <button
            className="media-btn media-btn-primary"
            type="button"
            disabled={uploading}
            onClick={() => videoInputRef.current?.click()}
          >
            <Upload size={17} />
            Upload Video
          </button>
        </div>
      </div>

      {uploading && (
        <div className="media-upload-progress">
          <RefreshCw size={16} className="media-spin" />
          Uploading your file. Please wait...
        </div>
      )}

      <div className="media-stats">
        <div className="media-stat-card">
          <div className="media-stat-icon total">
            <FileImage size={21} />
          </div>
          <div>
            <span>Total Media</span>
            <strong>{media.length}</strong>
          </div>
        </div>

        <div className="media-stat-card">
          <div className="media-stat-icon images">
            <ImageIcon size={21} />
          </div>
          <div>
            <span>Images</span>
            <strong>{imageCount}</strong>
          </div>
        </div>

        <div className="media-stat-card">
          <div className="media-stat-icon videos">
            <FileVideo size={21} />
          </div>
          <div>
            <span>Videos</span>
            <strong>{videoCount}</strong>
          </div>
        </div>
      </div>

      <div className="media-content">
        <div className="media-toolbar">
          <div className="media-filters">
            {[
              { label: "All Media", value: "all" },
              { label: "Images", value: "image" },
              { label: "Videos", value: "video" },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={
                  activeFilter === filter.value ? "active" : ""
                }
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="media-search">
            <Search size={17} />
            <input
              type="text"
              placeholder="Search by filename..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <button
            className="media-refresh-btn"
            type="button"
            onClick={fetchMedia}
            disabled={loading}
            title="Refresh media"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        {loading ? (
          <div className="media-state">
            <RefreshCw size={25} className="media-spin" />
            <p>Loading media library...</p>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="media-state">
            <div className="media-empty-icon">
              {activeFilter === "video" ? (
                <Video size={30} />
              ) : (
                <ImageIcon size={30} />
              )}
            </div>

            <h3>No media found</h3>

            <p>
              {search
                ? "Try another filename or clear your search."
                : "Upload an image or video to get started."}
            </p>
          </div>
        ) : (
          <div className="media-grid">
            {filteredMedia.map((item) => (
              <div
                className="media-card"
                key={`${item.type}-${item.filename}`}
              >
                <button
                  className="media-preview"
                  type="button"
                  onClick={() => setSelectedMedia(item)}
                  title="Preview media"
                >
                  {item.type === "image" ? (
                    <img
                      src={getMediaUrl(item.url)}
                      alt={item.filename}
                      loading="lazy"
                    />
                  ) : (
                    <div className="media-video-preview">
                      <Video size={38} />
                      <span>VIDEO</span>
                    </div>
                  )}
                </button>

                <div className="media-card-info">
                  <div className="media-file-name">
                    {item.type === "image" ? (
                      <ImageIcon size={16} />
                    ) : (
                      <Video size={16} />
                    )}

                    <span title={item.filename}>{item.filename}</span>
                  </div>

                  <div className="media-file-meta">
                    <span>{formatFileSize(item.size)}</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>

                  <div className="media-card-actions">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(item)}
                      title="Copy media URL"
                    >
                      {copiedFilename === item.filename ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}

                      {copiedFilename === item.filename
                        ? "Copied"
                        : "Copy URL"}
                    </button>

                    <button
                      type="button"
                      className="media-delete-btn"
                      onClick={() => handleDelete(item)}
                      title="Delete media"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMedia && (
        <div
          className="media-modal-overlay"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="media-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="media-modal-header">
              <div>
                <h3>Media Preview</h3>
                <p>{selectedMedia.filename}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                aria-label="Close preview"
              >
                <X size={21} />
              </button>
            </div>

            <div className="media-modal-preview">
              {selectedMedia.type === "image" ? (
                <img
                  src={getMediaUrl(selectedMedia.url)}
                  alt={selectedMedia.filename}
                />
              ) : (
                <video
                  src={getMediaUrl(selectedMedia.url)}
                  controls
                  autoPlay
                />
              )}
            </div>

            <div className="media-modal-footer">
              <span>
                {formatFileSize(selectedMedia.size)} ·{" "}
                {formatDate(selectedMedia.createdAt)}
              </span>

              <button
                type="button"
                className="media-btn media-btn-primary"
                onClick={() => handleCopyUrl(selectedMedia)}
              >
                <Copy size={16} />
                Copy URL
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => !confirmModal.isLoading && setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        isLoading={confirmModal.isLoading}
      />
    </div>
  );
};

export default MediaLibrary;
