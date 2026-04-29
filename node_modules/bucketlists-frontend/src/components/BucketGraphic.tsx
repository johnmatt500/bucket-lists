interface Props {
  fillPercent: number
  size?: number
}

export default function BucketGraphic({ fillPercent, size = 220 }: Props) {
  const clampedFill = Math.min(100, Math.max(0, fillPercent))

  // Bucket shape: trapezoid narrower at top, wider at bottom
  // ViewBox 0 0 100 120
  const topLeft = { x: 18, y: 10 }
  const topRight = { x: 82, y: 10 }
  const bottomRight = { x: 90, y: 105 }
  const bottomLeft = { x: 10, y: 105 }

  // Water fill: clampedFill=100 → full bucket, 0 → empty
  // The fill rises from bottom (y=105) to top (y=10), height=95
  const fillHeight = (clampedFill / 100) * 95
  const waterTop = 105 - fillHeight

  // At waterTop y, interpolate left and right x along the bucket sides
  const t = (waterTop - 10) / 95 // 0 at bucket top, 1 at bucket bottom
  const waterLeft = topLeft.x + t * (bottomLeft.x - topLeft.x)
  const waterRight = topRight.x + t * (bottomRight.x - topRight.x)

  const bucketPath = `M ${topLeft.x} ${topLeft.y} L ${topRight.x} ${topRight.y} L ${bottomRight.x} ${bottomRight.y} L ${bottomLeft.x} ${bottomLeft.y} Z`
  const waterPath = `M ${waterLeft} ${waterTop} L ${waterRight} ${waterTop} L ${bottomRight.x} ${bottomRight.y} L ${bottomLeft.x} ${bottomLeft.y} Z`

  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Bucket ${clampedFill}% full`}
      role="img"
    >
      {/* Handle */}
      <path
        d="M 30 10 Q 50 -5 70 10"
        stroke="#85B7D6"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />

      {/* Water fill */}
      {clampedFill > 0 && (
        <path d={waterPath} fill="#85B7D6" opacity="0.55" />
      )}

      {/* Bucket outline */}
      <path
        d={bucketPath}
        stroke="#85B7D6"
        strokeWidth="3.5"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Percentage label */}
      <text
        x="50"
        y="70"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#F6F0E7"
        fontSize="18"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {clampedFill}%
      </text>
    </svg>
  )
}
