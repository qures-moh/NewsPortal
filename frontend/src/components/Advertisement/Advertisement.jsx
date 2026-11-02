import { useEffect, useState } from "react";
import api from "../../api/api";
import { useLanguage } from "../../context/LanguageContext";
import { getImageUrl } from "../../utils/imageUrl";
import "./Advertisement.css";

const getCurrentDevice = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
    ? "mobile"
    : "desktop";

const Advertisement = ({ page, position }) => {
  const [advertisements, setAdvertisements] = useState([]);
  const [device, setDevice] = useState(getCurrentDevice);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage?.() || {};

  const allowedPages = ["homepage", "article", "category"];
  const allowedPositions = ["top", "middle", "bottom"];

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const handleDeviceChange = (event) => {
      setDevice(event.matches ? "mobile" : "desktop");
    };

    mediaQuery.addEventListener("change", handleDeviceChange);
    return () => {
      mediaQuery.removeEventListener("change", handleDeviceChange);
    };
  }, []);

  useEffect(() => {
    if (!allowedPages.includes(page) || !allowedPositions.includes(position)) {
      setAdvertisements([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchAdvertisements = async () => {
      try {
        setLoading(true);

        const response = await api.get("/advertisements/public", {
          params: {
            page,
            position,
            device,
          },
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          const ads = response.data?.advertisements || response.data?.data || [];
          setAdvertisements(Array.isArray(ads) ? ads : []);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setAdvertisements([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchAdvertisements();
    return () => controller.abort();
  }, [page, position, device]);

  const validAds = advertisements.filter((ad) => Boolean(getImageUrl(ad?.bannerImage)));

  if (loading || validAds.length === 0) {
    return null;
  }

  const count = validAds.length;
  const gridClass =
    count === 1
      ? "ad-grid-single"
      : count === 2
      ? "ad-grid-double"
      : count === 3
      ? "ad-grid-triple"
      : "ad-grid-multi";

  const disclaimerText = language === "hi" ? "विज्ञापन" : "ADVERTISEMENT";

  return (
    <aside
      className={`advertisement-container ad-pos-${position}`}
      aria-label={disclaimerText}
    >
      <div className="advertisement-header">
        <span className="advertisement-line" />
        <span className="advertisement-disclaimer">{disclaimerText}</span>
        <span className="advertisement-line" />
      </div>

      <div className={`advertisement-grid ${gridClass}`}>
        {validAds.map((ad) => {
          const bannerUrl = getImageUrl(ad.bannerImage);

          return (
            <div key={ad._id} className="advertisement-card">
              <a
                href={ad.destinationUrl || "#"}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="advertisement-banner-link"
                title={ad.name || "Sponsored Advertisement"}
              >
                <div className="advertisement-image-wrap">
                  <img
                    src={bannerUrl}
                    alt={ad.name || "Sponsored Advertisement"}
                    className="advertisement-banner-img"
                    loading="lazy"
                  />
                </div>
              </a>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default Advertisement;
