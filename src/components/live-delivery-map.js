
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { doc, onSnapshot } from "firebase/firestore";

import { db } from "../lib/firebase";

function getCoordinates(value) {
  if (!value) return null;

  let latitude;
  let longitude;

  if (Array.isArray(value)) {
    [latitude, longitude] = value;
  } else {
    latitude =
      value.latitude ??
      value.lat ??
      null;

    longitude =
      value.longitude ??
      value.lng ??
      value.lon ??
      null;
  }

  latitude = Number(latitude);
  longitude = Number(longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return [latitude, longitude];
}

function MapViewport({ courier, destination }) {
  const map = useMap();

  useEffect(() => {
    const points = [courier, destination].filter(Boolean);

    if (points.length === 2) {
      map.fitBounds(points, { padding: [45, 45], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 15);
    }
  }, [courier, destination, map]);

  return null;
}

function formatUpdatedAt(timestamp) {
  if (!timestamp) return "Waiting for first GPS update";

  const date =
    typeof timestamp.toDate === "function"
      ? timestamp.toDate()
      : new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Location update received";
  }

  return `Last updated at ${date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  })}`;
}

export default function LiveDeliveryMap({
  orderId,
  addressLocation,
}) {
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState("");

  const destination = useMemo(
    () => getCoordinates(addressLocation),
    [addressLocation]
  );

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "deliveryLocations", orderId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setDeliveryLocation(null);
          setLocationLoading(false);
          setLocationError("");
          return;
        }

        const data = snapshot.data();
        const coordinates = getCoordinates(data);

        setDeliveryLocation(
          coordinates
            ? {
                coordinates,
                updatedAt: data.updatedAt || null,
                isActive: data.isActive === true,
                accuracy: data.accuracy ?? null,
              }
            : null
        );

        setLocationError("");
        setLocationLoading(false);
      },
      (error) => {
        console.error("Delivery location listener error:", error);
        setLocationError(
          "Unable to access live location right now."
        );
        setLocationLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  const courier = deliveryLocation?.coordinates || null;
  const effectiveLocationLoading = orderId
    ? locationLoading
    : false;
  const effectiveLocationError = orderId
    ? locationError
    : "Invalid order.";

  const mapCenter =
    courier ||
    destination ||
    [20.5937, 78.9629];

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-4">
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-gray-900 text-base sm:text-lg">
            Live delivery tracking
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Follow your delivery person&apos;s location.
          </p>
        </div>

        <span
          className={`shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-full ${
            deliveryLocation?.isActive
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {deliveryLocation?.isActive
            ? "LIVE"
            : "WAITING"}
        </span>
      </div>

      <div className="relative h-[300px] sm:h-[380px] w-full bg-gray-100">
        <MapContainer
          center={mapCenter}
          zoom={courier || destination ? 14 : 5}
          scrollWheelZoom={true}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapViewport
            courier={courier}
            destination={destination}
          />

          {courier && (
            <CircleMarker
              center={courier}
              radius={11}
              pathOptions={{
                color: "#ffffff",
                weight: 4,
                fillColor: "#16a34a",
                fillOpacity: 1,
              }}
            >
              <Popup>
                <strong>Delivery person</strong>
                <br />
                Current GPS position
              </Popup>
            </CircleMarker>
          )}

          {destination && (
            <CircleMarker
              center={destination}
              radius={9}
              pathOptions={{
                color: "#ffffff",
                weight: 3,
                fillColor: "#2563eb",
                fillOpacity: 1,
              }}
            >
              <Popup>
                <strong>Delivery address</strong>
                <br />
                Your destination
              </Popup>
            </CircleMarker>
          )}
        </MapContainer>

        {!courier && (
          <div className="absolute inset-x-3 bottom-3 z-[500] bg-white/95 backdrop-blur rounded-xl p-3 shadow-md pointer-events-none">
            <p className="text-xs font-bold text-gray-800">
              {effectiveLocationLoading
                ? "Connecting to delivery tracking..."
                : "Waiting for delivery person"}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Their live location will appear here once they start sharing GPS.
            </p>
          </div>
        )}
      </div>

      <div className="p-4 flex items-start gap-3">
        <span className="w-3 h-3 rounded-full bg-green-600 mt-1 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800">
            Delivery person&apos;s location
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            {deliveryLocation
              ? formatUpdatedAt(deliveryLocation.updatedAt)
              : "Live GPS has not started yet."}
          </p>

          {deliveryLocation?.accuracy != null && (
            <p className="text-[11px] text-gray-400 mt-1">
              GPS accuracy: approximately{" "}
              {Math.round(Number(deliveryLocation.accuracy))} metres
            </p>
          )}

          {effectiveLocationError && (
            <p className="text-[11px] text-red-600 mt-1">
              {effectiveLocationError}
            </p>
          )}

          {!destination && (
            <p className="text-[11px] text-amber-600 mt-1">
              Delivery address coordinates are not available yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
