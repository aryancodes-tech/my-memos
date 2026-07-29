import { CHROME_MARK_ICON_PATH } from "@/lib/constants";

type ChromeIconProps = {
  className?: string;
};

/** Google Chrome mark for install CTAs, served as a static SVG asset. */
export function ChromeIcon({ className = "" }: ChromeIconProps) {
  return (
    <img
      src={CHROME_MARK_ICON_PATH}
      className={className}
      width={48}
      height={48}
      alt=""
      aria-hidden
      draggable={false}
    />
  );
}
