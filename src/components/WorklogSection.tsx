"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import TextCard from "@/components/ui/TextCard";
import TextButton from "@/components/ui/TextButton";
import TextHierarchy from "@/components/ui/TextHierarchy";
import TextBadge from "@/components/ui/TextBadge";
import Tooltip, { TooltipRef } from "@/components/ui/Tooltip";
import {
  Worklog,
  getUserWorklogs,
  createWorklog,
  updateWorklog,
  deleteWorklog,
} from "@/lib/supabase";

interface WorklogFormData {
  title: string;
  description: string;
  date: string;
  hours: string;
  project: string;
  category: string;
}

const CATEGORIES = [
  "Development",
  "Design",
  "Testing",
  "Documentation",
  "Meeting",
  "Research",
  "Other",
];

export default function WorklogSection() {
  const { user, userProfile } = useAuth();
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingWorklog, setEditingWorklog] = useState<Worklog | null>(null);
  const [filteredWorklogs, setFilteredWorklogs] = useState<Worklog[]>([]);
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
    quickFilter: "all", // 'all', 'today', 'week', 'month'
  });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [copySuccess, setCopySuccess] = useState("");
  const tooltipRef = useRef<TooltipRef>(null);

  const [formData, setFormData] = useState<WorklogFormData>({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    hours: "",
    project: "",
    category: "",
  });

  // Load worklogs
  useEffect(() => {
    if (user) {
      loadWorklogs();
    }
  }, [user]);

  // Filter worklogs when worklogs or dateFilter changes
  useEffect(() => {
    filterWorklogs();
  }, [worklogs, dateFilter]);

  const filterWorklogs = () => {
    let filtered = [...worklogs];

    if (dateFilter.quickFilter === "today") {
      const today = new Date().toISOString().split("T")[0];
      filtered = filtered.filter((worklog) => worklog.date === today);
    } else if (dateFilter.quickFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split("T")[0];
      filtered = filtered.filter((worklog) => worklog.date >= weekAgoStr);
    } else if (dateFilter.quickFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthAgoStr = monthAgo.toISOString().split("T")[0];
      filtered = filtered.filter((worklog) => worklog.date >= monthAgoStr);
    }

    if (dateFilter.startDate) {
      filtered = filtered.filter(
        (worklog) => worklog.date >= dateFilter.startDate
      );
    }

    if (dateFilter.endDate) {
      filtered = filtered.filter(
        (worklog) => worklog.date <= dateFilter.endDate
      );
    }

    setFilteredWorklogs(filtered);
  };

  const setQuickFilter = (filter: string) => {
    setDateFilter((prev) => ({
      ...prev,
      quickFilter: filter,
      startDate: "",
      endDate: "",
    }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 2000);
      // Close the tooltip after copying
      if (tooltipRef.current) {
        tooltipRef.current.hide();
      }
    } catch (error) {
      console.error("Failed to copy:", error);
      setError("Failed to copy ID");
      setTimeout(() => setError(""), 2000);
    }
  };

  const handleMouseEnter = (id: string) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setHoveredId(id);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setHoveredId(null);
    }, 100); // 100ms delay
    setHoverTimeout(timeout);
  };

  const loadWorklogs = async () => {
    try {
      setIsLoading(true);
      if (!user) {
        setError("User not authenticated");
        return;
      }

      const { data, error } = await getUserWorklogs(user.id);

      if (error) {
        setError(error.message || "Failed to load worklogs");
      } else {
        setWorklogs(data || []);
      }
    } catch (error) {
      console.error("Error loading worklogs:", error);
      setError("Failed to load worklogs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!user) {
        setError("User not authenticated");
        return;
      }

      const worklogData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        date: formData.date,
        hours: parseFloat(formData.hours),
        project: formData.project,
        category: formData.category,
      };

      let result;
      if (editingWorklog) {
        result = await updateWorklog(editingWorklog.id, worklogData);
      } else {
        result = await createWorklog(worklogData);
      }

      if (result.error) {
        setError(result.error.message || "Failed to save worklog");
      } else {
        setSuccess(
          editingWorklog
            ? "Worklog updated successfully!"
            : "Worklog created successfully!"
        );
        setFormData({
          title: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
          hours: "",
          project: "",
          category: "",
        });
        setShowForm(false);
        setEditingWorklog(null);
        loadWorklogs();
      }
    } catch (error) {
      console.error("Error saving worklog:", error);
      setError("Failed to save worklog");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (worklog: Worklog) => {
    setEditingWorklog(worklog);
    setFormData({
      title: worklog.title,
      description: worklog.description || "",
      date: worklog.date,
      hours: worklog.hours.toString(),
      project: worklog.project || "",
      category: worklog.category || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this worklog?")) {
      return;
    }

    try {
      const { error } = await deleteWorklog(id);

      if (error) {
        setError(error.message || "Failed to delete worklog");
      } else {
        setSuccess("Worklog deleted successfully!");
        loadWorklogs();
      }
    } catch (error) {
      console.error("Error deleting worklog:", error);
      setError("Failed to delete worklog");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!user || !userProfile) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Bio Card */}
      <TextCard title="PROFILE OVERVIEW">
        <div className="space-y-4">
          {/* Name and Department Row */}
          <div className="flex flex-wrap gap-3 items-center">
            <TextBadge variant="default" className="text-sm px-4 py-2">
              {userProfile.first_name} {userProfile.last_name}
            </TextBadge>
            {userProfile.department && (
              <TextBadge variant="success" className="text-sm px-4 py-2">
                {userProfile.department}
              </TextBadge>
            )}
          </div>

          {/* Email Row */}
          <div className="flex flex-wrap gap-3 items-center">
            {userProfile.master_email ? (
              <TextBadge
                variant={userProfile.is_verified ? "success" : "warning"}
                className="text-sm px-4 py-2"
              >
                {userProfile.master_email}
              </TextBadge>
            ) : (
              <TextBadge variant="error" className="text-sm px-4 py-2">
                No MasterFabric Email
              </TextBadge>
            )}

            {userProfile.personal_email && (
              <TextBadge variant="default" className="text-sm px-4 py-2">
                {userProfile.personal_email}
              </TextBadge>
            )}
          </div>

          {/* User ID Row */}
          <div className="flex flex-wrap gap-3 items-center">
            <Tooltip
              ref={tooltipRef}
              content={
                <div className="space-y-2">
                  <div className="text-xs text-gray-600 mb-1 uppercase tracking-wide">
                    FULL USER ID:
                  </div>
                  <div className="text-xs font-mono break-all mb-2 max-w-lg bg-gray-50 rounded px-3 py-2 border border-gray-200">
                    {userProfile.id}
                  </div>
                  <div className="flex gap-2">
                    <TextButton
                      onClick={() => copyToClipboard(userProfile.id)}
                      variant="success"
                      className="text-xs px-2 py-1 flex items-center gap-1"
                    >
                      COPY
                    </TextButton>
                  </div>
                </div>
              }
              position="bottom"
              variant="default"
            >
              <TextBadge
                variant="default"
                className="text-sm px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                USER ID: {userProfile.id.substring(0, 8)}...
              </TextBadge>
            </Tooltip>

            {copySuccess && (
              <TextBadge variant="success">{copySuccess}</TextBadge>
            )}
          </div>
        </div>
      </TextCard>

      {/* Worklog Section */}
      <TextCard title="WORKLOG MANAGEMENT">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <TextHierarchy level={1} emphasis>
              WORK ENTRIES
            </TextHierarchy>
            <TextButton
              onClick={() => setShowForm(true)}
              variant="default"
              className="px-4 py-2"
            >
              ADD ENTRY
            </TextButton>
          </div>

          {/* Filter Section */}
          <div className="border border-black p-4 bg-white">
            <TextHierarchy level={1} emphasis className="mb-3">
              FILTER BY DATE
            </TextHierarchy>

            {/* Quick Filter Badges */}
            <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
              <TextButton
                onClick={() => setQuickFilter("all")}
                variant={
                  dateFilter.quickFilter === "all" ? "success" : "default"
                }
                className="px-3 py-1 text-xs"
              >
                ALL
              </TextButton>
              <TextButton
                onClick={() => setQuickFilter("today")}
                variant={
                  dateFilter.quickFilter === "today" ? "success" : "default"
                }
                className="px-3 py-1 text-xs"
              >
                TODAY
              </TextButton>
              <TextButton
                onClick={() => setQuickFilter("week")}
                variant={
                  dateFilter.quickFilter === "week" ? "success" : "default"
                }
                className="px-3 py-1 text-xs"
              >
                THIS WEEK
              </TextButton>
              <TextButton
                onClick={() => setQuickFilter("month")}
                variant={
                  dateFilter.quickFilter === "month" ? "success" : "default"
                }
                className="px-3 py-1 text-xs"
              >
                THIS MONTH
              </TextButton>
            </div>

            {/* Date Range Filter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <TextHierarchy level={2} emphasis className="mb-1">
                  FROM DATE
                </TextHierarchy>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) =>
                    setDateFilter((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                      quickFilter: "all",
                    }))
                  }
                  className="w-full p-2 border border-black font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <TextHierarchy level={2} emphasis className="mb-1">
                  TO DATE
                </TextHierarchy>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) =>
                    setDateFilter((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                      quickFilter: "all",
                    }))
                  }
                  className="w-full p-2 border border-black font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="flex items-end">
                <TextButton
                  onClick={() =>
                    setDateFilter({
                      startDate: "",
                      endDate: "",
                      quickFilter: "all",
                    })
                  }
                  variant="default"
                  className="px-4 py-2 w-full"
                >
                  CLEAR FILTERS
                </TextButton>
              </div>
            </div>

            {/* Filter Results Summary */}
            <div className="mt-3 pt-3 border-t border-gray-300">
              <TextHierarchy level={2} muted>
                Showing {filteredWorklogs.length} of {worklogs.length} entries
                {dateFilter.quickFilter !== "all" && (
                  <TextBadge variant="default" className="ml-2">
                    {dateFilter.quickFilter.toUpperCase()}
                  </TextBadge>
                )}
              </TextHierarchy>
            </div>
          </div>

          {error && (
            <TextCard variant="error">
              <TextHierarchy level={1}>
                <TextBadge variant="error">ERROR</TextBadge> {error}
              </TextHierarchy>
            </TextCard>
          )}

          {success && (
            <TextCard variant="success">
              <TextHierarchy level={1}>
                <TextBadge variant="success">SUCCESS</TextBadge> {success}
              </TextHierarchy>
            </TextCard>
          )}

          {/* Worklog Form */}
          {showForm && (
            <TextCard
              title={editingWorklog ? "EDIT WORKLOG" : "ADD NEW WORKLOG"}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <TextHierarchy level={1} emphasis className="mb-2">
                      TITLE *
                    </TextHierarchy>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full p-3 border border-black font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>

                  <div>
                    <TextHierarchy level={1} emphasis className="mb-2">
                      DATE *
                    </TextHierarchy>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      className="w-full p-3 border border-black font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>

                  <div>
                    <TextHierarchy level={1} emphasis className="mb-2">
                      HOURS *
                    </TextHierarchy>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={formData.hours}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hours: e.target.value,
                        }))
                      }
                      className="w-full p-3 border border-black font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>

                  <div>
                    <TextHierarchy level={1} emphasis className="mb-2">
                      CATEGORY
                    </TextHierarchy>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full p-3 border border-black font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <TextHierarchy level={1} emphasis className="mb-2">
                      PROJECT
                    </TextHierarchy>
                    <input
                      type="text"
                      value={formData.project}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          project: e.target.value,
                        }))
                      }
                      className="w-full p-3 border border-black font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TextHierarchy level={1} emphasis className="mb-2">
                      DESCRIPTION
                    </TextHierarchy>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full p-3 border border-black font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end">
                  <TextButton
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingWorklog(null);
                      setFormData({
                        title: "",
                        description: "",
                        date: new Date().toISOString().split("T")[0],
                        hours: "",
                        project: "",
                        category: "",
                      });
                    }}
                    variant="default"
                    className="px-6 py-2"
                  >
                    CANCEL
                  </TextButton>

                  <TextButton
                    type="submit"
                    variant="success"
                    disabled={isLoading}
                    className="px-6 py-2"
                  >
                    {isLoading
                      ? "SAVING..."
                      : editingWorklog
                      ? "UPDATE"
                      : "SAVE"}
                  </TextButton>
                </div>
              </form>
            </TextCard>
          )}

          {/* Worklog List */}
          {isLoading && worklogs.length === 0 ? (
            <TextCard variant="muted">
              <TextHierarchy level={1} muted>
                Loading worklogs...
              </TextHierarchy>
            </TextCard>
          ) : worklogs.length === 0 ? (
            <TextCard variant="muted">
              <TextHierarchy level={1} muted>
                No worklogs found. Add your first entry!
              </TextHierarchy>
            </TextCard>
          ) : filteredWorklogs.length === 0 ? (
            <TextCard variant="muted">
              <TextHierarchy level={1} muted>
                No worklogs found for the selected date range.
              </TextHierarchy>
            </TextCard>
          ) : (
            <div className="space-y-3">
              {filteredWorklogs.map((worklog) => (
                <TextCard key={worklog.id}>
                  <div className="mb-4">
                    <TextHierarchy
                      level={1}
                      emphasis
                      className="text-green-600 text-lg"
                    >
                      {worklog.title}
                    </TextHierarchy>
                  </div>
                  <div className="space-y-4">
                    {/* Header with ID, Category and Hours */}
                    <div className="flex flex-col gap-3">
                      {/* Row 1: ID */}
                      <div className="flex items-center gap-3">
                        <div
                          className="relative"
                          onMouseEnter={() => handleMouseEnter(worklog.id)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <TextBadge
                            variant="muted"
                            className="text-xs px-2 py-1 cursor-pointer"
                          >
                            ID: {worklog.id.slice(0, 8)}...
                          </TextBadge>

                          {/* Hover Popup */}
                          {hoveredId === worklog.id && (
                            <div
                              className="absolute top-full left-0 mt-1 z-50 bg-white border border-black p-3 shadow-lg min-w-64"
                              onMouseEnter={() => handleMouseEnter(worklog.id)}
                              onMouseLeave={handleMouseLeave}
                            >
                              <div className="space-y-2">
                                <TextHierarchy
                                  level={2}
                                  emphasis
                                  className="text-xs"
                                >
                                  FULL ID
                                </TextHierarchy>
                                <div className="font-mono text-xs bg-gray-100 p-2 border rounded break-all">
                                  {worklog.id}
                                </div>
                                <TextButton
                                  onClick={() => copyToClipboard(worklog.id)}
                                  variant="success"
                                  className="w-full px-2 py-1 text-xs"
                                >
                                  COPY ID
                                </TextButton>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Row 2: Category + Hours */}
                      <div className="flex items-center gap-3">
                        {worklog.category && (
                          <TextBadge
                            variant="default"
                            className="text-sm px-3 py-1"
                          >
                            {worklog.category}
                          </TextBadge>
                        )}
                        <TextBadge
                          variant="success"
                          className="text-sm px-3 py-1"
                        >
                          {worklog.hours}h
                        </TextBadge>
                      </div>
                      {/* Row 3: Actions */}
                      <div className="flex gap-2">
                        <TextButton
                          onClick={() => handleEdit(worklog)}
                          variant="default"
                          className="px-4 py-2 text-sm w-full sm:w-auto"
                        >
                          EDIT
                        </TextButton>
                        <TextButton
                          onClick={() => handleDelete(worklog.id)}
                          variant="error"
                          className="px-4 py-2 text-sm w-full sm:w-auto"
                        >
                          DELETE
                        </TextButton>
                      </div>
                    </div>

                    {/* Date and Project Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <TextHierarchy level={1} emphasis className="mb-1">
                          WORK DATE
                        </TextHierarchy>
                        <TextHierarchy level={2}>
                          {formatDate(worklog.date)}
                        </TextHierarchy>
                      </div>

                      {worklog.project && (
                        <div>
                          <TextHierarchy level={1} emphasis className="mb-1">
                            PROJECT
                          </TextHierarchy>
                          <TextHierarchy level={2}>
                            {worklog.project}
                          </TextHierarchy>
                        </div>
                      )}
                    </div>

                    {/* Creation and Update Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                      <div>
                        <TextHierarchy level={1} emphasis className="mb-1">
                          CREATED
                        </TextHierarchy>
                        <TextHierarchy level={2} muted>
                          {new Date(worklog.created_at).toLocaleString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </TextHierarchy>
                      </div>

                      <div>
                        <TextHierarchy level={1} emphasis className="mb-1">
                          LAST UPDATED
                        </TextHierarchy>
                        <TextHierarchy level={2} muted>
                          {new Date(worklog.updated_at).toLocaleString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </TextHierarchy>
                      </div>
                    </div>

                    {/* Description */}
                    {worklog.description && (
                      <div>
                        <TextHierarchy level={1} emphasis className="mb-2">
                          DESCRIPTION
                        </TextHierarchy>
                        <TextHierarchy level={2}>
                          {worklog.description}
                        </TextHierarchy>
                      </div>
                    )}
                  </div>
                </TextCard>
              ))}
            </div>
          )}
        </div>
      </TextCard>
    </div>
  );
}
