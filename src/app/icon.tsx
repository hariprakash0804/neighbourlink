import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #0ea5e9 100%)",
          borderRadius: "8px",
          position: "relative",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="none"
        >
          <path
            d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z"
            fill="#ffffff"
          />
          <circle cx="12" cy="9" r="3" fill="#6366f1" />
        </svg>
        <div
          style={{
            position: "absolute",
            bottom: "2px",
            right: "2px",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#10b981",
            border: "1.5px solid #ffffff",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
