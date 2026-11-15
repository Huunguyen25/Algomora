import Image from "next/image";

/** Algomora's logo, shared by the app header and authentication screens. */
export function BrandMark() {
  return (
    <Image
      className="brand-mark"
      src="/algomora.svg"
      width={64}
      height={64}
      alt=""
      aria-hidden="true"
    />
  );
}
