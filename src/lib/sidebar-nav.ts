import {
  IconLayoutDashboard,
  IconSettings,
  IconUsers,
  IconShieldLock,
  IconPackage,
  IconUsersGroup,
  IconReceipt2,
  IconHelp,
  IconAlertTriangle,
  IconUserMinus,
  IconClock,
  IconBuildingSkyscraper,
  IconMap2,
  IconWallet,
  IconPhoto,
  IconPhotoStar,
  IconFingerprint,
  IconTicket
} from "@tabler/icons-react";

export interface SidebarNavItem {
  titleKey: string;
  href: string;
  icon?: React.ElementType;
}

export interface SidebarNavSection {
  titleKey: string;
  href: string;
  items: SidebarNavItem[];
  icon?: React.ElementType;
}

export type SidebarNavEntry = SidebarNavItem | SidebarNavSection;

export function isNavSection(
  item: SidebarNavEntry
): item is SidebarNavSection {
  return "items" in item && Array.isArray((item as SidebarNavSection).items);
}

/** Sidebar navigation config for Vrindavan Admin Panel. titleKey matches i18n messages. */
export const sidebarNav: SidebarNavEntry[] = [
  { titleKey: "nav.dashboard", href: "/dashboard", icon: IconLayoutDashboard },
  {
    titleKey: "nav.darshanManagement",
    href: "/darshan-management", // Arbitrary base for selection tracking
    icon: IconFingerprint,
    items: [
      { titleKey: "nav.darshans", href: "/darshans", icon: IconPhoto },
      { titleKey: "nav.darshanBanners", href: "/darshan-banners", icon: IconPhotoStar },
      { titleKey: "nav.temples", href: "/temples", icon: IconBuildingSkyscraper },
    ],
  },
  { titleKey: "tours.title", href: "/tours", icon: IconMap2 },
  { titleKey: "nav.bookings", href: "/bookings", icon: IconReceipt2 },
  { titleKey: "nav.tourMap", href: "/route-maps", icon: IconMap2 },
  { titleKey: "nav.userManagement", href: "/users", icon: IconUsers },
  { titleKey: "nav.coupons", href: "/coupons", icon: IconTicket },
  { titleKey: "nav.wallets", href: "/wallets", icon: IconWallet },
];
