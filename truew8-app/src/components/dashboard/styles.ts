import { Platform, StyleSheet } from "react-native";

import { theme } from "@/src/theme/tokens";

export const dashboardStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  contentWrap: {
    width: "100%",
    maxWidth: 1024,
    alignSelf: "center",
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  heroContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  hero: {
    flex: 2,
    flexBasis: 'auto',
    borderRadius: 20,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "#415975",
    gap: theme.spacing.sm,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#0E2340",
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(168deg, #112B4E 0%, #0D2341 64%, #0A1C34 100%)" as never,
      },
      default: {},
    }),
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    alignItems: "center",
    flexWrap: "wrap",
    zIndex: 3,
  },
  heroTopRowCompact: {
    alignItems: "stretch",
  },
  heroIdentityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1,
    minWidth: 260,
    flexWrap: "wrap",
  },
  heroLogoBadge: {
    flex: 1,
    flexBasis: 'auto',
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgb(201, 211, 224)",
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(168deg, #B0BEC5 0%, #CFD8DC 50%, #ECEFF1 100%)" as never,
      },
      default: {},
    }),
  },
  heroLogo: {
    width: 210,
    height: 160,
  },
  heroLogoMobile: {
    width: 262,
    height: 200,
  },
  heroTitleWrap: {
    flex: 1,
    gap: 2,
  },
  heroTitleWrapCompact: {
    alignItems: "center",
    width: "100%",
  },
  title: {
    color: "#EDF3FB",
    fontWeight: "800",
    fontSize: 28,
    textAlign: "center",
  },
  titleMobile: {
    fontSize: 24,
    textAlign: "center",
  },
  heroActionsRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    flexWrap: "wrap",
  },
  heroControlsColumn: {
    alignItems: "flex-end",
    gap: theme.spacing.xs,
    minWidth: 237,
  },
  heroControlsColumnCompact: {
    alignItems: "stretch",
    minWidth: 0,
  },
  heroActionButton: {
    minHeight: 38,
    borderRadius: 999,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    borderWidth: 1,
  },
  heroUserButton: {
    borderColor: "#294A75",
    backgroundColor: "#0F2D53",
  },
  localeMenuTrigger: {
    borderColor: "#294A75",
    backgroundColor: "#0F2D53",
  },
  localeMenuTriggerActive: {
    borderColor: "#E4BF72",
  },
  heroLogoutButton: {
    borderColor: "#294A75",
    backgroundColor: "#0F2D53",
  },
  heroActionLabel: {
    color: "#EDF3FB",
    fontWeight: "700",
    fontSize: 12,
  },
  localeFlag: {
    fontSize: 20,
    lineHeight: 20,
  },
  totalChip: {
    marginTop: theme.spacing.xs,
    borderRadius: 14,
    backgroundColor: "#0A1D38",
    borderWidth: 1,
    borderColor: "#C89E49",
    padding: theme.spacing.sm,
    gap: 4,
    zIndex: 3,
    width: '100%',
  },
  totalLabel: {
    color: "#E7C57A",
    fontSize: 12,
    fontWeight: "800",
  },
  totalValue: {
    color: "#E7C57A",
    fontWeight: "800",
    fontSize: 20,
  },
  popoverCard: {
    position: "absolute",
    minWidth: 196,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#94A8C5",
    backgroundColor: "#F8FBFF",
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow: "0 16px 34px rgba(14, 29, 49, 0.28)" as never,
      },
      default: {
        elevation: 11,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 9,
      },
    }),
  },
  localeMenuItem: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  localeMenuItemActive: {
    backgroundColor: "#EAF1FB",
  },
  localeMenuItemText: {
    color: "#173E6F",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  localeMenuItemTextActive: {
    color: "#102A52",
  },
  popoverRoot: {
    flex: 1,
    ...Platform.select({
      web: { position: "fixed" },
      default: {},
    }),
  },
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelTitle: {
    fontWeight: "800",
    color: theme.colors.textPrimary,
    fontSize: 18,
  },
  reload: {
    color: theme.colors.emerald,
    fontWeight: "700",
  },
  error: {
    color: theme.colors.danger,
    fontWeight: "700",
  },
  emptyWrap: {
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.textMuted,
  },
  portfolioCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#F8FBFF",
    borderRadius: 14,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  createPortfolioCard: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#8FA4C2",
    borderRadius: 14,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: "#F5F9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  createPortfolioCardText: {
    color: theme.colors.primary,
    fontWeight: "800",
    fontSize: 15,
  },
  portfolioTitle: {
    color: theme.colors.textPrimary,
    fontWeight: "800",
    fontSize: 16,
  },
  portfolioDesc: {
    color: theme.colors.textMuted,
  },
  portfolioMetaRow: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    color: theme.colors.textMuted,
    fontWeight: "600",
  },
  metaValue: {
    color: theme.colors.emerald,
    fontWeight: "800",
  },
  createDrawerRoot: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: {
        position: "fixed",
      },
      default: {},
    }),
  },
  createDrawerShell: {
    position: "absolute",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    zIndex: 30,
  },
  createDrawerShellDesktop: {
    right: 0,
    top: 0,
    height: "100%",
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  createDrawerShellMobile: {
    right: 0,
    left: 0,
    bottom: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  createDrawerShadowLeft: {
    shadowColor: "#000",
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.18,
    elevation: 10,
  },
  createDrawerShadowTop: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    elevation: 10,
  },
  createDrawerScroll: {
    flex: 1,
  },
  createDrawerContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  createDrawerTitle: {
    color: theme.colors.textPrimary,
    fontWeight: "800",
    fontSize: 18,
  },
  createDrawerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  userMenuContent: {
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
    width: 320,
  },
  userMenuTitle: {
    fontWeight: "800",
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
  userMenuEmail: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: theme.spacing.sm,
    minHeight: 42,
    backgroundColor: "#F7FAFF",
  },
  toggleText: {
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  switchPill: {
    borderRadius: 999,
    minWidth: 44,
    minHeight: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  switchPillOn: {
    backgroundColor: "#D8F2E6",
    borderColor: "#7BC9A6",
  },
  switchPillOff: {
    backgroundColor: "#ECEFF4",
    borderColor: "#BCC7D8",
  },
  switchText: {
    fontSize: 11,
    fontWeight: "800",
  },
  userMenuActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  userMenuActionButton: {
    flex: 1,
  },
});
