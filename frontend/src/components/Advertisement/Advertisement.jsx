
import { useEffect, useState } from "react";
import api from "../../api/api";
import "./Advertisement.css";

const getCurrentDevice = () =>
  window.matchMedia("(max-width: 767px)").matches
    ? "mobile"
    : "desktop";

const Advertisement = ({ page, position }) => {
  const [advertisements, setAdvertisements] = useState([]);
  const [device, setDevice] = useState(getCurrentDevice);
  const [loading, setLoading] = useState(true);

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
    if (
      !allowedPages.includes(page) ||
      !allowedPositions.includes(position)
    ) {
      console.error("Invalid advertisement props:", {
        page,
        position,
      });

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
          setAdvertisements(response.data.advertisements || []);
        }
      } catch (error) {
        if (
          !controller.signal.aborted &&
          error.code !== "ERR_CANCELED"
        ) {
          console.error("Advertisement fetch error:", error);
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

  if (loading || advertisements.length === 0) {
    return null;
  }

  return (
    <section className="advertisement-section">
      {advertisements.map((ad) => (
        <a
          key={ad._id}
          href={ad.destinationUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="advertisement-link"
        >
          <div className="advertisement-label">
            Advertisement
          </div>

          <img
            src={ad.bannerImage}
            alt={ad.name || "Advertisement"}
            className="advertisement-image"
            loading="lazy"
          />
        </a>
      ))}
    </section>
  );
};

export default Advertisement;
