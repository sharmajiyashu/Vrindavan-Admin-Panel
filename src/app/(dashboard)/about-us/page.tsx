"use client";

import React, { useEffect, useState } from "react";
import { IconInfoCircle } from "@tabler/icons-react";
import { AboutUsForm } from "@/components/about-us/AboutUsForm";
import { aboutUsService, type AboutUs } from "@/lib/services/aboutUsService";
import { type AboutUsFormData } from "@/lib/validations/aboutUs";
import { toast } from "react-toastify";

export default function AboutUsPage() {
  const [data, setData] = useState<AboutUs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await aboutUsService.getAboutUs();
      setData(res);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load About Us data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: AboutUsFormData, file?: File) => {
    setSaving(true);
    try {
      await aboutUsService.upsertAboutUs(formData, file);
      toast.success("About Us updated successfully");
      fetchData(); // Refresh data
    } catch (error) {
      console.error(error);
      toast.error("Failed to update About Us");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <IconInfoCircle size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">About Us</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Manage the About Us section and social links for the app
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <AboutUsForm
          initialData={data}
          onSubmit={handleSubmit}
          isLoading={saving}
        />
      </div>
    </div>
  );
}
