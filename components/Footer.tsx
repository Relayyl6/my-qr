import Link from 'next/link';

interface FooterProps {
  theme?: 'dark' | 'light';
  className?: string;
}

export function QrMark({ className = 'w-4 h-4', fill = 'currentColor' }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="1" y="1" width="9" height="9" rx="1.5" stroke={fill} strokeWidth="2" />
      <rect x="4" y="4" width="3" height="3" fill={fill} />
      <rect x="14" y="1" width="9" height="9" rx="1.5" stroke={fill} strokeWidth="2" />
      <rect x="17" y="4" width="3" height="3" fill={fill} />
      <rect x="1" y="14" width="9" height="9" rx="1.5" stroke={fill} strokeWidth="2" />
      <rect x="4" y="17" width="3" height="3" fill={fill} />
      <rect x="15" y="15" width="3" height="3" fill={fill} />
      <rect x="20" y="15" width="3" height="3" fill={fill} />
      <rect x="15" y="20" width="3" height="3" fill={fill} />
      <rect x="20" y="20" width="3" height="3" fill={fill} />
    </svg>
  );
}

export default function Footer({ theme = 'light', className = '' }: FooterProps) {
  const isDark = theme === 'dark';

  return (
    <footer
      className={`w-full ${
        isDark
          ? 'bg-[#11140F] text-white border-t border-white/10'
          : 'bg-[#EEF0EA] text-[#11140F] border-t border-[#11140F]/10'
      } ${className}`}
    >
      <div className="max-w-[1240px] mx-auto px-6 sm:px-8 py-16 md:py-20 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand & Copyright */}
        <div className="flex items-center gap-3">
          <QrMark className="w-4 h-4 shrink-0" fill={isDark ? '#34D399' : '#11140F'} />
          <span className={`text-[13px] font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#11140F]'}`}>
            DynamicQR
          </span>
          <span className={isDark ? 'text-white/20' : 'text-[#11140F]/20'}>•</span>
          <span className={`text-[12px] font-mono ${isDark ? 'text-white/40' : 'text-[#11140F]/45'}`}>
            © {new Date().getFullYear()}
          </span>
        </div>

        {/* Minimal Nav Links */}
        <nav className="flex items-center gap-7 sm:gap-9 text-[12.5px] font-medium tracking-wide">
          <Link
            href="/pricing"
            className={`${
              isDark ? 'text-white/50 hover:text-white' : 'text-[#11140F]/55 hover:text-[#11140F]'
            } transition-colors`}
          >
            Pricing
          </Link>
          <Link
            href="/privacy"
            className={`${
              isDark ? 'text-white/50 hover:text-white' : 'text-[#11140F]/55 hover:text-[#11140F]'
            } transition-colors`}
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className={`${
              isDark ? 'text-white/50 hover:text-white' : 'text-[#11140F]/55 hover:text-[#11140F]'
            } transition-colors`}
          >
            Terms
          </Link>
          <Link
            href="/refund"
            className={`${
              isDark ? 'text-white/50 hover:text-white' : 'text-[#11140F]/55 hover:text-[#11140F]'
            } transition-colors`}
          >
            Refund Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
