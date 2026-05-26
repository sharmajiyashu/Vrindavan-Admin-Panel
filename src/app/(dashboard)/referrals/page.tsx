"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconDownload,
  IconSettings,
  IconPhone,
  IconMail,
  IconCreditCard,
  IconHistory,
  IconUser,
  IconChevronRight,
  IconId,
  IconArrowUpRight,
  IconCurrencyRupee,
  IconClock,
  IconUsersGroup,
  IconReload,
  IconLoader2,
  IconEdit,
  IconX,
  IconShieldCheck,
  IconBrandWhatsapp,
  IconEye,
  IconBuildingBank,
  IconWallet,
  IconTrash
} from "@tabler/icons-react";
import { referralService, Referee, RefereeDetails } from "@/lib/services/referralService";
import { useTranslations } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { toast } from "react-toastify";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import * as XLSX from "xlsx";
import Link from "next/link";

export default function ReferralManagement() {
  const { t } = useTranslations();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"lifetime_earned" | "name">("lifetime_earned");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // State for Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [addRefereeForm, setAddRefereeForm] = useState({
    name: "",
    extension: "91",
    mobile: "",
    aadhaarNumber: "",
    referralCode: "",
    paymentDetails: {
      upiId: "",
      bankName: "",
      accountNumber: "",
      ifscCode: ""
    }
  });

  const [editRefereeForm, setEditRefereeForm] = useState<any>(null);
  const [selectedRefereeId, setSelectedRefereeId] = useState<number | null>(null);

  const [configForm, setConfigForm] = useState<any>({
    supportPhone: "",
    supportEmail: "",
    supportWhatsApp: "",
    minPayoutAmount: 100,
    infoEn: "",
    infoHi: "",
    howToEarnEn: "",
    howToEarnHi: "",
    itinerary: []
  });

  const { data: referees, isLoading } = useQuery({
    queryKey: ["referees", search, eligibleOnly, sortBy, order],
    queryFn: () => referralService.listReferees({ search, eligibleOnly, sortBy, order }),
  });


  const { data: config } = useQuery({
    queryKey: ["referralConfig"],
    queryFn: () => referralService.getConfig(),
  });

  React.useEffect(() => {
    if (config) {
      setConfigForm({
        supportPhone: config.supportPhone || "",
        supportEmail: config.supportEmail || "",
        supportWhatsApp: config.supportWhatsApp || "",
        minPayoutAmount: config.minPayoutAmount || 100,
        infoEn: config.infoEn || "",
        infoHi: config.infoHi || "",
        howToEarnEn: config.howToEarnEn || "",
        howToEarnHi: config.howToEarnHi || "",
        itinerary: config.itinerary || []
      });
    }
  }, [config]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: referralService.createReferee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referees"] });
      toast.success("Referee added successfully");
      setIsAddModalOpen(false);
      setAddRefereeForm({
        name: "",
        extension: "91",
        mobile: "",
        aadhaarNumber: "",
        referralCode: "",
        paymentDetails: { upiId: "", bankName: "", accountNumber: "", ifscCode: "" }
      });
    },
    onError: (error: any) => toast.error(error.message || "Failed to add referee"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => referralService.updateReferee(editRefereeForm.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referees"] });
      toast.success("Referee updated successfully");
      setIsEditModalOpen(false);
      setEditRefereeForm(null);
    },
    onError: (error: any) => toast.error(error.message || "Failed to update referee"),
  });

  const creditMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => referralService.creditMoney(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referees"] });
      queryClient.invalidateQueries({ queryKey: ["refereeDetails", selectedRefereeId] });
      toast.success("Credit recorded successfully");
    },
    onError: (error: any) => toast.error(error.message || "Failed to record credit"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      referralService.updateReferee(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referees"] });
      queryClient.invalidateQueries({ queryKey: ["refereeDetails", selectedRefereeId] });
      toast.success("Status updated successfully");
    },
    onError: (error: any) => toast.error(error.message || "Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => referralService.deleteReferee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referees"] });
      toast.success("Partner deleted successfully");
    },
    onError: (error: any) => toast.error(error.message || "Failed to delete partner"),
  });

  const exportToExcel = () => {
    if (!referees) return;
    const data = referees.map(r => ({
      Name: r.name,
      Phone: r.mobile,
      "Coupon Code": r.referralCode,
      "Lifetime Earned": r.lifetimeEarned,
      "Pending Money": r.pendingEarned,
      "Current Balance": r.currentEarned,
      "Total Paid Out": r.totalPaidOut,
      "Tours Referred": r.bookingCount
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Referees");
    XLSX.writeFile(wb, "Referees_Report.xlsx");
  };

  const labelClasses = "text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 mb-1.5 block";
  const inputClasses = "h-12 w-full rounded-2xl border border-border bg-muted/20 px-4 text-sm font-bold transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none placeholder:text-muted-foreground/30";

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header - Aligned with User Management */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="space-y-0.5">
          <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
              <IconUsersGroup size={18} />
            </div>
            {t("referrals.title")}
          </h1>
          <p className="text-[11px] font-bold text-muted-foreground/60 pl-10.5 uppercase tracking-wider">
            {t("referrals.subtitle")}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 max-w-4xl ml-auto">
          <div className="relative group flex-1 max-w-xs">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5">
              <IconSearch className="h-3.5 w-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-card/50 pl-10 pr-4 text-[11px] font-bold shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none placeholder:text-muted-foreground/20"
            />
          </div>

          <button
            onClick={() => setEligibleOnly(!eligibleOnly)}
            className={twMerge(
              "h-10 px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm",
              eligibleOnly ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-card border-border text-muted-foreground hover:bg-muted"
            )}
          >
            <IconFilter size={14} />
            Eligible (₹100+)
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="h-10 w-10 flex items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-all shadow-sm"
              title="Configuration"
            >
              <IconSettings size={18} />
            </button>
            <button
              onClick={exportToExcel}
              className="h-10 w-10 flex items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-all shadow-sm"
              title="Export to Excel"
            >
              <IconDownload size={18} />
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="h-10 px-5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
            >
              <IconPlus size={16} />
              Add Referee
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - User Management Style Table */}
      <div className="rounded-[2.5rem] border border-border bg-card p-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("referrals.loading")}</p>
          </div>
        ) : referees?.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <div className="h-16 w-16 rounded-3xl bg-muted/30 flex items-center justify-center text-muted-foreground">
              <IconUser size={32} />
            </div>
            <p className="text-base font-bold text-foreground">{t("referrals.noReferees")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/60 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                  <th className="px-6 py-4">Partner Info</th>
                  <th className="px-4 py-4">Coupon Code</th>
                  <th className="px-4 py-4">Referred</th>
                  <th className="px-4 py-4 text-emerald-600/80">Current Bal</th>
                  <th className="px-4 py-4">Lifetime</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {referees?.map((ref) => (
                  <tr key={ref.id} className="group transition-all hover:bg-muted/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground">
                          {ref.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-foreground leading-tight">{ref.name}</p>
                          <p className="truncate text-[10px] font-medium text-muted-foreground/70 tracking-wide mt-1">
                            {ref.mobile}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 text-primary border border-primary/10">
                        <span className="text-[10px] font-black tracking-widest uppercase">{ref.referralCode}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-bold text-foreground">{ref.bookingCount} Tours</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className={twMerge(
                        "text-xs font-black",
                        ref.currentEarned >= 100 ? "text-emerald-600" : "text-foreground/80"
                      )}>
                        ₹{ref.currentEarned.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-bold text-muted-foreground">₹{ref.lifetimeEarned.toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatusMutation.mutate({ id: ref.id, isActive: !ref.isActive });
                        }}
                        className={twMerge(
                          "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                          ref.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                        )}
                      >
                        {ref.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/referrals/${ref.id}`}
                          title="View Details"
                          className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
                        >
                          <IconEye size={16} />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const fullMobile = ref.mobile || "";
                            const ext = fullMobile.length > 10 ? fullMobile.substring(0, fullMobile.length - 10) : "91";
                            const mob = fullMobile.length > 10 ? fullMobile.substring(fullMobile.length - 10) : fullMobile;
                            setEditRefereeForm({
                              id: ref.id,
                              name: ref.name,
                              extension: ext,
                              mobile: mob,
                              aadhaarNumber: ref.aadhaarNumber || "",
                              referralCode: ref.referralCode,
                              isActive: ref.isActive,
                              paymentDetails: {
                                upiId: ref.paymentDetails?.upiId || "",
                                bankName: ref.paymentDetails?.bankName || "",
                                accountNumber: ref.paymentDetails?.accountNumber || "",
                                ifscCode: ref.paymentDetails?.ifscCode || ""
                              }
                            });
                            setIsEditModalOpen(true);
                          }}
                          title="Edit Profile"
                          className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-all hover:bg-emerald-600 hover:text-white active:scale-95"
                        >
                          <IconEdit size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Are you sure you want to delete this partner? This action cannot be undone.")) {
                              deleteMutation.mutate(ref.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          title="Delete Partner"
                          className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-card text-red-500 shadow-sm ring-1 ring-border transition-all hover:bg-red-500 hover:text-white active:scale-95 disabled:opacity-50"
                        >
                          {deleteMutation.isPending ? <IconLoader2 size={16} className="animate-spin" /> : <IconTrash size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Referee Modal - User Management Style */}
      <Dialog.Root open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-[2.5rem] bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none border border-border h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-8 shrink-0">
              <Dialog.Title className="text-2xl font-black tracking-tight flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <IconPlus size={20} />
                </div>
                New Referee
              </Dialog.Title>
              <Dialog.Close className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90">
                <IconX size={20} />
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-none">
              <form className="space-y-8" id="add-referee-form" onSubmit={(e) => {
                e.preventDefault();

                if (!addRefereeForm.name.trim()) return toast.error("Name is required");
                if (!addRefereeForm.mobile.trim()) return toast.error("Mobile number is required");

                const code = addRefereeForm.referralCode.trim();
                if (code && (code !== code.toUpperCase() || code.includes(" "))) {
                  return toast.error("Referral code must be uppercase and have no spaces");
                }

                createMutation.mutate(addRefereeForm);
              }}>
                {/* Basic Info */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className={labelClasses}>Partner Name</label>
                      <input
                        name="name"
                        required
                        placeholder="Full Name"
                        className={inputClasses}
                        value={addRefereeForm.name}
                        onChange={(e) => setAddRefereeForm({ ...addRefereeForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <label className={labelClasses}>Phone Number</label>
                      <div className="flex gap-2">
                        <input
                          name="extension"
                          required
                          placeholder="91"
                          className={twMerge(inputClasses, "w-20 px-2 text-center")}
                          value={addRefereeForm.extension}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setAddRefereeForm({ ...addRefereeForm, extension: val });
                          }}
                        />
                        <input
                          name="mobile"
                          required
                          placeholder="Mobile Number"
                          className={inputClasses}
                          value={addRefereeForm.mobile}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setAddRefereeForm({ ...addRefereeForm, mobile: val });
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClasses}>Aadhaar (Optional)</label>
                      <input
                        name="aadhaarNumber"
                        placeholder="ID Number"
                        className={inputClasses}
                        value={addRefereeForm.aadhaarNumber}
                        onChange={(e) => setAddRefereeForm({ ...addRefereeForm, aadhaarNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClasses}>Custom Code</label>
                      <input
                        name="referralCode"
                        placeholder="GIFT2024"
                        className={twMerge(inputClasses, "uppercase")}
                        value={addRefereeForm.referralCode}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/\s/g, "");
                          setAddRefereeForm({ ...addRefereeForm, referralCode: val });
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Payment Details</h4>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className={labelClasses}>UPI ID</label>
                      <input
                        placeholder="name@upi"
                        className={inputClasses}
                        value={addRefereeForm.paymentDetails.upiId}
                        onChange={(e) => setAddRefereeForm({
                          ...addRefereeForm,
                          paymentDetails: { ...addRefereeForm.paymentDetails, upiId: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClasses}>Bank Name</label>
                      <input
                        placeholder="HDFC Bank"
                        className={inputClasses}
                        value={addRefereeForm.paymentDetails.bankName}
                        onChange={(e) => setAddRefereeForm({
                          ...addRefereeForm,
                          paymentDetails: { ...addRefereeForm.paymentDetails, bankName: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClasses}>Account Number</label>
                      <input
                        placeholder="0000 0000 0000"
                        className={inputClasses}
                        value={addRefereeForm.paymentDetails.accountNumber}
                        onChange={(e) => setAddRefereeForm({
                          ...addRefereeForm,
                          paymentDetails: { ...addRefereeForm.paymentDetails, accountNumber: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClasses}>IFSC Code</label>
                      <input
                        placeholder="HDFC000123"
                        className={inputClasses}
                        value={addRefereeForm.paymentDetails.ifscCode}
                        onChange={(e) => setAddRefereeForm({
                          ...addRefereeForm,
                          paymentDetails: { ...addRefereeForm.paymentDetails, ifscCode: e.target.value.toUpperCase() }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="pt-8 flex gap-3 shrink-0">
              <Dialog.Close asChild>
                <button type="button" className="flex-1 h-12 rounded-2xl border border-border text-xs font-black uppercase tracking-wider text-muted-foreground hover:bg-muted transition-all active:scale-95">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                form="add-referee-form"
                disabled={createMutation.isPending}
                className="flex-[2] h-12 rounded-2xl bg-primary text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {createMutation.isPending ? <IconLoader2 size={16} className="animate-spin" /> : <IconShieldCheck size={16} />}
                Add Partner
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Modal */}
      <Dialog.Root open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-[2.5rem] bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none border border-border h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-8 shrink-0">
              <Dialog.Title className="text-2xl font-black tracking-tight flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <IconEdit size={20} />
                </div>
                Edit Referee
              </Dialog.Title>
              <Dialog.Close className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90">
                <IconX size={20} />
              </Dialog.Close>
            </div>

            {editRefereeForm && (
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-none">
                <form className="space-y-8" id="edit-referee-form" onSubmit={(e) => {
                  e.preventDefault();
                  if (!editRefereeForm.name.trim()) return toast.error("Name is required");
                  if (!editRefereeForm.mobile.trim()) return toast.error("Mobile number is required");
                  updateMutation.mutate(editRefereeForm);
                }}>
                  {/* Basic Info */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Basic Information</h4>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className={labelClasses}>Partner Name</label>
                        <input
                          required
                          className={inputClasses}
                          value={editRefereeForm.name}
                          onChange={(e) => setEditRefereeForm({ ...editRefereeForm, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5 col-span-2 sm:col-span-1">
                        <label className={labelClasses}>Phone Number</label>
                        <div className="flex gap-2">
                          <input
                            required
                            placeholder="91"
                            className={twMerge(inputClasses, "w-20 px-2 text-center")}
                            value={editRefereeForm.extension || "91"}
                            onChange={(e) => setEditRefereeForm({ ...editRefereeForm, extension: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                          />
                          <input
                            required
                            className={inputClasses}
                            value={editRefereeForm.mobile}
                            onChange={(e) => setEditRefereeForm({ ...editRefereeForm, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClasses}>Aadhaar (Optional)</label>
                        <input
                          className={inputClasses}
                          value={editRefereeForm.aadhaarNumber}
                          onChange={(e) => setEditRefereeForm({ ...editRefereeForm, aadhaarNumber: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClasses}>Referral Code</label>
                        <input
                          className={twMerge(inputClasses, "uppercase")}
                          value={editRefereeForm.referralCode}
                          onChange={(e) => setEditRefereeForm({ ...editRefereeForm, referralCode: e.target.value.toUpperCase().replace(/\s/g, "") })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Payment Details</h4>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className={labelClasses}>UPI ID</label>
                        <input
                          className={inputClasses}
                          value={editRefereeForm.paymentDetails.upiId}
                          onChange={(e) => setEditRefereeForm({
                            ...editRefereeForm,
                            paymentDetails: { ...editRefereeForm.paymentDetails, upiId: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClasses}>Bank Name</label>
                        <input
                          className={inputClasses}
                          value={editRefereeForm.paymentDetails.bankName}
                          onChange={(e) => setEditRefereeForm({
                            ...editRefereeForm,
                            paymentDetails: { ...editRefereeForm.paymentDetails, bankName: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClasses}>Account Number</label>
                        <input
                          className={inputClasses}
                          value={editRefereeForm.paymentDetails.accountNumber}
                          onChange={(e) => setEditRefereeForm({
                            ...editRefereeForm,
                            paymentDetails: { ...editRefereeForm.paymentDetails, accountNumber: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClasses}>IFSC Code</label>
                        <input
                          className={inputClasses}
                          value={editRefereeForm.paymentDetails.ifscCode}
                          onChange={(e) => setEditRefereeForm({
                            ...editRefereeForm,
                            paymentDetails: { ...editRefereeForm.paymentDetails, ifscCode: e.target.value.toUpperCase() }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            <div className="pt-8 flex gap-3 shrink-0">
              <Dialog.Close asChild>
                <button type="button" className="flex-1 h-12 rounded-2xl border border-border text-xs font-black uppercase tracking-wider text-muted-foreground hover:bg-muted transition-all active:scale-95">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                form="edit-referee-form"
                disabled={updateMutation.isPending}
                className="flex-[2] h-12 rounded-2xl bg-emerald-600 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-600/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {updateMutation.isPending ? <IconLoader2 size={16} className="animate-spin" /> : <IconShieldCheck size={16} />}
                Update Partner
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Config Modal - User Management Style */}

      {/* Config Modal - User Management Style */}
      <Dialog.Root open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-[2.5rem] bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none border border-border h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <Dialog.Title className="text-2xl font-black tracking-tight flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <IconSettings size={20} />
                </div>
                Referral Configuration
              </Dialog.Title>
              <Dialog.Close className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90">
                <IconX size={20} />
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-none">
              <form className="space-y-8" id="referral-config-form" onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await referralService.updateConfig(configForm);
                  queryClient.invalidateQueries({ queryKey: ["referralConfig"] });
                  toast.success("Configuration updated successfully");
                  setIsConfigModalOpen(false);
                } catch (error: any) {
                  toast.error(error.message || "Failed to update configuration");
                }
              }}>
                {/* Contact & Payout Settings */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/45">Basic Contact & Payout Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={labelClasses}>Support Phone</label>
                      <input
                        value={configForm.supportPhone}
                        onChange={(e) => setConfigForm({ ...configForm, supportPhone: e.target.value })}
                        placeholder="+91 12345 67890"
                        className={inputClasses}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClasses}>Support Email</label>
                      <input
                        value={configForm.supportEmail}
                        onChange={(e) => setConfigForm({ ...configForm, supportEmail: e.target.value })}
                        placeholder="support@vrindavan.com"
                        className={inputClasses}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClasses}>Support WhatsApp</label>
                      <input
                        value={configForm.supportWhatsApp}
                        onChange={(e) => setConfigForm({ ...configForm, supportWhatsApp: e.target.value })}
                        placeholder="+91 12345 67890"
                        className={inputClasses}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClasses}>Min Payout (₹)</label>
                      <input
                        type="number"
                        value={configForm.minPayoutAmount}
                        onChange={(e) => setConfigForm({ ...configForm, minPayoutAmount: Number(e.target.value) })}
                        className={inputClasses}
                      />
                    </div>
                  </div>
                </div>

                {/* Dashboard Information Text */}
                <div className="space-y-5">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/45">Dashboard Info Text</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={labelClasses}>Info Description (English)</label>
                      <textarea
                        value={configForm.infoEn}
                        onChange={(e) => setConfigForm({ ...configForm, infoEn: e.target.value })}
                        placeholder="Welcome info shown to referee in English"
                        rows={3}
                        className={twMerge(inputClasses, "h-auto py-3 resize-none")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClasses}>Info Description (Hindi)</label>
                      <textarea
                        value={configForm.infoHi}
                        onChange={(e) => setConfigForm({ ...configForm, infoHi: e.target.value })}
                        placeholder="Welcome info shown to referee in Hindi"
                        rows={3}
                        className={twMerge(inputClasses, "h-auto py-3 resize-none")}
                      />
                    </div>
                  </div>
                </div>

                {/* How to Earn Section */}
                <div className="space-y-5">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/45">How to Earn Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={labelClasses}>How to Earn (English)</label>
                      <textarea
                        value={configForm.howToEarnEn}
                        onChange={(e) => setConfigForm({ ...configForm, howToEarnEn: e.target.value })}
                        placeholder="Steps on how to earn in English"
                        rows={3}
                        className={twMerge(inputClasses, "h-auto py-3 resize-none")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClasses}>How to Earn (Hindi)</label>
                      <textarea
                        value={configForm.howToEarnHi}
                        onChange={(e) => setConfigForm({ ...configForm, howToEarnHi: e.target.value })}
                        placeholder="Steps on how to earn in Hindi"
                        rows={3}
                        className={twMerge(inputClasses, "h-auto py-3 resize-none")}
                      />
                    </div>
                  </div>
                </div>

                {/* Itinerary Steps */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/45">Referral Process / Itinerary Steps</h4>
                    <button
                      type="button"
                      onClick={() => setConfigForm((prev: any) => ({
                        ...prev,
                        itinerary: [...(prev.itinerary || []), { titleEn: "", titleHi: "", descriptionEn: "", descriptionHi: "" }]
                      }))}
                      className="px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <IconPlus size={12} />
                      Add Step
                    </button>
                  </div>

                  {(!configForm.itinerary || configForm.itinerary.length === 0) ? (
                    <p className="text-center py-6 text-[11px] font-bold text-muted-foreground/40 uppercase tracking-wider bg-muted/10 rounded-2xl border border-dashed border-border/60">
                      No steps configured. Click Add Step to build your list.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {configForm.itinerary.map((step: any, index: number) => (
                        <div key={index} className="p-5 rounded-2xl bg-muted/20 border border-border flex flex-col gap-4 relative animate-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/15 px-2.5 py-1 rounded-lg">
                              Step {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => setConfigForm((prev: any) => ({
                                ...prev,
                                itinerary: prev.itinerary.filter((_: any, i: number) => i !== index)
                              }))}
                              className="h-8 w-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all"
                            >
                              <IconTrash size={14} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className={labelClasses}>Title (English)</label>
                              <input
                                value={step.titleEn}
                                onChange={(e) => {
                                  const list = [...configForm.itinerary];
                                  list[index].titleEn = e.target.value;
                                  setConfigForm({ ...configForm, itinerary: list });
                                }}
                                placeholder="e.g. Share Referral Code"
                                className={inputClasses}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className={labelClasses}>Title (Hindi)</label>
                              <input
                                value={step.titleHi}
                                onChange={(e) => {
                                  const list = [...configForm.itinerary];
                                  list[index].titleHi = e.target.value;
                                  setConfigForm({ ...configForm, itinerary: list });
                                }}
                                placeholder="e.g. अपना कोड साझा करें"
                                className={inputClasses}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className={labelClasses}>Description (English)</label>
                              <textarea
                                value={step.descriptionEn}
                                onChange={(e) => {
                                  const list = [...configForm.itinerary];
                                  list[index].descriptionEn = e.target.value;
                                  setConfigForm({ ...configForm, itinerary: list });
                                }}
                                placeholder="Details about this step in English"
                                rows={2}
                                className={twMerge(inputClasses, "h-auto py-2.5 resize-none")}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className={labelClasses}>Description (Hindi)</label>
                              <textarea
                                value={step.descriptionHi}
                                onChange={(e) => {
                                  const list = [...configForm.itinerary];
                                  list[index].descriptionHi = e.target.value;
                                  setConfigForm({ ...configForm, itinerary: list });
                                }}
                                placeholder="Details about this step in Hindi"
                                rows={2}
                                className={twMerge(inputClasses, "h-auto py-2.5 resize-none")}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="pt-6 flex gap-3 shrink-0">
              <Dialog.Close asChild>
                <button type="button" className="flex-1 h-12 rounded-2xl border border-border text-xs font-black uppercase tracking-wider text-muted-foreground hover:bg-muted transition-all active:scale-95">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                form="referral-config-form"
                className="flex-[2] h-12 rounded-2xl bg-primary text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Save Configuration
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
