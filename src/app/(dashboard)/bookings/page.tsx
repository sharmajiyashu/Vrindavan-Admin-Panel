"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconSearch,
  IconReload,
  IconReceipt2,
  IconChevronRight,
  IconChevronLeft,
  IconLoader2,
  IconCalendar,
  IconClock,
  IconCircleCheck,
  IconCircleX,
  IconCircleDotted,
  IconExternalLink,
  IconX,
  IconSettings,
  IconPlus,
  IconUsers,
  IconDownload,
  IconAlertCircle,
} from "@tabler/icons-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as XLSX from "xlsx";
import { bookingService, Booking, PaginatedBookingResponse } from "@/lib/services/bookingService";
import { tourService } from "@/lib/services/tourService";
import { couponService } from "@/lib/services/couponService";
import { userService } from "@/lib/services/userService";
import { BookingDetails } from "@/components/bookings/BookingDetails";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";

export default function BookingsPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>(["all"]);
  const [paymentStatusFilters, setPaymentStatusFilters] = useState<string[]>(["all"]);
  const [tourFilter, setTourFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [createdByAdminFilter, setCreatedByAdminFilter] = useState("all");
  const [slotTimeFilter, setSlotTimeFilter] = useState("all");
  const [createdDate, setCreatedDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // States for Admin Booking Creation Form
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createTourId, setCreateTourId] = useState("");
  const [createBookingDate, setCreateBookingDate] = useState("");
  const [createSlotId, setCreateSlotId] = useState("");
  const [createSlot, setCreateSlot] = useState("");
  const [createName, setCreateName] = useState("");
  const [createMobile, setCreateMobile] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPersonCount, setCreatePersonCount] = useState(1);
  const [createCustomPrice, setCreateCustomPrice] = useState("");
  const [createCouponCode, setCreateCouponCode] = useState("");
  const [createPaymentStatus, setCreatePaymentStatus] = useState("pending");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Helper setter functions to reset page on filter change
  const handleStatusFilterChange = (status: string) => {
    if (status === "all") {
      setStatusFilters(["all"]);
    } else {
      let newFilters = statusFilters.includes("all") ? [] : [...statusFilters];
      if (newFilters.includes(status)) {
        newFilters = newFilters.filter(s => s !== status);
        if (newFilters.length === 0) newFilters = ["all"];
      } else {
        newFilters.push(status);
      }
      setStatusFilters(newFilters);
    }
    setPage(1);
  };
  const handlePaymentStatusFilterChange = (status: string) => {
    if (status === "all") {
      setPaymentStatusFilters(["all"]);
    } else {
      let newFilters = paymentStatusFilters.includes("all") ? [] : [...paymentStatusFilters];
      if (newFilters.includes(status)) {
        newFilters = newFilters.filter(s => s !== status);
        if (newFilters.length === 0) newFilters = ["all"];
      } else {
        newFilters.push(status);
      }
      setPaymentStatusFilters(newFilters);
    }
    setPage(1);
  };
  const handleSearchTermChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
  };
  const handleTourFilterChange = (val: string) => {
    setTourFilter(val);
    setSlotTimeFilter("all");
    setPage(1);
  };
  const handleSlotTimeFilterChange = (val: string) => {
    setSlotTimeFilter(val);
    setPage(1);
  };
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setPage(1);
  };
  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setPage(1);
  };
  const handleCreatedDateChange = (val: string) => {
    setCreatedDate(val);
    setPage(1);
  };
  const handleCreatedByAdminFilterChange = (val: string) => {
    setCreatedByAdminFilter(val);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilters(["all"]);
    setPaymentStatusFilters(["all"]);
    setTourFilter("all");
    setStartDate("");
    setEndDate("");
    setCreatedByAdminFilter("all");
    setSlotTimeFilter("all");
    setCreatedDate("");
    setPage(1);
  };

  const isAnyFilterActive =
    searchTerm !== "" ||
    !(statusFilters.length === 1 && statusFilters[0] === "all") ||
    !(paymentStatusFilters.length === 1 && paymentStatusFilters[0] === "all") ||
    tourFilter !== "all" ||
    startDate !== "" ||
    endDate !== "" ||
    createdByAdminFilter !== "all" ||
    slotTimeFilter !== "all" ||
    createdDate !== "";

  // Fetch all tours for dropdown list
  const { data: toursData } = useQuery({
    queryKey: ["tours-list"],
    queryFn: () => tourService.listTours(),
  });

  const allTours = toursData?.tours || [];

  // Fetch all slots for selected tour to see which dates have active slots
  const { data: tourSlotsAll } = useQuery({
    queryKey: ["tour-slots-all", createTourId],
    queryFn: () => tourService.getSlots(Number(createTourId)),
    enabled: !!createTourId,
  });

  const activeSlotDates = useMemo(() => {
    if (!tourSlotsAll) return [];
    return Array.from(
      new Set(
        tourSlotsAll
          .filter((s: any) => s.isActive && !s.isCancelled)
          .map((s: any) => s.date)
      )
    );
  }, [tourSlotsAll]);

  const { data: slotsData, isLoading: isLoadingSlots } = useQuery({
    queryKey: ["tour-slots-admin", createTourId, createBookingDate],
    queryFn: () => tourService.getSlots(Number(createTourId), createBookingDate),
    enabled: !!createTourId && !!createBookingDate,
  });

  const allToursList = toursData?.tours || [];

  const selectedCreateTour = allToursList.find((t: any) => t.id === Number(createTourId));
  const isPrivateTour = selectedCreateTour?.type === "private";

  const slotsList = slotsData || [];

  const { data: filterTourSlotsData } = useQuery({
    queryKey: ["tour-slots-filter", tourFilter],
    queryFn: () => tourService.getSlots(Number(tourFilter)),
    enabled: tourFilter !== "all",
  });

  const availableSlotTimesForFilter = useMemo(() => {
    if (!filterTourSlotsData) return [];
    return Array.from(new Set(filterTourSlotsData.map((s: any) => s.startTime))).sort();
  }, [filterTourSlotsData]);

  const { data, isLoading } = useQuery<PaginatedBookingResponse>({
    queryKey: ["bookings", page, limit, statusFilters.join(","), paymentStatusFilters.join(","), searchTerm, tourFilter, startDate, endDate, createdByAdminFilter, slotTimeFilter, createdDate],
    queryFn: () =>
      bookingService.listBookings(
        page,
        limit,
        statusFilters.includes("all") ? undefined : statusFilters.join(","),
        searchTerm,
        tourFilter === "all" ? undefined : Number(tourFilter),
        startDate || undefined,
        endDate || undefined,
        createdByAdminFilter === "admin" ? true : (createdByAdminFilter === "user" ? false : undefined),
        slotTimeFilter === "all" ? undefined : slotTimeFilter,
        createdDate || undefined,
        paymentStatusFilters.includes("all") ? undefined : paymentStatusFilters.join(",")
      ),
  });

  const { data: bookingDetail, isLoading: isLoadingDetail } = useQuery<Booking>({
    queryKey: ["booking", selectedBookingId],
    queryFn: () => bookingService.getBooking(selectedBookingId!),
    enabled: !!selectedBookingId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: string; reason?: string }) => {
      if (status === "cancelled") return bookingService.cancelBooking(id, reason || "");
      if (status === "completed") return bookingService.completeBooking(id);
      return bookingService.updateStatus(id, status, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", selectedBookingId] });
      toast.success("Booking updated successfully");
      setIsCancelDialogOpen(false);
      setSelectedReason("");
      setOtherReason("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update booking");
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Booking> }) => {
      return bookingService.updateBooking(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", selectedBookingId] });
      toast.success("Payment collected successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update payment status");
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: (payload: any) => bookingService.createBookingAdmin(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking created successfully");
      setIsCreateDialogOpen(false);
      // Reset form
      setCreateTourId("");
      setCreateBookingDate("");
      setCreateSlotId("");
      setCreateSlot("");
      setCreateName("");
      setCreateMobile("");
      setCreateEmail("");
      setCreatePersonCount(1);
      setCreateCustomPrice("");
      setCreateCouponCode("");
      setCreatePaymentStatus("pending");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create booking");
    },
  });

  const { data: suggestionsCoupons } = useQuery({
    queryKey: ["coupons-suggest", createCouponCode],
    queryFn: () => couponService.listCoupons(1, 10, createCouponCode),
    enabled: createCouponCode.length > 0 && showSuggestions,
  });

  const { data: suggestionsUsers } = useQuery({
    queryKey: ["users-suggest", createCouponCode],
    queryFn: () => userService.listUsers(1, 10, createCouponCode),
    enabled: createCouponCode.length > 0 && showSuggestions,
  });

  const suggestedCodes = useMemo(() => {
    if (!createCouponCode) return [];
    const codes: string[] = [];
    if (suggestionsCoupons?.coupons) {
      codes.push(...suggestionsCoupons.coupons.map((c: any) => c.code));
    }
    if (suggestionsUsers?.users) {
      codes.push(
        ...suggestionsUsers.users
          .filter((u: any) => u.referralCode && u.referralCode.toLowerCase().includes(createCouponCode.toLowerCase()))
          .map((u: any) => u.referralCode)
      );
    }
    return Array.from(new Set(codes));
  }, [suggestionsCoupons, suggestionsUsers, createCouponCode]);

  const isCouponValid = !createCouponCode || suggestedCodes.includes(createCouponCode);

  const calculatedBasePrice = selectedCreateTour ? selectedCreateTour.price * (isPrivateTour ? 1 : createPersonCount) : 0;
  const originalPrice = createCustomPrice ? Number(createCustomPrice) : calculatedBasePrice;

  const selectedCoupon = suggestionsCoupons?.coupons?.find((c: any) => c.code === createCouponCode);
  const selectedReferralUser = suggestionsUsers?.users?.find((u: any) => u.referralCode === createCouponCode);

  let discountAmount = 0;
  let discountType = "";
  let discountDescription = "";

  if (selectedCoupon && isCouponValid && createCouponCode) {
    if (selectedCoupon.discountType === 'flat') {
      discountAmount = selectedCoupon.discountValue;
      discountDescription = `Flat ₹${selectedCoupon.discountValue}`;
    } else if (selectedCoupon.discountType === 'percentage') {
      discountAmount = (originalPrice * selectedCoupon.discountValue) / 100;
      discountDescription = `${selectedCoupon.discountValue}%`;
    }
    discountType = "Coupon";
  } else if (selectedReferralUser && isCouponValid && createCouponCode) {
    discountAmount = 0;
    discountType = "Referral";
    discountDescription = "Valid Referral (Reward to Referrer)";
  }

  const finalPrice = Math.max(0, originalPrice - discountAmount);

  const handleDownloadExcel = async () => {
    try {
      setIsExporting(true);
      const loadingToast = toast.loading("Fetching data for export...");

      // Fetch with a large limit to get all filtered records
      const response = await bookingService.listBookings(
        1,
        10000,
        statusFilters.includes("all") ? undefined : statusFilters.join(","),
        searchTerm,
        tourFilter === "all" ? undefined : Number(tourFilter),
        startDate || undefined,
        endDate || undefined,
        createdByAdminFilter === "admin" ? true : (createdByAdminFilter === "user" ? false : undefined),
        slotTimeFilter === "all" ? undefined : slotTimeFilter,
        createdDate || undefined,
        paymentStatusFilters.includes("all") ? undefined : paymentStatusFilters.join(",")
      );

      toast.dismiss(loadingToast);

      if (!response.bookings || response.bookings.length === 0) {
        toast.info("No bookings found to export");
        return;
      }

      // Format data for Excel
      const excelData = response.bookings.map((b: any) => ({
        "Booking ID": b.bookingId || `#${b.id}`,
        "Customer Name": b.contacts?.[0]?.name || b.user?.name || "N/A",
        "Mobile": b.contacts?.[0]?.mobile || b.user?.mobile || "N/A",
        "Email": b.contacts?.[0]?.email || b.user?.email || "N/A",
        "Tour": b.tour?.titleEn || "N/A",
        "Date": b.bookingDate,
        "Time Slot": b.slot,
        "Persons": b.personCount,
        "Total Price (Rs)": b.totalPrice,
        "Status": b.status.toUpperCase(),
        "Created By": b.createdByAdmin ? "Admin" : "User App",
        "Created At": new Date(b.createdAt).toLocaleString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Bookings_Export_${dateStr}.xlsx`;

      XLSX.writeFile(workbook, filename);
      toast.success("Export successful!");
    } catch (error: any) {
      toast.error("Failed to export data: " + (error.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  const bookings = data?.bookings || [];
  const pagination = data?.pagination;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "upcoming":
        return <IconClock size={12} strokeWidth={2.5} />;
      case "pending":
        return <IconClock size={12} strokeWidth={2.5} />;
      case "completed":
        return <IconCircleCheck size={14} className="text-emerald-500" />;
      case "cancelled":
        return <IconCircleX size={14} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "pending":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "completed":
        return "bg-emerald-50 text-emerald-600 ring-emerald-500/10";
      case "cancelled":
        return "bg-red-50 text-red-600 ring-red-500/10";
      default:
        return "bg-gray-50 text-gray-600 ring-gray-500/10";
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="space-y-0.5">
          <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
              <IconReceipt2 size={18} />
            </div>
            {t("bookings.title")}
          </h1>
          <p className="text-[11px] font-bold text-muted-foreground/60 pl-10.5 uppercase tracking-wider">
            {t("bookings.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto ml-auto">
          <button
            onClick={handleDownloadExcel}
            disabled={isExporting}
            className="h-10 px-4 rounded-xl bg-emerald-500 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-500/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isExporting ? <IconLoader2 size={14} className="animate-spin" /> : <IconDownload size={14} />}
            Download Excel
          </button>

          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="h-10 px-4 rounded-xl bg-primary text-[10px] font-black uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <IconPlus size={14} />
            Create Booking
          </button>

          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["bookings"] })}
            className="inline-flex h-10 w-10 min-w-[40px] items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:bg-muted shadow-sm"
          >
            <IconReload className={twMerge("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Unified Filter Controls Panel */}
      <div className="rounded-[2rem] border border-border bg-card/50 p-6 shadow-sm space-y-4 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 lg:pb-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mr-2 whitespace-nowrap">Booking Status:</span>
              {["all", "upcoming", "completed", "cancelled"].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilterChange(status)}
                  className={twMerge(
                    "h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    statusFilters.includes(status)
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-card text-muted-foreground border border-border hover:bg-muted"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 lg:pb-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mr-2 whitespace-nowrap">Payment Status:</span>
              {[{ label: "All", value: "all" }, { label: "Pending", value: "pending" }, { label: "Completed", value: "success" }, { label: "Failed", value: "failed" }].map((status) => (
                <button
                  key={status.value}
                  onClick={() => handlePaymentStatusFilterChange(status.value)}
                  className={twMerge(
                    "h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    paymentStatusFilters.includes(status.value)
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-card text-muted-foreground border border-border hover:bg-muted"
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Term and Clear Button */}
          <div className="flex flex-1 items-center gap-3 justify-end max-w-xl">
            <div className="relative group flex-1">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5">
                <IconSearch className="h-3.5 w-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search by ID, User, Mobile, Tour name..."
                value={searchTerm}
                onChange={(e) => handleSearchTermChange(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-card/50 pl-10 pr-4 text-[11px] font-bold shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none placeholder:text-muted-foreground/20"
              />
            </div>
            {isAnyFilterActive && (
              <button
                onClick={handleClearFilters}
                className="h-10 px-4 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                <IconX size={14} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Second row: Additional filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-6 gap-4 pt-4 border-t border-border/40">
          {/* Tour Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Tour Filter
            </label>
            <select
              value={tourFilter}
              onChange={(e) => handleTourFilterChange(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-card px-3 text-[11px] font-bold shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none cursor-pointer"
            >
              <option value="all">All Tours</option>
              {allTours.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.titleEn}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Start Slot Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-card px-3 text-[11px] font-bold shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              End Slot Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-card px-3 text-[11px] font-bold shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none"
              />
            </div>
          </div>

          {/* Created By Filter */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Created By
            </label>
            <select
              value={createdByAdminFilter}
              onChange={(e) => handleCreatedByAdminFilterChange(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-card px-3 text-[11px] font-bold shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="admin">Admin Only</option>
              <option value="user">User App Only</option>
            </select>
          </div>

          {/* Slot Time Filter */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Slot Time
            </label>
            <select
              value={slotTimeFilter}
              onChange={(e) => handleSlotTimeFilterChange(e.target.value)}
              disabled={tourFilter === "all"}
              className="w-full h-10 rounded-xl border border-border bg-card px-3 text-[11px] font-bold shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="all">All Slots</option>
              {availableSlotTimesForFilter.map((time: string) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            {tourFilter === "all" && (
              <p className="text-[8px] text-muted-foreground ml-1">Select a tour first</p>
            )}
          </div>

          {/* Booking Created Date */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Booking Created On
            </label>
            <div className="relative">
              <input
                type="date"
                value={createdDate}
                onChange={(e) => handleCreatedDateChange(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-card px-3 text-[11px] font-bold shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="rounded-[2.5rem] border border-border bg-card p-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("bookings.loading")}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <div className="h-16 w-16 rounded-3xl bg-muted/30 flex items-center justify-center text-muted-foreground">
              <IconReceipt2 size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-foreground">{t("bookings.noBookings")}</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">No bookings found matching your filters.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/60 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-4 py-4">Customer</th>
                  <th className="px-4 py-4">{t("bookings.tour")}</th>
                  <th className="px-4 py-4">{t("bookings.date")}</th>
                  <th className="px-4 py-4">{t("bookings.personCount")}</th>
                  <th className="px-4 py-4">{t("bookings.totalPrice")}</th>
                  <th className="px-4 py-4">Created By</th>
                  <th className="px-4 py-4">Payment Status</th>
                  <th className="px-4 py-4">{t("bookings.status")}</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {bookings.map((booking: Booking) => (
                  <tr key={booking.id} className="group transition-all hover:bg-muted/20">
                    <td className="px-6 py-4 text-xs font-black text-foreground/80">
                      {booking.bookingId || `#${booking.id}`}
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground leading-tight">
                          {booking.contacts?.[0]?.name || booking.user?.name || "N/A"}
                        </p>
                        <p className="truncate text-[9px] font-bold text-muted-foreground/40 mt-1 tracking-wider uppercase">
                          {(() => {
                            const mobile = booking.contacts?.[0]?.mobile || booking.user?.mobile;
                            if (!mobile) return "N/A";
                            if (mobile.startsWith("9191") && mobile.length >= 14) return `+91 ${mobile.slice(4)}`;
                            if (mobile.startsWith("91") && mobile.length === 12) return `+91 ${mobile.slice(2)}`;
                            return mobile;
                          })()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground leading-tight">
                          {booking.tour?.titleEn}
                        </p>
                        <p className="truncate text-[9px] font-bold text-primary/60 mt-1 tracking-wider uppercase">
                          {booking.slot}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground/80">
                        <IconCalendar size={13} className="text-muted-foreground/30" />
                        <span className="text-xs font-bold">{booking.bookingDate}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground/80">
                        <IconUsers size={13} className="text-muted-foreground/30" />
                        <span className="text-xs font-bold">{booking.personCount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-black text-foreground">₹{booking.totalPrice}</p>
                    </td>
                    <td className="px-4 py-4">
                      {booking.createdByAdmin ? (
                        <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-purple-600 ring-1 ring-inset ring-purple-500/10">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-blue-600 ring-1 ring-inset ring-blue-500/10">
                          User App
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={twMerge(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ring-1 ring-inset",
                        booking.paymentStatus === "success" ? "bg-emerald-50 text-emerald-600 ring-emerald-500/10" :
                          booking.paymentStatus === "pending" ? "bg-amber-50 text-amber-600 ring-amber-500/10" :
                            "bg-red-50 text-red-600 ring-red-500/10"
                      )}>
                        {booking.paymentStatus === "success" ? "Completed" : booking.paymentStatus === "failed" ? "Refund" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className={twMerge(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                        getStatusClasses(booking.status)
                      )}>
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedBookingId(booking.id);
                          setIsDetailOpen(true);
                        }}
                        className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
                      >
                        <IconExternalLink size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-6 border-t border-border/40">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="h-9 w-9 rounded-xl border border-border flex items-center justify-center bg-card text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                  >
                    <IconChevronLeft size={16} />
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="h-9 w-9 rounded-xl border border-border flex items-center justify-center bg-card text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                  >
                    <IconChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog.Root open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-5xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-[2.5rem] bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none">
            <div className="flex items-center justify-between mb-8">
              <Dialog.Title className="text-2xl font-black tracking-tight flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <IconReceipt2 size={20} />
                </div>
                {t("bookings.details")}
              </Dialog.Title>
              <div className="flex items-center gap-3">
                {bookingDetail && (
                  <div className="flex items-center gap-3">
                    {["upcoming", "pending"].includes(bookingDetail.status) && (
                      <>
                        {bookingDetail.createdByAdmin && bookingDetail.paymentStatus === "pending" && (
                          <button
                            onClick={() => updateBookingMutation.mutate({ id: bookingDetail.id, data: { paymentStatus: "success" } })}
                            disabled={updateBookingMutation.isPending}
                            className="h-10 px-4 rounded-xl bg-primary text-[10px] font-black uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                          >
                            {updateBookingMutation.isPending && <IconLoader2 size={14} className="animate-spin" />}
                            Payment Collected
                          </button>
                        )}
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: bookingDetail.id, status: "completed" })}
                          disabled={updateStatusMutation.isPending || bookingDetail.paymentStatus !== "success"}
                          className="h-10 px-4 rounded-xl bg-emerald-500 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-500/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={bookingDetail.paymentStatus !== "success" ? "Payment must be completed first" : ""}
                        >
                          {updateStatusMutation.isPending && <IconLoader2 size={14} className="animate-spin" />}
                          Complete
                        </button>
                        <button
                          onClick={() => setIsCancelDialogOpen(true)}
                          disabled={updateStatusMutation.isPending}
                          className="h-10 px-4 rounded-xl bg-red-500 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-red-500/20 hover:opacity-90 active:scale-95 transition-all"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                )}
                <Dialog.Close className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90">
                  <IconX size={20} />
                </Dialog.Close>
              </div>
            </div>

            {isLoadingDetail ? (
              <div className="flex h-96 flex-col items-center justify-center gap-3">
                <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("common.loading")}</p>
              </div>
            ) : bookingDetail ? (
              <BookingDetails booking={bookingDetail} />
            ) : (
              <div className="flex h-96 flex-col items-center justify-center gap-3 text-muted-foreground">
                <IconSettings size={40} strokeWidth={1} />
                <p className="text-sm font-bold opacity-40">Failed to load booking details.</p>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Cancellation Modal */}
      <Dialog.Root open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-[70] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-[2.5rem] bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none border border-border">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                <IconCircleX size={32} />
              </div>
              <div className="space-y-2">
                <Dialog.Title className="text-2xl font-black tracking-tight">{t("bookings.cancelTitle")}</Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground max-w-xs">{t("bookings.cancelSubtitle")}</Dialog.Description>
              </div>

              <div className="w-full space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Cancellation Reason
                  </label>
                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-full h-12 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-bold transition-all focus:border-red-500 focus:ring-4 focus:ring-red-500/5 outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>{t("bookings.cancelReasonPlaceholder")}</option>
                    <option value={t("bookings.reasons.plans")}>{t("bookings.reasons.plans")}</option>
                    <option value={t("bookings.reasons.health")}>{t("bookings.reasons.health")}</option>
                    <option value={t("bookings.reasons.mistake")}>{t("bookings.reasons.mistake")}</option>
                    <option value={t("bookings.reasons.timing")}>{t("bookings.reasons.timing")}</option>
                    <option value="other">{t("bookings.reasons.other")}</option>
                  </select>
                </div>

                {selectedReason === "other" && (
                  <textarea
                    placeholder={t("bookings.otherReason")}
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    className="w-full min-h-[100px] rounded-2xl border border-border bg-muted/20 p-4 text-xs font-bold transition-all focus:border-red-500 focus:ring-4 focus:ring-red-500/5 outline-none placeholder:text-muted-foreground/30"
                  />
                )}

                {bookingDetail && !bookingDetail.createdByAdmin && (
                  <div className="flex items-start gap-2.5 p-4 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 text-left">
                    <IconAlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-amber-600">
                      Post Cancellation money to be automatically credited back to original payment mode
                    </p>
                  </div>
                )}

                {bookingDetail && bookingDetail.createdByAdmin && (
                  <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 text-red-700 border border-red-100 text-left">
                    <IconAlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-red-600">
                      If Cash - You are about to cancel the Booking - Pls manually Refund any cash money taken from the Customer
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-4">
                <button
                  onClick={() => setIsCancelDialogOpen(false)}
                  className="h-12 rounded-2xl border border-border bg-card text-xs font-black uppercase tracking-wider text-muted-foreground hover:bg-muted transition-all active:scale-95"
                >
                  {t("bookings.keepTrip")}
                </button>
                <button
                  onClick={() => {
                    if (!selectedReason) {
                      toast.warning("Please select a reason");
                      return;
                    }
                    const finalReason = selectedReason === "other" ? otherReason : selectedReason;
                    if (selectedBookingId) updateStatusMutation.mutate({ id: selectedBookingId, status: "cancelled", reason: finalReason });
                  }}
                  disabled={updateStatusMutation.isPending || (selectedReason === "other" && !otherReason.trim())}
                  className="h-12 rounded-2xl bg-red-500 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-500/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {updateStatusMutation.isPending ? <IconLoader2 size={16} className="animate-spin" /> : <IconCircleX size={16} />}
                  {t("bookings.confirmCancel")}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Create Booking Dialog */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-[2.5rem] bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none border border-border">
            <div className="flex items-center justify-between mb-8">
              <Dialog.Title className="text-2xl font-black tracking-tight flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <IconReceipt2 size={20} />
                </div>
                Create Booking
              </Dialog.Title>
              <Dialog.Close className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90">
                <IconX size={20} />
              </Dialog.Close>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!createTourId || !createBookingDate || !createName || !createMobile || !createPersonCount) {
                  toast.warning("Please fill in all required fields.");
                  return;
                }
                if (createBookingDate && !activeSlotDates.includes(createBookingDate)) {
                  toast.error("Please choose a date with active slots.");
                  return;
                }
                const selectedSlotObj = slotsList.find((s: any) => s.id === Number(createSlotId));
                createBookingMutation.mutate({
                  tourId: Number(createTourId),
                  bookingDate: createBookingDate,
                  slotId: createSlotId ? Number(createSlotId) : undefined,
                  slot: selectedSlotObj ? selectedSlotObj.startTime : (createSlot || "8:00 AM"),
                  name: createName,
                  mobile: createMobile,
                  email: createEmail || undefined,
                  personCount: createPersonCount,
                  totalPrice: createCustomPrice ? Number(createCustomPrice) : undefined,
                  couponCode: createCouponCode || undefined,
                  paymentStatus: createPaymentStatus,
                });
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Customer Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-muted/10 px-4 text-xs font-bold transition-all focus:border-primary outline-none"
                    placeholder="Enter name"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={createMobile}
                    onChange={(e) => setCreateMobile(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-muted/10 px-4 text-xs font-bold transition-all focus:border-primary outline-none"
                    placeholder="Enter 10-digit mobile"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-muted/10 px-4 text-xs font-bold transition-all focus:border-primary outline-none"
                    placeholder="Enter email address"
                  />
                </div>

                {/* Tour Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Select Tour *
                  </label>
                  <select
                    required
                    value={createTourId}
                    onChange={(e) => {
                      setCreateTourId(e.target.value);
                      setCreateSlotId("");
                      setCreateBookingDate("");
                    }}
                    className="w-full h-11 rounded-xl border border-border bg-muted/10 px-4 text-xs font-bold transition-all focus:border-primary outline-none cursor-pointer"
                  >
                    <option value="" disabled>Select a tour</option>
                    {allTours.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.titleEn}</option>
                    ))}
                  </select>
                </div>

                {/* Booking Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Booking Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={createBookingDate}
                    onChange={(e) => {
                      setCreateBookingDate(e.target.value);
                      setCreateSlotId("");
                    }}
                    className="w-full h-11 rounded-xl border border-border bg-muted/10 px-4 text-xs font-bold transition-all focus:border-primary outline-none"
                  />
                </div>

                {/* Slot Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Slot Timing *
                  </label>
                  {createTourId && createBookingDate ? (
                    createBookingDate && !activeSlotDates.includes(createBookingDate) ? (
                      <div className="h-11 rounded-xl border border-red-200 bg-red-50/50 flex items-center px-4 text-xs text-red-600 font-bold">
                        No active slots for this date
                      </div>
                    ) : isLoadingSlots ? (
                      <div className="h-11 rounded-xl border border-border bg-muted/5 flex items-center px-4 text-xs text-muted-foreground animate-pulse">
                        Loading slots...
                      </div>
                    ) : slotsList.length > 0 ? (
                      <select
                        required
                        value={createSlotId}
                        onChange={(e) => setCreateSlotId(e.target.value)}
                        className="w-full h-11 rounded-xl border border-border bg-muted/10 px-4 text-xs font-bold transition-all focus:border-primary outline-none cursor-pointer"
                      >
                        <option value="" disabled>Select a slot</option>
                        {slotsList.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.startTime} ({s.section})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="h-11 rounded-xl border border-red-200 bg-red-50/50 flex items-center px-4 text-xs text-red-600 font-bold">
                        No active slots for this date
                      </div>
                    )
                  ) : (
                    <div className="h-11 rounded-xl border border-border bg-muted/5 flex items-center px-4 text-xs text-muted-foreground italic">
                      Select tour and date first
                    </div>
                  )}
                </div>

                {/* Person Count or Tour Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    {isPrivateTour ? "Tour Type *" : "Person Count *"}
                  </label>
                  {isPrivateTour ? (
                    <div className="w-full h-11 rounded-xl border border-primary/20 bg-primary/5 flex items-center px-4 text-xs font-bold text-primary">
                      Private Tour
                    </div>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      required
                      value={createPersonCount}
                      onChange={(e) => setCreatePersonCount(Number(e.target.value))}
                      className="w-full h-11 rounded-xl border border-border bg-muted/10 px-4 text-xs font-bold transition-all focus:border-primary outline-none"
                    />
                  )}
                </div>

                {/* Custom Price (Override) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Override Price (Optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={createCustomPrice}
                    onChange={(e) => setCreateCustomPrice(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-muted/10 px-4 text-xs font-bold transition-all focus:border-primary outline-none"
                    placeholder="Defaults to Tour Price * Count"
                  />
                </div>

                {/* Coupon / Referral Code */}
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Coupon / Referral Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={createCouponCode}
                    onChange={(e) => {
                      setCreateCouponCode(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full h-11 rounded-xl border border-border bg-muted/10 px-4 text-xs font-bold transition-all focus:border-primary outline-none"
                    placeholder="Enter coupon or referral code"
                  />
                  {showSuggestions && createCouponCode.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 rounded-xl border border-border bg-card shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                      {suggestedCodes.length > 0 ? (
                        <div className="p-1.5 flex flex-col gap-1">
                          {suggestedCodes.map((code) => (
                            <button
                              key={code}
                              type="button"
                              onClick={() => {
                                setCreateCouponCode(code);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted text-xs font-bold transition-all"
                            >
                              {code}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          No matching codes
                        </div>
                      )}
                    </div>
                  )}
                  {!isCouponValid && (
                    <p className="text-[10px] font-bold text-red-500 ml-1">Please select a valid code from suggestions</p>
                  )}
                </div>

                {/* Payment Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Payment Status
                  </label>
                  <select
                    value={createPaymentStatus}
                    onChange={(e) => setCreatePaymentStatus(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-muted/10 px-4 text-xs font-bold transition-all focus:border-primary outline-none appearance-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="success">Completed</option>
                  </select>
                </div>
              </div>

              {/* Final Price Breakdown */}
              {selectedCreateTour && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                    Price Breakdown
                  </h4>
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                    <span>Original Price {createCustomPrice ? "(Custom)" : `(₹${selectedCreateTour.price} × ${isPrivateTour ? 1 : createPersonCount})`}</span>
                    <span>₹{originalPrice}</span>
                  </div>
                  {discountType && (
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-600">
                      <span>Discount ({discountType} - {discountDescription})</span>
                      <span>- ₹{discountAmount}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-border flex items-center justify-between text-sm font-black text-foreground">
                    <span>Final Total Price</span>
                    <span className="text-primary text-lg">₹{finalPrice}</span>
                  </div>
                </div>
              )}

              {createBookingDate && !activeSlotDates.includes(createBookingDate) && (
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-xs text-red-600 font-bold">
                  Warning: The selected date does not have any active slots. Bookings are only allowed on dates with active slots.
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Dialog.Close type="button" className="flex-1 h-12 rounded-xl border border-border bg-card text-xs font-black uppercase tracking-wider text-muted-foreground hover:bg-muted transition-all active:scale-95">
                  Cancel
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={createBookingMutation.isPending || (!!createBookingDate && !activeSlotDates.includes(createBookingDate)) || !isCouponValid}
                  className="flex-1 h-12 rounded-xl bg-primary text-xs font-black uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createBookingMutation.isPending && <IconLoader2 size={16} className="animate-spin" />}
                  Create Booking
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
