"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import TextCard from "@/components/ui/TextCard";
import TextHierarchy from "@/components/ui/TextHierarchy";
import TextBadge from "@/components/ui/TextBadge";
import TextButton from "@/components/ui/TextButton";
import { supabase } from "@/lib/supabase/client";

interface LandingPage {
  id: string;
  title: string;
  subtitle: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LandingSection {
  id: string;
  landing_page_id: string;
  section_type: string;
  title: string;
  content: any;
  order_index: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

interface LandingPageWithSections extends LandingPage {
  sections: LandingSection[];
}

export default function LandingManagementPage() {
  const router = useRouter();
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [selectedPage, setSelectedPage] =
    useState<LandingPageWithSections | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPageModal, setShowPageModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [pageForm, setPageForm] = useState({
    title: "",
    subtitle: "",
    is_active: false,
  });
  const [sectionForm, setSectionForm] = useState({
    section_type: "custom",
    title: "",
    content: "{}",
    order_index: 0,
    is_visible: true,
  });
  const [editingSection, setEditingSection] = useState<LandingSection | null>(
    null
  );

  useEffect(() => {
    loadLandingPages();
  }, []);

  const loadLandingPages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("No session found");
        return;
      }

      const response = await fetch("/api/landing/manage", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load landing pages");
      }

      const data = await response.json();
      setLandingPages(data.landingPages || []);

      // Load first page details if available
      if (data.landingPages && data.landingPages.length > 0) {
        await loadPageDetails(data.landingPages[0].id);
      }
    } catch (error) {
      console.error("Error loading landing pages:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPageDetails = async (pageId: string) => {
    try {
      const { data, error } = await supabase
        .from("landing_pages")
        .select(
          `
          *,
          sections:landing_sections(*)
        `
        )
        .eq("id", pageId)
        .single();

      if (error) throw error;

      if (data) {
        // Sort sections by order_index
        const sortedSections = (data.sections || []).sort(
          (a: any, b: any) => a.order_index - b.order_index
        );

        setSelectedPage({
          ...data,
          sections: sortedSections,
        });
      }
    } catch (error) {
      console.error("Error loading page details:", error);
      setError("Failed to load page details");
    }
  };

  const handleCreatePage = async () => {
    try {
      setError(null);
      setSuccess(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("No session found");
        return;
      }

      const response = await fetch("/api/landing/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(pageForm),
      });

      if (!response.ok) {
        throw new Error("Failed to create landing page");
      }

      setSuccess("Landing page created successfully!");
      setShowPageModal(false);
      setPageForm({ title: "", subtitle: "", is_active: false });
      await loadLandingPages();
    } catch (error) {
      console.error("Error creating landing page:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleSetActive = async (pageId: string) => {
    try {
      setError(null);
      setSuccess(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("No session found");
        return;
      }

      const response = await fetch("/api/landing/manage", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id: pageId, setActive: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to set active landing page");
      }

      setSuccess("Active landing page updated!");
      await loadLandingPages();
    } catch (error) {
      console.error("Error setting active page:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm("Are you sure you want to delete this landing page?")) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("No session found");
        return;
      }

      const response = await fetch(`/api/landing/manage?id=${pageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete landing page");
      }

      setSuccess("Landing page deleted successfully!");
      await loadLandingPages();
    } catch (error) {
      console.error("Error deleting landing page:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleCreateSection = async () => {
    if (!selectedPage) return;

    try {
      setError(null);
      setSuccess(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("No session found");
        return;
      }

      // Parse content as JSON
      let parsedContent;
      try {
        parsedContent = JSON.parse(sectionForm.content);
      } catch (e) {
        setError("Invalid JSON in content field");
        return;
      }

      const response = await fetch("/api/landing/sections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          landing_page_id: selectedPage.id,
          ...sectionForm,
          content: parsedContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create section");
      }

      setSuccess("Section created successfully!");
      setShowSectionModal(false);
      setSectionForm({
        section_type: "custom",
        title: "",
        content: "{}",
        order_index: 0,
        is_visible: true,
      });
      await loadPageDetails(selectedPage.id);
    } catch (error) {
      console.error("Error creating section:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleUpdateSection = async () => {
    if (!editingSection) return;

    try {
      setError(null);
      setSuccess(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("No session found");
        return;
      }

      // Parse content as JSON
      let parsedContent;
      try {
        parsedContent = JSON.parse(sectionForm.content);
      } catch (e) {
        setError("Invalid JSON in content field");
        return;
      }

      const response = await fetch("/api/landing/sections", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: editingSection.id,
          ...sectionForm,
          content: parsedContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update section");
      }

      setSuccess("Section updated successfully!");
      setShowSectionModal(false);
      setEditingSection(null);
      setSectionForm({
        section_type: "custom",
        title: "",
        content: "{}",
        order_index: 0,
        is_visible: true,
      });

      if (selectedPage) {
        await loadPageDetails(selectedPage.id);
      }
    } catch (error) {
      console.error("Error updating section:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section?")) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("No session found");
        return;
      }

      const response = await fetch(`/api/landing/sections?id=${sectionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete section");
      }

      setSuccess("Section deleted successfully!");

      if (selectedPage) {
        await loadPageDetails(selectedPage.id);
      }
    } catch (error) {
      console.error("Error deleting section:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const openEditSection = (section: LandingSection) => {
    setEditingSection(section);
    setSectionForm({
      section_type: section.section_type,
      title: section.title,
      content: JSON.stringify(section.content, null, 2),
      order_index: section.order_index,
      is_visible: section.is_visible,
    });
    setShowSectionModal(true);
  };

  return (
    <>
      <PageLayout
        title="LANDING PAGE MANAGEMENT"
        subtitle="Customize Your Landing Page"
      >
        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 border-2 border-red-500 bg-red-50">
            <TextHierarchy level={1} className="text-red-700">
              ❌ {error}
            </TextHierarchy>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 border-2 border-green-500 bg-green-50">
            <TextHierarchy level={1} className="text-green-700">
              ✅ {success}
            </TextHierarchy>
          </div>
        )}

        {/* Landing Pages List */}
        <TextCard title="LANDING PAGES">
          <div className="flex justify-between items-center mb-4">
            <TextHierarchy level={1} emphasis>
              ALL PAGES ({landingPages.length})
            </TextHierarchy>
            <TextButton
              onClick={() => setShowPageModal(true)}
              variant="success"
            >
              CREATE PAGE
            </TextButton>
          </div>

          <div className="space-y-3">
            {landingPages.map((page) => (
              <div
                key={page.id}
                className={`border-2 p-4 ${
                  page.is_active
                    ? "border-green-500 bg-green-50"
                    : "border-black bg-white"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <TextHierarchy level={1} emphasis>
                      {page.title}
                    </TextHierarchy>
                    <TextHierarchy level={2} muted>
                      {page.subtitle}
                    </TextHierarchy>
                  </div>
                  <div className="flex gap-2 items-center">
                    {page.is_active && (
                      <TextBadge variant="success">ACTIVE</TextBadge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <TextButton
                    onClick={() => loadPageDetails(page.id)}
                    variant="default"
                    className="text-xs"
                  >
                    VIEW SECTIONS
                  </TextButton>
                  {!page.is_active && (
                    <TextButton
                      onClick={() => handleSetActive(page.id)}
                      variant="success"
                      className="text-xs"
                    >
                      SET ACTIVE
                    </TextButton>
                  )}
                  <TextButton
                    onClick={() => handleDeletePage(page.id)}
                    variant="error"
                    className="text-xs"
                  >
                    DELETE
                  </TextButton>
                </div>
              </div>
            ))}
          </div>
        </TextCard>

        {/* Sections Management */}
        {selectedPage && (
          <TextCard title={`SECTIONS - ${selectedPage.title}`}>
            <div className="flex justify-between items-center mb-4">
              <TextHierarchy level={1} emphasis>
                SECTIONS ({selectedPage.sections.length})
              </TextHierarchy>
              <TextButton
                onClick={() => {
                  setEditingSection(null);
                  setSectionForm({
                    section_type: "custom",
                    title: "",
                    content: "{}",
                    order_index: selectedPage.sections.length,
                    is_visible: true,
                  });
                  setShowSectionModal(true);
                }}
                variant="success"
              >
                ADD SECTION
              </TextButton>
            </div>

            <div className="space-y-3">
              {selectedPage.sections.map((section, index) => (
                <div
                  key={section.id}
                  className="border-2 border-black p-4 bg-white"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <TextBadge variant="default" className="text-xs">
                          #{section.order_index}
                        </TextBadge>
                        <TextBadge variant="muted" className="text-xs">
                          {section.section_type}
                        </TextBadge>
                        {!section.is_visible && (
                          <TextBadge variant="warning" className="text-xs">
                            HIDDEN
                          </TextBadge>
                        )}
                      </div>
                      <TextHierarchy level={1} emphasis>
                        {section.title}
                      </TextHierarchy>
                      <TextHierarchy level={2} muted className="mt-1">
                        {JSON.stringify(section.content).substring(0, 100)}...
                      </TextHierarchy>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <TextButton
                      onClick={() => openEditSection(section)}
                      variant="default"
                      className="text-xs"
                    >
                      EDIT
                    </TextButton>
                    <TextButton
                      onClick={() => handleDeleteSection(section.id)}
                      variant="error"
                      className="text-xs"
                    >
                      DELETE
                    </TextButton>
                  </div>
                </div>
              ))}
            </div>
          </TextCard>
        )}

        <TextCard variant="muted">
          <TextHierarchy level={2} muted>
            Create and manage landing pages for your application. Only one page
            can be active at a time. Each page can have multiple sections with
            different types and content.
          </TextHierarchy>
        </TextCard>
      </PageLayout>

      {/* Create Page Modal */}
      {showPageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-black p-6 max-w-lg w-full mx-4">
            <TextHierarchy level={1} emphasis className="mb-4">
              CREATE LANDING PAGE
            </TextHierarchy>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono mb-1">TITLE</label>
                <input
                  type="text"
                  value={pageForm.title}
                  onChange={(e) =>
                    setPageForm({ ...pageForm, title: e.target.value })
                  }
                  className="w-full border-2 border-black p-2 font-mono"
                  placeholder="ONBOARDING"
                />
              </div>

              <div>
                <label className="block text-sm font-mono mb-1">SUBTITLE</label>
                <input
                  type="text"
                  value={pageForm.subtitle}
                  onChange={(e) =>
                    setPageForm({ ...pageForm, subtitle: e.target.value })
                  }
                  className="w-full border-2 border-black p-2 font-mono"
                  placeholder="Developer Integration System"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pageForm.is_active}
                  onChange={(e) =>
                    setPageForm({ ...pageForm, is_active: e.target.checked })
                  }
                  className="border-2 border-black"
                />
                <label className="text-sm font-mono">SET AS ACTIVE PAGE</label>
              </div>

              <div className="flex gap-2 justify-end">
                <TextButton
                  onClick={() => {
                    setShowPageModal(false);
                    setPageForm({ title: "", subtitle: "", is_active: false });
                  }}
                  variant="default"
                >
                  CANCEL
                </TextButton>
                <TextButton onClick={handleCreatePage} variant="success">
                  CREATE
                </TextButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-black p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <TextHierarchy level={1} emphasis className="mb-4">
              {editingSection ? "EDIT SECTION" : "CREATE SECTION"}
            </TextHierarchy>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono mb-1">
                  SECTION TYPE
                </label>
                <select
                  value={sectionForm.section_type}
                  onChange={(e) =>
                    setSectionForm({
                      ...sectionForm,
                      section_type: e.target.value,
                    })
                  }
                  className="w-full border-2 border-black p-2 font-mono"
                >
                  <option value="hero">Hero</option>
                  <option value="welcome">Welcome</option>
                  <option value="features">Features</option>
                  <option value="process">Process</option>
                  <option value="cta">Call to Action</option>
                  <option value="info">Information</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-mono mb-1">TITLE</label>
                <input
                  type="text"
                  value={sectionForm.title}
                  onChange={(e) =>
                    setSectionForm({ ...sectionForm, title: e.target.value })
                  }
                  className="w-full border-2 border-black p-2 font-mono"
                  placeholder="WELCOME"
                />
              </div>

              <div>
                <label className="block text-sm font-mono mb-1">
                  CONTENT (JSON)
                </label>
                <textarea
                  value={sectionForm.content}
                  onChange={(e) =>
                    setSectionForm({ ...sectionForm, content: e.target.value })
                  }
                  className="w-full border-2 border-black p-2 font-mono text-sm"
                  rows={10}
                  placeholder='{"text": "Welcome message"}'
                />
              </div>

              <div>
                <label className="block text-sm font-mono mb-1">
                  ORDER INDEX
                </label>
                <input
                  type="number"
                  value={sectionForm.order_index}
                  onChange={(e) =>
                    setSectionForm({
                      ...sectionForm,
                      order_index: parseInt(e.target.value),
                    })
                  }
                  className="w-full border-2 border-black p-2 font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sectionForm.is_visible}
                  onChange={(e) =>
                    setSectionForm({
                      ...sectionForm,
                      is_visible: e.target.checked,
                    })
                  }
                  className="border-2 border-black"
                />
                <label className="text-sm font-mono">VISIBLE</label>
              </div>

              <div className="flex gap-2 justify-end">
                <TextButton
                  onClick={() => {
                    setShowSectionModal(false);
                    setEditingSection(null);
                    setSectionForm({
                      section_type: "custom",
                      title: "",
                      content: "{}",
                      order_index: 0,
                      is_visible: true,
                    });
                  }}
                  variant="default"
                >
                  CANCEL
                </TextButton>
                <TextButton
                  onClick={
                    editingSection ? handleUpdateSection : handleCreateSection
                  }
                  variant="success"
                >
                  {editingSection ? "UPDATE" : "CREATE"}
                </TextButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
