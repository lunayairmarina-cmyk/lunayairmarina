export const ADMIN_PERMISSIONS = [
  "dashboard",
  "pages",
  "content",
  "services",
  "why",
  "trust",
  "team",
  "fleet",
  "blog",
  "gallery",
  "testimonials",
  "faq",
  "messages",
  "seo",
  "settings",
  "users",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export type AdminRoleId = "super_admin" | "editor" | "gallery_manager" | "support" | "custom";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRoleId;
  permissions: AdminPermission[];
  active: boolean;
}

export const ROLE_PRESETS: Record<
  Exclude<AdminRoleId, "custom">,
  { permissions: AdminPermission[] }
> = {
  super_admin: { permissions: [...ADMIN_PERMISSIONS] },
  editor: {
    permissions: [
      "dashboard",
      "pages",
      "content",
      "services",
      "why",
      "trust",
      "team",
      "fleet",
      "blog",
      "gallery",
      "testimonials",
      "faq",
      "seo",
    ],
  },
  gallery_manager: {
    permissions: ["dashboard", "gallery", "fleet"],
  },
  support: {
    permissions: ["dashboard", "messages"],
  },
};

export const DEFAULT_ADMIN_USERS: AdminUser[] = [
  {
    id: "u1",
    name: "lunayairmarina Admin",
    email: "admin@lunayairmarina.com",
    role: "super_admin",
    permissions: [...ADMIN_PERMISSIONS],
    active: true,
  },
  {
    id: "u2",
    name: "Content Editor",
    email: "editor@lunayairmarina.com",
    role: "editor",
    permissions: [...ROLE_PRESETS.editor.permissions],
    active: true,
  },
];

export const USERS_STORAGE_KEY = "lunayairmarina.admin.users.v2";
export const SESSION_STORAGE_KEY = "lunayairmarina.admin.session";

export function permissionsForRole(role: AdminRoleId, custom?: AdminPermission[]) {
  if (role === "custom") return custom ?? [];
  return [...ROLE_PRESETS[role].permissions];
}

export function loadAdminUsers(): AdminUser[] {
  if (typeof window === "undefined") return DEFAULT_ADMIN_USERS;
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return DEFAULT_ADMIN_USERS;
    const parsed = JSON.parse(raw) as AdminUser[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_ADMIN_USERS;
    // Migrate old "fleet" permission to "blog" and grant new CMS permissions to super admins.
    return parsed.map((user) => {
      const migrated = user.permissions.map((permission) =>
        (permission as string) === "fleet" ? "blog" : permission,
      ) as AdminPermission[];
      const permissions =
        user.role === "super_admin"
          ? [...ADMIN_PERMISSIONS]
          : Array.from(new Set([...migrated, ...permissionsForRole(user.role)])).filter(
              (permission) => ADMIN_PERMISSIONS.includes(permission),
            );
      return { ...user, permissions };
    });
  } catch {
    return DEFAULT_ADMIN_USERS;
  }
}

export function saveAdminUsers(users: AdminUser[]) {
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export const PERMISSION_ROUTE: Record<AdminPermission, string> = {
  dashboard: "/admin/dashboard",
  pages: "/admin/content",
  content: "/admin/content",
  services: "/admin/services",
  why: "/admin/why",
  trust: "/admin/trust",
  team: "/admin/team",
  fleet: "/admin/fleet",
  blog: "/admin/blog",
  gallery: "/admin/gallery",
  testimonials: "/admin/testimonials",
  faq: "/admin/faq",
  messages: "/admin/messages",
  seo: "/admin/seo",
  settings: "/admin/settings",
  users: "/admin/users",
};

export function isSuperAdmin(user: AdminUser | null | undefined) {
  return user?.role === "super_admin" && Boolean(user.active);
}

export function canManageUser(actor: AdminUser | null | undefined, target: AdminUser) {
  if (!isSuperAdmin(actor)) return false;
  // Only Super Admin may manage accounts; non-super actors never reach here via UI.
  void target;
  return true;
}

export function countActiveSuperAdmins(users: AdminUser[]) {
  return users.filter((user) => user.role === "super_admin" && user.active).length;
}

export function canDeleteUser(
  actor: AdminUser | null | undefined,
  target: AdminUser,
  users: AdminUser[],
) {
  if (!isSuperAdmin(actor)) return false;
  if (actor?.id === target.id) return false;
  if (target.role === "super_admin" && countActiveSuperAdmins(users) <= 1) return false;
  return true;
}

export function canChangeUserRole(
  actor: AdminUser | null | undefined,
  target: AdminUser,
  nextRole: AdminRoleId,
  users: AdminUser[],
) {
  if (!isSuperAdmin(actor)) return false;
  if (
    target.role === "super_admin" &&
    nextRole !== "super_admin" &&
    countActiveSuperAdmins(users) <= 1
  ) {
    return false;
  }
  if (actor?.id === target.id && nextRole !== "super_admin") return false;
  return true;
}
