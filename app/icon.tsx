import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#841617",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <g transform="rotate(-35 16 16)">
            <ellipse cx={16} cy={16} rx={13} ry={7.2} fill="#6F4520" stroke="#3E2712" strokeWidth={1} />
            {/* Laces run down the football's long axis, with short perpendicular ticks. */}
            <line x1={10} y1={16} x2={22} y2={16} stroke="#F5EEE0" strokeWidth={1.4} />
            <line x1={12} y1={14.3} x2={12} y2={17.7} stroke="#F5EEE0" strokeWidth={1.2} />
            <line x1={14.7} y1={14.3} x2={14.7} y2={17.7} stroke="#F5EEE0" strokeWidth={1.2} />
            <line x1={17.3} y1={14.3} x2={17.3} y2={17.7} stroke="#F5EEE0" strokeWidth={1.2} />
            <line x1={20} y1={14.3} x2={20} y2={17.7} stroke="#F5EEE0" strokeWidth={1.2} />
          </g>
        </svg>
      </div>
    ),
    { ...size }
  );
}
