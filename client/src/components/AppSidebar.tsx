import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { useI18n } from "@/lib/i18n";
import { useUser, useAdmin } from "@/lib/store";
import {
  Home,
  Trophy,
  Users,
  User,
  Settings,
  LogIn,
  LogOut,
  Wallet,
  Calculator,
  Shuffle,
  CheckCircle,
} from "lucide-react";

export function AppSidebar() {
  const [location] = useLocation();
  const { t, language } = useI18n();
  const { isAuthenticated, logout } = useUser();
  const { isAdminAuthenticated } = useAdmin();

  const mainMenuItems = [
    { title: t("nav.home"), url: "/", icon: Home },
    { title: t("nav.results"), url: "/results", icon: Trophy },
    { title: language === "th" ? "คำนวณหวยชุด" : "Set Calculator", url: "/calculator", icon: Calculator },
    { title: language === "th" ? "หวยกลับ (Permutation)" : "Permutation", url: "/permutation", icon: Shuffle },
    { title: t("nav.affiliate"), url: "/affiliate", icon: Users },
  ];

  const userMenuItems = isAuthenticated
    ? [
        { title: t("nav.profile"), url: "/profile", icon: User },
        { title: language === "th" ? "ฝาก/ถอน" : "Deposit/Withdraw", url: "/wallet", icon: Wallet },
        { title: language === "th" ? "ตรวจรางวัล" : "Check Results", url: "/self-check", icon: CheckCircle },
      ]
    : [];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="block">
          <Logo size="md" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {userMenuItems.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {userMenuItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {isAdminAuthenticated && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/admin")}
                    >
                      <Link href="/admin">
                        <Settings className="h-4 w-4" />
                        <span>{t("nav.admin")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-4">
        <div className="flex items-center justify-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>

        {isAuthenticated ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t("nav.logout")}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/login" data-testid="link-login">
                <LogIn className="h-4 w-4 mr-2" />
                {t("nav.login")}
              </Link>
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
