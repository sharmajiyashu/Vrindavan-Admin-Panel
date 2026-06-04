"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconLoader2,
  IconShieldCheck,
  IconCreditCard,
  IconBuildingBank,
  IconWallet,
  IconHistory,
  IconUser,
  IconEdit,
  IconChevronRight,
  IconId,
  IconPhone,
  IconArrowUpRight,
  IconClock,
  IconDeviceFloppy,
  IconChecks,
  IconCurrencyRupee,
  IconRoute
} from "@tabler/icons-react";
import { referralService } from "@/lib/services/referralService";
import { useTranslations } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { toast } from "react-toastify";
import * as Tabs from "@radix-ui/react-tabs";

export default function RefereeDetailPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const refereeId = Number(id);

  // Queries
  const { data: details, isLoading } = useQuery({
    queryKey: ["refereeDetails", refereeId],
    queryFn: () => referralService.getRefereeDetails(refereeId),
    enabled: !!refereeId,
  });

  // Edit State
  const [editForm, setEditForm] = useState({
    name: "",
    extension: "91",
    mobile: "",
    aadhaarNumber: "",
    referralCode: "",
    isActive: true,
    paymentDetails: {
      upiId: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      isVerified: false
    }
  });

  useEffect(() => {
    if (details) {
      const fullMobile = details.referee.mobile || "";
      const ext = fullMobile.length > 10 ? fullMobile.substring(0, fullMobile.length - 10) : "91";
      const mob = fullMobile.length > 10 ? fullMobile.substring(fullMobile.length - 10) : fullMobile;
      setEditForm({
        name: details.referee.name || "",
        extension: ext,
        mobile: mob,
        aadhaarNumber: details.referee.aadhaarNumber || "",
        referralCode: details.referee.referralCode || "",
        isActive: details.referee.isActive,
        paymentDetails: {
          upiId: details.referee.paymentDetails?.upiId || "",
          bankName: details.referee.paymentDetails?.bankName || "",
          accountNumber: details.referee.paymentDetails?.accountNumber || "",
          ifscCode: details.referee.paymentDetails?.ifscCode || "",
          isVerified: details.referee.paymentDetails?.isVerified || false
        }
      });
    }
  }, [details]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (data: any) => referralService.updateReferee(refereeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referees"] });
      queryClient.invalidateQueries({ queryKey: ["refereeDetails", refereeId] });
      toast.success("Partner details updated successfully");
    },
    onError: (error: any) => toast.error(error.message || "Failed to update details"),
  });

  const settleMutation = useMutation({
    mutationFn: (data: { amount: number; paymentMethod: string }) =>
      referralService.creditMoney(refereeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refereeDetails", refereeId] });
      toast.success("Settle recorded successfully");
    },
    onError: (error: any) => toast.error(error.message || "Failed to settle"),
  });

  if (isLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <IconLoader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">Loading Partner Profile...</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <IconUser size={64} className="text-muted-foreground/20" />
        <p className="text-sm font-bold text-foreground">Partner not found</p>
        <button onClick={() => router.back()} className="text-xs font-black uppercase text-primary">Go Back</button>
      </div>
    );
  }

  const labelClasses = "text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 mb-1.5 block";
  const inputClasses = "h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm font-bold transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none placeholder:text-muted-foreground/30 disabled:opacity-50";

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="flex items-center gap-5">
          <button
            onClick={() => router.back()}
            className="h-12 w-12 rounded-2xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-primary transition-all active:scale-90"
          >
            <IconArrowLeft size={20} />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-foreground">{details.referee.name}</h1>
              <div className={twMerge(
                "px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                details.referee.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
              )}>
                {details.referee.isActive ? "Active" : "Inactive"}
              </div>
            </div>
            <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
              <IconPhone size={12} /> {details.referee.mobile} • <span className="text-primary/60">{details.referee.referralCode}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => updateMutation.mutate(editForm)}
          disabled={updateMutation.isPending}
          className="h-12 px-8 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
        >
          {updateMutation.isPending ? <IconLoader2 size={18} className="animate-spin" /> : <IconDeviceFloppy size={18} />}
          Save Changes
        </button>
      </div>

      <Tabs.Root defaultValue="overview" className="space-y-10">
        <Tabs.List className="flex border-b border-border/60 gap-10 px-2">
          {["Overview", "Edit Profile", "Earnings", "Payouts"].map(tab => (
            <Tabs.Trigger
              key={tab.toLowerCase()}
              value={tab.toLowerCase().replace(" ", "-")}
              className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all outline-none"
            >
              {tab}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="min-h-[500px]">
          <Tabs.Content value="overview" className="space-y-10 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { label: "Current Balance", value: `₹${details.summary.currentEarned.toLocaleString()}`, color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: IconWallet },
                { label: "Lifetime Earned", value: `₹${details.summary.lifetimeEarned.toLocaleString()}`, color: "bg-primary/5 text-primary border-primary/10", icon: IconCurrencyRupee },
                { label: "Pending Commissions", value: `₹${details.summary.pendingEarned.toLocaleString()}`, color: "bg-amber-50 text-amber-600 border-amber-100", icon: IconClock },
                { label: "Total Paid Out", value: `₹${details.summary.totalPaidOut.toLocaleString()}`, color: "bg-muted/30 text-muted-foreground border-border/60", icon: IconHistory },
                { label: "Lifetime Tours Referred", value: `${details.summary.lifetimeToursReferred || 0}`, color: "bg-blue-50 text-blue-600 border-blue-100", icon: IconRoute }
              ].map((stat, i) => (
                <div key={i} className={twMerge("p-8 rounded-[2.5rem] border space-y-4", stat.color)}>
                  <div className="h-10 w-10 rounded-xl bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-sm">
                    <stat.icon size={20} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{stat.label}</p>
                    <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Settle Section */}
              <div className="rounded-[2.5rem] border border-border bg-card p-10 space-y-8 shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <IconCreditCard className="text-primary" />
                    Settle Balance
                  </h3>
                  <p className="text-xs font-medium text-muted-foreground/60">Process manual payment to partner</p>
                </div>

                <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/20 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Payable Amount</p>
                    <p className="text-4xl font-black tracking-tighter">₹{details.summary.currentEarned.toLocaleString()}</p>
                  </div>
                  <button
                    disabled={details.summary.currentEarned < 100 || settleMutation.isPending}
                    onClick={() => {
                      const amount = details.summary.currentEarned;
                      if (window.confirm(`Mark ₹${amount} as paid?`)) {
                        settleMutation.mutate({ amount, paymentMethod: "Manual Settle" });
                      }
                    }}
                    className="h-14 px-10 rounded-[1.5rem] bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                  >
                    {settleMutation.isPending ? <IconLoader2 size={18} className="animate-spin" /> : "Settle Now"}
                  </button>
                </div>

                {details.summary.currentEarned < 100 && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 text-center bg-amber-50 py-3 rounded-xl border border-amber-100">
                    Minimum payout threshold is ₹100
                  </p>
                )}
              </div>

              {/* Verification Section */}
              <div className="rounded-[2.5rem] border border-border bg-card p-10 space-y-8 shadow-sm">
                <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <IconShieldCheck className="text-emerald-600" />
                  Verification Details
                </h3>

                <div className="space-y-5">
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/60">
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-2"><IconId size={16} /> Aadhaar ID</span>
                    <span className="text-xs font-black">{details.referee.aadhaarNumber || "NOT PROVIDED"}</span>
                  </div>
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/60">
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-2"><IconBuildingBank size={16} /> Bank Status</span>
                    <div className={twMerge(
                      "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                      details.referee.paymentDetails?.isVerified ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                      {details.referee.paymentDetails?.isVerified ? "Verified" : "Pending Verification"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="edit-profile" className="outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-[2.5rem] border border-border bg-card p-10 shadow-sm space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Profile Fields */}
                <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Profile Settings</h4>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-1.5">
                      <label className={labelClasses}>Full Name</label>
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className={inputClasses}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className={labelClasses}>Phone Number</label>
                        <div className="flex gap-2">
                          <input
                            placeholder="91"
                            value={editForm.extension || "91"}
                            onChange={(e) => setEditForm({ ...editForm, extension: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                            className={twMerge(inputClasses, "w-20 px-2 text-center")}
                          />
                          <input
                            value={editForm.mobile}
                            onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                            className={inputClasses}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClasses}>Custom Code</label>
                        <input
                          value={editForm.referralCode}
                          onChange={(e) => setEditForm({ ...editForm, referralCode: e.target.value.toUpperCase().replace(/\s/g, "") })}
                          className={twMerge(inputClasses, "uppercase")}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClasses}>Aadhaar Number</label>
                      <input
                        value={editForm.aadhaarNumber}
                        onChange={(e) => setEditForm({ ...editForm, aadhaarNumber: e.target.value })}
                        className={inputClasses}
                      />
                    </div>
                    <div className="pt-4 flex items-center justify-between p-6 rounded-3xl bg-muted/20 border border-border/60">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest">Active Status</p>
                        <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">If inactive, partner cannot login to app</p>
                      </div>
                      <button
                        onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                        className={twMerge(
                          "h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                          editForm.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                        )}
                      >
                        {editForm.isActive ? "Active" : "Inactive"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bank Fields */}
                <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Bank & Payout Details</h4>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-1.5">
                      <label className={labelClasses}>UPI ID</label>
                      <input
                        value={editForm.paymentDetails.upiId}
                        onChange={(e) => setEditForm({ ...editForm, paymentDetails: { ...editForm.paymentDetails, upiId: e.target.value } })}
                        className={inputClasses}
                        placeholder="username@bank"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClasses}>Bank Name</label>
                      <input
                        value={editForm.paymentDetails.bankName}
                        onChange={(e) => setEditForm({ ...editForm, paymentDetails: { ...editForm.paymentDetails, bankName: e.target.value } })}
                        className={inputClasses}
                        placeholder="e.g. State Bank of India"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClasses}>Account Number</label>
                      <input
                        value={editForm.paymentDetails.accountNumber}
                        onChange={(e) => setEditForm({ ...editForm, paymentDetails: { ...editForm.paymentDetails, accountNumber: e.target.value } })}
                        className={inputClasses}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClasses}>IFSC Code</label>
                      <input
                        value={editForm.paymentDetails.ifscCode}
                        onChange={(e) => setEditForm({ ...editForm, paymentDetails: { ...editForm.paymentDetails, ifscCode: e.target.value.toUpperCase() } })}
                        className={inputClasses}
                      />
                    </div>
                    <div className="pt-4 flex items-center justify-between p-6 rounded-3xl bg-muted/20 border border-border/60">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Verification Mark</p>
                        <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">Mark bank details as manually verified</p>
                      </div>
                      <button
                        onClick={() => setEditForm({ ...editForm, paymentDetails: { ...editForm.paymentDetails, isVerified: !editForm.paymentDetails.isVerified } })}
                        className={twMerge(
                          "h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                          editForm.paymentDetails.isVerified ? "bg-emerald-600 text-white border-emerald-600" : "bg-card text-muted-foreground border-border"
                        )}
                      >
                        {editForm.paymentDetails.isVerified ? "VERIFIED" : "UNVERIFIED"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="earnings" className="outline-none space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {details.earningHistory.length === 0 ? (
              <div className="py-32 flex flex-col items-center gap-4 text-center">
                <IconCurrencyRupee size={48} className="text-muted-foreground/10" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">No earnings tracked for this partner</p>
              </div>
            ) : (
              <div className="rounded-[2.5rem] border border-border bg-card overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/60 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 bg-muted/10">
                      <th className="px-8 py-5">Tour Detail</th>
                      <th className="px-8 py-5">Date</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5 text-right">Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {details.earningHistory.map((earn) => (
                      <tr key={earn.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                            <p className="text-xs font-black text-foreground">{earn.tourName}</p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold text-muted-foreground/50">
                              <span>Booking ID: #{earn.bookingId}</span>
                              <span>•</span>
                              <span>Customer: {earn.personName}</span>
                              <span>•</span>
                              <span className={twMerge(
                                "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border",
                                earn.tourType === "private" ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-blue-600 border-blue-100"
                              )}>
                                {earn.tourType === "private" ? "Private" : "Group"}
                              </span>
                            </div>
                            {earn.baseReferralAmount !== undefined && (
                              <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest mt-0.5">
                                Rate: {earn.tourType === "private"
                                  ? `₹${earn.baseReferralAmount} Flat`
                                  : `₹${earn.baseReferralAmount} × ${earn.personCount || 1} guest(s)`
                                }
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-[10px] font-bold text-muted-foreground">{format(new Date(earn.dateTime), "dd MMM yyyy, h:mm a")}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className={twMerge(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                            earn.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                          )}>
                            {earn.status === 'completed' ? <IconChecks size={12} /> : <IconClock size={12} />}
                            {earn.status}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <p className={twMerge("text-sm font-black", earn.status === 'completed' ? "text-emerald-600" : "text-amber-500")}>+₹{earn.referralAmount}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Tabs.Content>

          <Tabs.Content value="payouts" className="outline-none space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {details.creditedHistory.length === 0 ? (
              <div className="py-32 flex flex-col items-center gap-4 text-center">
                <IconHistory size={48} className="text-muted-foreground/10" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">No payout history found</p>
              </div>
            ) : (
              <div className="rounded-[2.5rem] border border-border bg-card overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/60 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 bg-muted/10">
                      <th className="px-8 py-5">Payment Method</th>
                      <th className="px-8 py-5">Date</th>
                      <th className="px-8 py-5">Transaction ID</th>
                      <th className="px-8 py-5 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {details.creditedHistory.map((pay) => (
                      <tr key={pay.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-8 py-6">
                          <p className="text-xs font-black text-foreground">{pay.paymentMethod}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-[10px] font-bold text-muted-foreground">{format(new Date(pay.createdAt), "dd MMM yyyy, h:mm a")}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-[10px] font-black tracking-widest text-muted-foreground/40">{pay.transactionId || "MANUAL_SETTLE"}</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <p className="text-sm font-black text-red-600">-₹{pay.amount}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
}
