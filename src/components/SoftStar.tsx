export function SoftStar({
  className,
  fill = "#fe4cba",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill={fill}
    >
      <path d="M12 1.6l2.7 6.8 7.3.6-5.6 4.8 1.8 7.1L12 17.2l-6.2 3.7 1.8-7.1L2 9l7.3-.6L12 1.6z" />
    </svg>
  );
}
