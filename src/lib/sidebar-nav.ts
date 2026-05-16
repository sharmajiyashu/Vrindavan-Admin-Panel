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
  IconTicket,
  IconLayoutBottombar,
  IconInfoCircle,
  IconCalendarStats
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
  { titleKey: "tours.title", href: "/tours", icon: IconMap2 },
  { titleKey: "nav.tourOperations", href: "/tour-operations", icon: IconCalendarStats },
  { titleKey: "nav.bookings", href: "/bookings", icon: IconReceipt2 },
  {
    titleKey: "nav.darshanManagement",
    href: "/darshan-management",
    icon: IconFingerprint,
    items: [
      { titleKey: "nav.darshans", href: "/darshans", icon: IconPhoto },
      { titleKey: "nav.darshanBanners", href: "/darshan-banners", icon: IconPhotoStar },
      { titleKey: "nav.footerPromos", href: "/footer-promos", icon: IconLayoutBottombar },
      { titleKey: "nav.temples", href: "/temples", icon: IconBuildingSkyscraper },
    ],
  },
  { titleKey: "nav.referrals", href: "/referrals", icon: IconUsersGroup },
  { titleKey: "nav.userManagement", href: "/users", icon: IconUsers },
  { titleKey: "nav.coupons", href: "/coupons", icon: IconTicket },
  // { titleKey: "nav.wallets", href: "/wallets", icon: IconWallet },
  { titleKey: "nav.tourMap", href: "/route-maps", icon: IconMap2 },
  { titleKey: "nav.aboutUs", href: "/about-us", icon: IconInfoCircle },
];
