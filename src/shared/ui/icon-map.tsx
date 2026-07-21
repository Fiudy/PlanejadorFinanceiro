import type {
  LucideIcon} from "lucide-react";
import {
  Wallet,
  Briefcase,
  PlusCircle,
  Home,
  Utensils,
  Car,
  HeartPulse,
  PartyPopper,
  Repeat,
  MoreHorizontal,
  PiggyBank,
  Plane,
  Building2,
  TrendingUp,
  CreditCard,
  Landmark
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  wallet: Wallet,
  briefcase: Briefcase,
  "plus-circle": PlusCircle,
  home: Home,
  utensils: Utensils,
  car: Car,
  "heart-pulse": HeartPulse,
  "party-popper": PartyPopper,
  repeat: Repeat,
  "more-horizontal": MoreHorizontal,
  "piggy-bank": PiggyBank,
  plane: Plane,
  building: Building2,
  "trending-up": TrendingUp,
  "credit-card": CreditCard,
  bank: Landmark,
};

export function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? MoreHorizontal;
}
