"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAllUsers,
  getCurrentMonthYear,
  calculatePerformancePercentage,
  createPerformanceGoal,
  getAllPerformanceGoals,
  updatePerformanceGoal,
  deletePerformanceGoal,
  PerformanceGoalWithUser,
} from "@/lib/repositories/users";
import {
  getAllChecklistStatuses,
  getAllDynamicChecklists,
  createDynamicChecklist,
  updateDynamicChecklist,
  deleteDynamicChecklist,
  DynamicChecklist,
  ChecklistWithAssignments,
} from "@/lib/repositories/checklists";
import {
  getAllTickets,
  updateTicket,
  Ticket,
} from "@/lib/repositories/tickets";
import { getActiveOtpCodes, OtpCode } from "@/lib/repositories/otp";
import {
  getStoreProducts,
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
  getAllStoreTransactions,
  deleteStoreTransaction,
  adjustUserPoints,
  StoreProduct,
  StoreTransaction,
} from "@/lib/repositories/store";
import { ONBOARDING_CHECKLIST, CATEGORY_LABELS } from "@/data/checklist";
import PageLayout from "@/components/layout/PageLayout";
import TextCard from "@/components/ui/TextCard";
import TextHierarchy from "@/components/ui/TextHierarchy";
import TextBadge from "@/components/ui/TextBadge";
import TextButton from "@/components/ui/TextButton";
import PerformanceGoalForm from "@/components/PerformanceGoalForm";
import DynamicChecklistForm from "@/components/DynamicChecklistForm";
import ExistingChecklistForm from "@/components/ExistingChecklistForm";

interface UserWithProgress {
  id: string;
  github_username: string | null;
  master_email: string | null;
  first_name: string | null;
  last_name: string | null;
  department: string | null;
  is_verified: boolean;
  created_at: string;
  completedTasks: number;
  totalTasks: number;
  requiredCompleted: number;
  requiredTotal: number;
}

export default function OwnerPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketFilter, setTicketFilter] = useState<
    "all" | "open" | "in_progress" | "resolved" | "closed"
  >("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [performanceGoals, setPerformanceGoals] = useState<
    PerformanceGoalWithUser[]
  >([]);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProgress | null>(
    null
  );
  const [performanceFilter, setPerformanceFilter] = useState<
    "all" | "current" | "past"
  >("current");
  const [dynamicChecklists, setDynamicChecklists] = useState<
    ChecklistWithAssignments[]
  >([]);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedChecklist, setSelectedChecklist] =
    useState<DynamicChecklist | null>(null);
  const [checklistFilter, setChecklistFilter] = useState<
    "all" | "global" | "custom" | "existing"
  >("all");
  const [showExistingChecklistModal, setShowExistingChecklistModal] =
    useState(false);
  const [selectedExistingChecklist, setSelectedExistingChecklist] =
    useState<any>(null);
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [checklistError, setChecklistError] = useState<string | null>(null);
  const [checklistSuccess, setChecklistSuccess] = useState<string | null>(null);
  const [otpCodes, setOtpCodes] = useState<OtpCode[]>([]);
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  // Store management state
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [storeTx, setStoreTx] = useState<StoreTransaction[]>([]);
  const [storeForm, setStoreForm] = useState({
    name: "",
    description: "",
    image_url: "",
    product_code: "",
    point_cost: 0,
    quantity: 0,
    is_active: true,
  });
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeMessage, setStoreMessage] = useState<string | null>(null);
  const [storeErrorMsg, setStoreErrorMsg] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(
    null
  );
  const [pointsDelta, setPointsDelta] = useState(0);
  const [pointsUserId, setPointsUserId] = useState("");
  const [isStoreManagementExpanded, setIsStoreManagementExpanded] =
    useState(false);
  const [isUserManagementExpanded, setIsUserManagementExpanded] =
    useState(true);
  const [isTicketManagementExpanded, setIsTicketManagementExpanded] =
    useState(false);
  const [isPerformanceManagementExpanded, setIsPerformanceManagementExpanded] =
    useState(false);
  const [isChecklistManagementExpanded, setIsChecklistManagementExpanded] =
    useState(false);
  const [isOtpManagementExpanded, setIsOtpManagementExpanded] = useState(false);
  const [showDeleteTransactionDialog, setShowDeleteTransactionDialog] =
    useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadOwnerData();
    loadOtpCodes();
  }, []);

  // Load OTP codes
  const loadOtpCodes = async () => {
    try {
      setIsLoadingOtp(true);
      setOtpError(null);

      const { data, error } = await getActiveOtpCodes();

      if (error) {
        throw error;
      }

      setOtpCodes(data || []);
    } catch (error) {
      console.error("Error loading OTP codes:", error);
      setOtpError(
        error instanceof Error
          ? error.message
          : "Unknown error loading OTP codes"
      );
    } finally {
      setIsLoadingOtp(false);
    }
  };

  // Refresh OTP codes
  const refreshOtpCodes = () => {
    loadOtpCodes();
  };

  const loadOwnerData = async () => {
    try {
      const [
        usersResult,
        checklistResult,
        ticketsResult,
        performanceResult,
        dynamicChecklistsResult,
        storeProductsResult,
        storeTxResult,
      ] = await Promise.all([
        getAllUsers(),
        getAllChecklistStatuses(),
        getAllTickets(),
        getAllPerformanceGoals(),
        getAllDynamicChecklists(),
        getStoreProducts(),
        getAllStoreTransactions(),
      ]);

      if (
        usersResult.error ||
        checklistResult.error ||
        ticketsResult.error ||
        performanceResult.error ||
        dynamicChecklistsResult.error ||
        storeProductsResult.error ||
        storeTxResult.error
      ) {
        const error =
          usersResult.error ||
          checklistResult.error ||
          ticketsResult.error ||
          performanceResult.error ||
          dynamicChecklistsResult.error ||
          storeProductsResult.error ||
          storeTxResult.error;
        console.error("Error loading owner data:", error);

        // More detailed error messages
        let errorMessage = "Failed to load data: ";
        if (usersResult.error)
          errorMessage += `Users: ${usersResult.error.message}; `;
        if (checklistResult.error)
          errorMessage += `Checklist: ${checklistResult.error.message}; `;
        if (ticketsResult.error)
          errorMessage += `Tickets: ${ticketsResult.error.message}; `;
        if (performanceResult.error)
          errorMessage += `Performance: ${performanceResult.error.message}; `;
        if (dynamicChecklistsResult.error)
          errorMessage += `Dynamic Checklists: ${dynamicChecklistsResult.error.message}; `;
        if (storeProductsResult.error)
          errorMessage += `Store Products: ${storeProductsResult.error.message}; `;
        if (storeTxResult.error)
          errorMessage += `Store Transactions: ${storeTxResult.error.message}; `;

        setChecklistError(errorMessage);
        return;
      }

      const usersData = usersResult.data || [];
      const checklistData = checklistResult.data || [];
      const ticketsData = ticketsResult.data || [];
      const performanceData = performanceResult.data || [];
      const dynamicChecklistsData = dynamicChecklistsResult.data || [];
      const storeProductsData = (storeProductsResult.data ||
        []) as StoreProduct[];
      const storeTxData = (storeTxResult.data || []) as StoreTransaction[];

      // Process checklist data by user
      const userProgress = usersData.map((user: any) => {
        const userChecklistItems = checklistData.filter(
          (item: { user_id: string; completed: boolean; step_name: string }) =>
            item.user_id === user.id
        );
        const completedTasks = userChecklistItems.filter(
          (item: { completed: boolean }) => item.completed
        ).length;
        const totalTasks = ONBOARDING_CHECKLIST.length;

        const requiredTasks = ONBOARDING_CHECKLIST.filter(
          (item) => item.required
        );
        const requiredCompleted = requiredTasks.filter((task) =>
          userChecklistItems.some(
            (item: { step_name: string; completed: boolean }) =>
              item.step_name === task.id && item.completed
          )
        ).length;

        return {
          ...user,
          completedTasks,
          totalTasks,
          requiredCompleted,
          requiredTotal: requiredTasks.length,
        };
      });

      setUsers(userProgress);
      setTickets(ticketsData);
      setPerformanceGoals(performanceData);
      setDynamicChecklists(dynamicChecklistsData);
      setStoreProducts(storeProductsData);
      setStoreTx(storeTxData);
    } catch (error) {
      console.error("Error loading owner data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    try {
      setStoreSaving(true);
      setStoreErrorMsg(null);
      setStoreMessage(null);
      if (editingProduct) {
        const { error } = await updateStoreProduct(editingProduct.id, {
          ...editingProduct,
          ...storeForm,
          point_cost: Number(storeForm.point_cost),
          quantity: Number(storeForm.quantity),
        } as any);
        if (error) throw error;
        setStoreMessage("Product updated");
      } else {
        const { error } = await createStoreProduct({
          name: storeForm.name,
          description: storeForm.description,
          image_url: storeForm.image_url,
          product_code: storeForm.product_code,
          point_cost: Number(storeForm.point_cost),
          quantity: Number(storeForm.quantity),
          is_active: storeForm.is_active,
        });
        if (error) throw error;
        setStoreMessage("Product created");
      }
      await loadOwnerData();
      setEditingProduct(null);
      setStoreForm({
        name: "",
        description: "",
        image_url: "",
        product_code: "",
        point_cost: 0,
        quantity: 0,
        is_active: true,
      });
    } catch (e: any) {
      setStoreErrorMsg(e?.message || "Save failed");
    } finally {
      setStoreSaving(false);
    }
  };

  const handleEditProduct = (p: StoreProduct) => {
    setEditingProduct(p);
    setStoreForm({
      name: p.name,
      description: p.description || "",
      image_url: p.image_url || "",
      product_code: p.product_code,
      point_cost: p.point_cost,
      quantity: p.quantity,
      is_active: p.is_active,
    });
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await deleteStoreProduct(id);
    if (!error) {
      await loadOwnerData();
    }
  };

  const handleAdjustPoints = async () => {
    if (!pointsUserId || pointsDelta === 0) return;
    const { error } = await adjustUserPoints(pointsUserId, pointsDelta);
    if (!error) {
      setPointsDelta(0);
      setPointsUserId("");
      await loadOwnerData();
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setShowDeleteTransactionDialog(true);
  };

  const handleConfirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      setStoreErrorMsg(null);
      setStoreMessage(null);
      setShowDeleteTransactionDialog(false);

      const { error } = await deleteStoreTransaction(transactionToDelete);

      if (error) {
        setStoreErrorMsg(`Failed to delete transaction: ${error.message}`);
        return;
      }

      setStoreMessage("Transaction deleted successfully");
      await loadOwnerData(); // Reload data to refresh the transactions list

      // Clear success message after 3 seconds
      setTimeout(() => setStoreMessage(null), 3000);
    } catch (e: any) {
      setStoreErrorMsg(e?.message || "Delete failed");
    } finally {
      setTransactionToDelete(null);
    }
  };

  const handleCancelDeleteTransaction = () => {
    setShowDeleteTransactionDialog(false);
    setTransactionToDelete(null);
  };

  const getFilteredUsers = () => {
    switch (filter) {
      case "active":
        return users.filter(
          (user) => user.requiredCompleted < user.requiredTotal
        );
      case "completed":
        return users.filter(
          (user) => user.requiredCompleted === user.requiredTotal
        );
      default:
        return users;
    }
  };

  const getOverallStats = () => {
    const totalUsers = users.length;
    const completedUsers = users.filter(
      (user) => user.requiredCompleted === user.requiredTotal
    ).length;
    const activeUsers = users.filter(
      (user) => user.master_email && user.requiredCompleted < user.requiredTotal
    ).length;

    return {
      total: totalUsers,
      completed: completedUsers,
      active: activeUsers,
      pending: totalUsers - completedUsers - activeUsers,
    };
  };

  const getFilteredTickets = () => {
    if (ticketFilter === "all") return tickets;
    return tickets.filter((ticket) => ticket.status === ticketFilter);
  };

  const getTicketStats = () => {
    return {
      all: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      in_progress: tickets.filter((t) => t.status === "in_progress").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      closed: tickets.filter((t) => t.status === "closed").length,
    };
  };

  const handleTicketUpdate = async (ticketId: string, updates: any) => {
    try {
      const { error } = await updateTicket(ticketId, updates);
      if (error) {
        console.error("Error updating ticket:", error);
      } else {
        loadOwnerData(); // Reload data
        setShowTicketModal(false);
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFilteredPerformanceGoals = () => {
    const currentMonth = getCurrentMonthYear();
    switch (performanceFilter) {
      case "current":
        return performanceGoals.filter(
          (goal) => goal.month_year === currentMonth
        );
      case "past":
        return performanceGoals.filter(
          (goal) => goal.month_year < currentMonth
        );
      default:
        return performanceGoals;
    }
  };

  const handleCreatePerformanceGoal = async (goalData: {
    target_hours: number;
    target_story_points: number;
    monthly_checklist: any[];
  }) => {
    if (!selectedUser) return;

    try {
      const { error } = await createPerformanceGoal({
        user_id: selectedUser.id,
        month_year: getCurrentMonthYear(),
        target_hours: goalData.target_hours,
        target_story_points: goalData.target_story_points,
        monthly_checklist: goalData.monthly_checklist,
      });

      if (error) {
        console.error("Error creating performance goal:", error);
      } else {
        loadOwnerData(); // Reload data
        setShowPerformanceModal(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error("Error creating performance goal:", error);
    }
  };

  const handleUpdatePerformanceGoal = async (goalId: string, updates: any) => {
    try {
      const { error } = await updatePerformanceGoal(goalId, updates);
      if (error) {
        console.error("Error updating performance goal:", error);
      } else {
        loadOwnerData(); // Reload data
      }
    } catch (error) {
      console.error("Error updating performance goal:", error);
    }
  };

  const getFilteredDynamicChecklists = () => {
    switch (checklistFilter) {
      case "global":
        return dynamicChecklists.filter((checklist) => checklist.is_global);
      case "custom":
        return dynamicChecklists.filter((checklist) => !checklist.is_global);
      case "existing":
        return ONBOARDING_CHECKLIST.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description || null,
          category: item.category || "onboarding",
          is_global: true,
          is_active: true,
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assignments: [],
        }));
      default:
        return dynamicChecklists;
    }
  };

  const handleCreateDynamicChecklist = async (checklistData: {
    title: string;
    description?: string;
    category: string;
    is_global: boolean;
  }) => {
    try {
      setChecklistError(null);
      setChecklistSuccess(null);

      console.log("Creating checklist with data:", checklistData);

      const { data, error } = await createDynamicChecklist(checklistData);

      if (error) {
        console.error("Error creating dynamic checklist:", error);
        setChecklistError(`Failed to create checklist: ${error.message}`);
        return;
      }

      if (data) {
        console.log("Checklist created successfully:", data);
        setChecklistSuccess(
          `Checklist "${checklistData.title}" created successfully!`
        );
        loadOwnerData(); // Reload data
        setShowChecklistModal(false);
        setSelectedChecklist(null);

        // Clear success message after 3 seconds
        setTimeout(() => setChecklistSuccess(null), 3000);
      }
    } catch (error) {
      console.error("Error creating dynamic checklist:", error);
      setChecklistError(
        `Unexpected error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleUpdateDynamicChecklist = async (checklistData: {
    title: string;
    description?: string;
    category: string;
    is_global: boolean;
  }) => {
    if (!selectedChecklist) return;

    try {
      const { error } = await updateDynamicChecklist(
        selectedChecklist.id,
        checklistData
      );
      if (error) {
        console.error("Error updating dynamic checklist:", error);
      } else {
        loadOwnerData(); // Reload data
        setShowChecklistModal(false);
        setSelectedChecklist(null);
      }
    } catch (error) {
      console.error("Error updating dynamic checklist:", error);
    }
  };

  const handleDeleteDynamicChecklist = async (checklistId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this checklist? This will also remove all user assignments."
      )
    ) {
      return;
    }

    try {
      const { error } = await deleteDynamicChecklist(checklistId);
      if (error) {
        console.error("Error deleting dynamic checklist:", error);
      } else {
        loadOwnerData(); // Reload data
      }
    } catch (error) {
      console.error("Error deleting dynamic checklist:", error);
    }
  };

  const handleEditExistingChecklist = (checklistItem: any) => {
    setSelectedExistingChecklist(checklistItem);
    setShowExistingChecklistModal(true);
  };

  const handleUpdateExistingChecklist = async (checklistData: {
    title: string;
    description?: string;
    category: string;
    required: boolean;
  }) => {
    if (!selectedExistingChecklist) return;

    try {
      // Update the existing checklist in the data file
      // This would require updating the ONBOARDING_CHECKLIST array
      // For now, we'll show a message that this requires code changes
      alert(
        "Existing checklist updates require code changes. Please contact the development team."
      );
      setShowExistingChecklistModal(false);
      setSelectedExistingChecklist(null);
    } catch (error) {
      console.error("Error updating existing checklist:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <TextBadge variant="muted">LOADING DASHBOARD...</TextBadge>
      </div>
    );
  }

  const filteredUsers = getFilteredUsers();
  const stats = getOverallStats();

  // Reusable collapsible section component
  const CollapsibleSection = ({
    title,
    isExpanded,
    onToggle,
    children,
    badgeText,
  }: {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    badgeText?: string;
  }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-3">
          <TextHierarchy level={1} emphasis>
            {title}
          </TextHierarchy>
          {badgeText && (
            <TextBadge variant="muted" className="text-xs">
              {badgeText}
            </TextBadge>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-2 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors"
          aria-label={isExpanded ? "Collapse section" : "Expand section"}
        >
          <span
            className={`transform transition-transform duration-200 text-lg ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>
      </div>
      {isExpanded && children}
    </div>
  );

  return (
    <>
      <PageLayout
        title="OWNER DASHBOARD"
        subtitle="Onboarding Progress Overview"
      >
        <TextCard title="SYSTEM OVERVIEW">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
            {/* Total Users */}
            <div className="text-center p-2 sm:p-4 border-2 border-black bg-white">
              <div className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                {stats.total}
              </div>
              <div className="text-xs sm:text-sm font-mono text-gray-600 uppercase tracking-wide">
                Total
              </div>
              <div className="text-xs text-gray-500 mt-1 hidden sm:block">
                Developers
              </div>
            </div>

            {/* Completed Users */}
            <div className="text-center p-2 sm:p-4 border-2 border-green-500 bg-green-50">
              <div className="text-xl sm:text-3xl font-bold text-green-700 mb-1 sm:mb-2">
                {stats.completed}
              </div>
              <div className="text-xs sm:text-sm font-mono text-green-600 uppercase tracking-wide">
                Done
              </div>
              <div className="text-xs text-green-500 mt-1 hidden sm:block">
                {stats.total > 0
                  ? Math.round((stats.completed / stats.total) * 100)
                  : 0}
                % Success
              </div>
            </div>

            {/* Active Users */}
            <div className="text-center p-2 sm:p-4 border-2 border-orange-500 bg-orange-50">
              <div className="text-xl sm:text-3xl font-bold text-orange-700 mb-1 sm:mb-2">
                {stats.active}
              </div>
              <div className="text-xs sm:text-sm font-mono text-orange-600 uppercase tracking-wide">
                Active
              </div>
              <div className="text-xs text-orange-500 mt-1 hidden sm:block">
                In Progress
              </div>
            </div>

            {/* Pending Users */}
            <div className="text-center p-2 sm:p-4 border-2 border-red-500 bg-red-50">
              <div className="text-xl sm:text-3xl font-bold text-red-700 mb-1 sm:mb-2">
                {stats.pending}
              </div>
              <div className="text-xs sm:text-sm font-mono text-red-600 uppercase tracking-wide">
                Pending
              </div>
              <div className="text-xs text-red-500 mt-1 hidden sm:block">
                Not Started
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <TextHierarchy
                level={1}
                emphasis
                className="text-sm sm:text-base"
              >
                PROGRESS
              </TextHierarchy>
              <TextBadge
                variant="success"
                className="font-mono text-xs sm:text-sm"
              >
                {stats.total > 0
                  ? Math.round((stats.completed / stats.total) * 100)
                  : 0}
                %
              </TextBadge>
            </div>

            <div className="w-full bg-gray-200 h-3 sm:h-4 border border-black">
              <div
                className="bg-green-500 h-full transition-all duration-500 ease-out"
                style={{
                  width: `${
                    stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
                  }%`,
                }}
              ></div>
            </div>

            <div className="flex justify-between text-xs font-mono text-gray-600">
              <span>0</span>
              <span>
                {stats.completed}/{stats.total} done
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div>
                <div className="text-sm sm:text-lg font-bold text-blue-600">
                  {stats.total > 0
                    ? Math.round((stats.active / stats.total) * 100)
                    : 0}
                  %
                </div>
                <div className="text-xs font-mono text-gray-600 uppercase">
                  Active
                </div>
              </div>
              <div>
                <div className="text-sm sm:text-lg font-bold text-purple-600">
                  {stats.total > 0
                    ? Math.round(
                        ((stats.completed + stats.active) / stats.total) * 100
                      )
                    : 0}
                  %
                </div>
                <div className="text-xs font-mono text-gray-600 uppercase">
                  Engaged
                </div>
              </div>
              <div>
                <div className="text-sm sm:text-lg font-bold text-gray-600">
                  {stats.total > 0
                    ? Math.round((stats.pending / stats.total) * 100)
                    : 0}
                  %
                </div>
                <div className="text-xs font-mono text-gray-600 uppercase">
                  Pending
                </div>
              </div>
            </div>
          </div>
        </TextCard>

        {/* Store Management */}
        <TextCard title="STORE MANAGEMENT">
          <CollapsibleSection
            title="STORE MANAGEMENT"
            isExpanded={isStoreManagementExpanded}
            onToggle={() =>
              setIsStoreManagementExpanded(!isStoreManagementExpanded)
            }
            badgeText={`${storeProducts.length} products`}
          >
            <div className="space-y-6">
              {/* Create / Edit Product */}
              <div className="border border-black p-4 bg-white">
                <TextHierarchy level={1} emphasis className="mb-2">
                  {editingProduct ? "EDIT PRODUCT" : "CREATE PRODUCT"}
                </TextHierarchy>
                {storeErrorMsg && (
                  <TextHierarchy level={2} className="text-red-600">
                    {storeErrorMsg}
                  </TextHierarchy>
                )}
                {storeMessage && (
                  <TextHierarchy level={2} className="text-green-600">
                    {storeMessage}
                  </TextHierarchy>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    className="border border-black p-2 font-mono text-sm"
                    placeholder="Name"
                    value={storeForm.name}
                    onChange={(e) =>
                      setStoreForm({ ...storeForm, name: e.target.value })
                    }
                  />
                  <input
                    className="border border-black p-2 font-mono text-sm"
                    placeholder="Product Code"
                    value={storeForm.product_code}
                    onChange={(e) =>
                      setStoreForm({
                        ...storeForm,
                        product_code: e.target.value,
                      })
                    }
                  />
                  <input
                    className="border border-black p-2 font-mono text-sm"
                    placeholder="Image URL"
                    value={storeForm.image_url}
                    onChange={(e) =>
                      setStoreForm({ ...storeForm, image_url: e.target.value })
                    }
                  />
                  <input
                    className="border border-black p-2 font-mono text-sm md:col-span-3"
                    placeholder="Description"
                    value={storeForm.description}
                    onChange={(e) =>
                      setStoreForm({
                        ...storeForm,
                        description: e.target.value,
                      })
                    }
                  />
                  <input
                    type="number"
                    className="border border-black p-2 font-mono text-sm"
                    placeholder="Point Cost"
                    value={storeForm.point_cost}
                    onChange={(e) =>
                      setStoreForm({
                        ...storeForm,
                        point_cost: Number(e.target.value),
                      })
                    }
                  />
                  <input
                    type="number"
                    className="border border-black p-2 font-mono text-sm"
                    placeholder="Quantity"
                    value={storeForm.quantity}
                    onChange={(e) =>
                      setStoreForm({
                        ...storeForm,
                        quantity: Number(e.target.value),
                      })
                    }
                  />
                  <select
                    className="border border-black p-2 font-mono text-sm"
                    value={storeForm.is_active ? "1" : "0"}
                    onChange={(e) =>
                      setStoreForm({
                        ...storeForm,
                        is_active: e.target.value === "1",
                      })
                    }
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
                <div className="mt-3 flex gap-2">
                  <TextButton
                    onClick={handleSaveProduct}
                    disabled={storeSaving}
                    variant="success"
                  >
                    {storeSaving ? "SAVING..." : "SAVE"}
                  </TextButton>
                  {editingProduct && (
                    <TextButton
                      onClick={() => {
                        setEditingProduct(null);
                        setStoreForm({
                          name: "",
                          description: "",
                          image_url: "",
                          product_code: "",
                          point_cost: 0,
                          quantity: 0,
                          is_active: true,
                        });
                      }}
                      variant="default"
                    >
                      CANCEL
                    </TextButton>
                  )}
                </div>
              </div>

              {/* Products List */}
              <div className="space-y-2">
                <TextHierarchy level={1} emphasis>
                  PRODUCTS
                </TextHierarchy>
                {storeProducts.length === 0 ? (
                  <TextHierarchy level={2} muted>
                    No products
                  </TextHierarchy>
                ) : (
                  storeProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between border border-black bg-white p-3"
                    >
                      <div>
                        <div className="font-mono text-sm">
                          {p.name}{" "}
                          <span className="text-gray-500">
                            ({p.product_code})
                          </span>
                        </div>
                        <div className="font-mono text-xs text-gray-600">
                          {p.point_cost} pts • stock: {p.quantity} •{" "}
                          {p.is_active ? "active" : "inactive"}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <TextButton
                          onClick={() => handleEditProduct(p)}
                          className="px-3 py-1"
                        >
                          EDIT
                        </TextButton>
                        <TextButton
                          onClick={() => handleDeleteProduct(p.id)}
                          variant="error"
                          className="px-3 py-1"
                        >
                          DELETE
                        </TextButton>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Points Management */}
              <div className="space-y-2">
                <TextHierarchy level={1} emphasis>
                  USER POINTS
                </TextHierarchy>
                <div className="flex flex-wrap gap-2">
                  <input
                    className="border border-black p-2 font-mono text-sm flex-1"
                    placeholder="User ID"
                    value={pointsUserId}
                    onChange={(e) => setPointsUserId(e.target.value)}
                  />
                  <input
                    type="number"
                    className="border border-black p-2 font-mono text-sm w-40"
                    placeholder="Delta (e.g. 100)"
                    value={pointsDelta}
                    onChange={(e) => setPointsDelta(Number(e.target.value))}
                  />
                  <TextButton
                    onClick={handleAdjustPoints}
                    variant="success"
                    className="px-4 py-2"
                  >
                    APPLY
                  </TextButton>
                </div>
              </div>

              {/* Transactions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TextHierarchy level={1} emphasis>
                      TRANSACTIONS
                    </TextHierarchy>
                    <div className="flex items-center gap-2">
                      <TextBadge variant="default" className="text-xs">
                        {storeTx.length} total
                      </TextBadge>
                      <TextBadge variant="success" className="text-xs">
                        {
                          storeTx.filter((tx) => tx.status === "completed")
                            .length
                        }{" "}
                        completed
                      </TextBadge>
                      <TextBadge variant="warning" className="text-xs">
                        {
                          storeTx.filter((tx) => tx.status === "cancelled")
                            .length
                        }{" "}
                        cancelled
                      </TextBadge>
                    </div>
                  </div>
                </div>
                {storeTx.length === 0 ? (
                  <TextHierarchy level={2} muted>
                    No transactions
                  </TextHierarchy>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {storeTx.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between border border-black bg-white p-3"
                      >
                        <div className="text-left flex-1">
                          <div className="font-mono text-sm">
                            {tx.product_id}
                          </div>
                          <div className="font-mono text-xs text-gray-500">
                            {new Date(tx.created_at).toLocaleString()} • -
                            {tx.point_cost} pts
                          </div>
                          <div className="font-mono text-xs text-gray-400 mt-1">
                            User: {tx.user_id.substring(0, 8)}...
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TextBadge
                            variant={
                              tx.status === "completed"
                                ? "success"
                                : tx.status === "cancelled"
                                ? "warning"
                                : "default"
                            }
                            className="font-mono text-xs uppercase"
                          >
                            {tx.status}
                          </TextBadge>
                          <TextButton
                            onClick={() => handleDeleteTransaction(tx.id)}
                            variant="error"
                            className="px-3 py-1 text-xs"
                          >
                            DELETE
                          </TextButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CollapsibleSection>
        </TextCard>

        {/* Event Management Section */}
        <TextCard title="EVENT MANAGEMENT">
          <div className="space-y-4 mb-4">
            <div className="flex justify-end">
              <TextButton
                variant="success"
                onClick={() => router.push("/owner/events")}
              >
                MANAGE EVENTS →
              </TextButton>
            </div>
            <TextHierarchy level={2} muted>
              Create, manage, and monitor events. View participant lists and
              manage registrations.
            </TextHierarchy>
          </div>
        </TextCard>

        {/* Forms Management Section */}
        <TextCard title="FORMS MANAGEMENT">
          <div className="space-y-4 mb-4">
            <div className="flex justify-end">
              <TextButton
                variant="success"
                onClick={() => router.push("/owner/forms")}
              >
                MANAGE FORMS →
              </TextButton>
            </div>
            <TextHierarchy level={2} muted>
              Create, publish, and manage forms. View submissions and export
              responses.
            </TextHierarchy>
          </div>
        </TextCard>

        {/* Landing Page Management Section */}
        <TextCard title="LANDING PAGE MANAGEMENT">
          <div className="space-y-4 mb-4">
            <div className="flex justify-end">
              <TextButton
                variant="success"
                onClick={() => router.push("/owner/landing")}
              >
                MANAGE LANDING PAGE →
              </TextButton>
            </div>
            <TextHierarchy level={2} muted>
              Customize your landing page. Create sections, manage content, and
              control what visitors see.
            </TextHierarchy>
          </div>
        </TextCard>

        <TextCard title="USER MANAGEMENT">
          <CollapsibleSection
            title="USER MANAGEMENT"
            isExpanded={isUserManagementExpanded}
            onToggle={() =>
              setIsUserManagementExpanded(!isUserManagementExpanded)
            }
            badgeText={`${users.length} users`}
          >
            <div className="space-y-6">
              <div className="flex gap-4">
                {[
                  { key: "all", label: "ALL USERS", count: users.length },
                  { key: "active", label: "ACTIVE", count: stats.active },
                  {
                    key: "completed",
                    label: "COMPLETED",
                    count: stats.completed,
                  },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setFilter(option.key as any)}
                    className={`
                      px-4 py-2 border font-mono text-sm transition-colors
                      ${
                        filter === option.key
                          ? "bg-black text-white border-black"
                          : "bg-white text-black border-black hover:bg-black hover:text-white"
                      }
                    `}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>

              <div>
                <TextHierarchy level={1} emphasis className="mb-4">
                  USER LIST - {filter.toUpperCase()}
                </TextHierarchy>
                {filteredUsers.length === 0 ? (
                  <TextHierarchy level={1} muted>
                    No users found for the selected filter.
                  </TextHierarchy>
                ) : (
                  <div className="space-y-4">
                    {filteredUsers.map((user) => {
                      const progressPercentage = Math.round(
                        (user.completedTasks / user.totalTasks) * 100
                      );
                      const isCompleted =
                        user.requiredCompleted === user.requiredTotal;
                      const hasStarted = user.master_email;

                      return (
                        <div
                          key={user.id}
                          className="border border-black bg-white p-3 sm:p-4 mb-3"
                        >
                          {/* Header with Name and Status */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                            <div className="flex-1">
                              <TextHierarchy
                                level={1}
                                emphasis
                                className="text-sm sm:text-base"
                              >
                                {user.first_name && user.last_name
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.github_username || "Unknown User"}
                              </TextHierarchy>
                              <div className="text-xs font-mono text-gray-500 mt-1">
                                ID: {user.id.substring(0, 8)}...
                              </div>
                            </div>
                            <div className="mt-2 sm:mt-0">
                              {isCompleted && (
                                <TextBadge
                                  variant="success"
                                  className="text-xs"
                                >
                                  ✓ COMPLETED
                                </TextBadge>
                              )}
                              {!hasStarted && (
                                <TextBadge variant="error" className="text-xs">
                                  ⚠ NOT STARTED
                                </TextBadge>
                              )}
                              {hasStarted && !isCompleted && (
                                <TextBadge
                                  variant="warning"
                                  className="text-xs"
                                >
                                  🔄 IN PROGRESS
                                </TextBadge>
                              )}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-mono text-gray-600">
                                PROGRESS
                              </span>
                              <span className="text-xs font-mono text-gray-600">
                                {progressPercentage}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 h-2 border border-gray-300">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  isCompleted
                                    ? "bg-green-500"
                                    : hasStarted
                                    ? "bg-orange-500"
                                    : "bg-gray-400"
                                }`}
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs font-mono text-gray-500 mt-1">
                              <span>
                                {user.completedTasks}/{user.totalTasks} tasks
                              </span>
                              <span>
                                {user.requiredCompleted}/{user.requiredTotal}{" "}
                                required
                              </span>
                            </div>
                          </div>

                          {/* User Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-gray-500 w-16">
                                GITHUB:
                              </span>
                              <span className="font-mono">
                                {user.github_username || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-gray-500 w-16">
                                EMAIL:
                              </span>
                              <span className="font-mono truncate">
                                {user.master_email
                                  ? user.master_email.split("@")[0] + "@..."
                                  : "Not provided"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-gray-500 w-16">
                                DEPT:
                              </span>
                              <span className="font-mono">
                                {user.department || "Not specified"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-gray-500 w-16">
                                JOINED:
                              </span>
                              <span className="font-mono">
                                {new Date(user.created_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CollapsibleSection>
        </TextCard>

        <TextCard title="CHECKLIST OVERVIEW">
          <TextHierarchy level={1} emphasis className="mb-4">
            ONBOARDING TASKS BREAKDOWN
          </TextHierarchy>

          {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
            const categoryTasks = ONBOARDING_CHECKLIST.filter(
              (item) => item.category === category
            );
            const requiredTasks = categoryTasks.filter(
              (item) => item.required
            ).length;
            const optionalTasks = categoryTasks.length - requiredTasks;

            return (
              <TextHierarchy key={category} level={2} className="mb-2">
                <TextBadge variant="muted">{label}</TextBadge>{" "}
                {categoryTasks.length} tasks ({requiredTasks} required,{" "}
                {optionalTasks} optional)
              </TextHierarchy>
            );
          })}
        </TextCard>

        <TextCard title="OTP VERIFICATION CODES" variant="warning">
          <CollapsibleSection
            title="OTP VERIFICATION CODES"
            isExpanded={isOtpManagementExpanded}
            onToggle={() =>
              setIsOtpManagementExpanded(!isOtpManagementExpanded)
            }
            badgeText={`${otpCodes.length} active codes`}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <TextHierarchy level={1} emphasis>
                  ACTIVE EMAIL VERIFICATION CODES
                </TextHierarchy>
                <TextButton
                  onClick={refreshOtpCodes}
                  variant="default"
                  className="text-xs py-1 px-3"
                  disabled={isLoadingOtp}
                >
                  {isLoadingOtp ? "LOADING..." : "REFRESH"}
                </TextButton>
              </div>

              {otpError && (
                <div className="p-3 border border-red-300 bg-red-50 rounded">
                  <TextHierarchy level={2} className="text-red-600">
                    <TextBadge variant="error">ERROR</TextBadge> {otpError}
                  </TextHierarchy>
                </div>
              )}

              {isLoadingOtp && !otpCodes.length ? (
                <div className="text-center py-6">
                  <TextBadge variant="default">LOADING OTP CODES...</TextBadge>
                </div>
              ) : otpCodes.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-gray-300 rounded">
                  <TextHierarchy level={1} muted>
                    No active verification codes found
                  </TextHierarchy>
                  <TextHierarchy level={2} muted className="mt-2">
                    Codes will appear here when users request email verification
                  </TextHierarchy>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-black">
                        <th className="py-2 px-3 text-left">User</th>
                        <th className="py-2 px-3 text-left">Email</th>
                        <th className="py-2 px-3 text-center font-mono bg-yellow-50">
                          OTP CODE
                        </th>
                        <th className="py-2 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {otpCodes.map((otp) => (
                        <tr
                          key={otp.id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="py-3 px-3">
                            <div className="font-medium">
                              {otp.first_name && otp.last_name
                                ? `${otp.first_name} ${otp.last_name}`
                                : otp.github_username || "Unknown User"}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              ID: {otp.id.substring(0, 8)}...
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-sm">
                            {otp.verification_email}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="inline-block bg-yellow-100 border border-yellow-300 px-3 py-1 rounded font-mono text-lg font-bold tracking-widest">
                              {otp.verification_code}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {otp.is_expired ? (
                              <TextBadge variant="error">EXPIRED</TextBadge>
                            ) : (
                              <div>
                                <TextBadge variant="success">ACTIVE</TextBadge>
                                <div className="text-xs text-gray-500 mt-1">
                                  {Math.floor((otp.time_remaining || 0) / 60)}:
                                  {((otp.time_remaining || 0) % 60)
                                    .toString()
                                    .padStart(2, "0")}{" "}
                                  remaining
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <TextHierarchy level={2} muted className="mt-4">
                OTP codes are automatically generated when users verify their
                MasterFabric email address. Codes expire after 10 minutes and
                are cleared after successful verification.
              </TextHierarchy>
            </div>
          </CollapsibleSection>
        </TextCard>

        <TextCard variant="muted">
          <TextHierarchy level={1} muted>
            This dashboard provides read-only access to all user onboarding
            progress. Use filters to focus on specific user groups and monitor
            completion rates.
          </TextHierarchy>
          <TextHierarchy level={1} muted>
            Contact individual users directly if they need assistance with their
            onboarding process.
          </TextHierarchy>
        </TextCard>

        {/* Ticket Management Section */}
        <TextCard title="TICKET MANAGEMENT">
          <CollapsibleSection
            title="TICKET MANAGEMENT"
            isExpanded={isTicketManagementExpanded}
            onToggle={() =>
              setIsTicketManagementExpanded(!isTicketManagementExpanded)
            }
            badgeText={`${tickets.length} tickets`}
          >
            <div className="space-y-4">
              {/* Minimalist Stats & Filter */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Compact Stats */}
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {getTicketStats().all}
                    </div>
                    <div className="text-xs text-gray-500">TOTAL</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {getTicketStats().open}
                    </div>
                    <div className="text-xs text-gray-500">OPEN</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {getTicketStats().in_progress}
                    </div>
                    <div className="text-xs text-gray-500">ACTIVE</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {getTicketStats().resolved + getTicketStats().closed}
                    </div>
                    <div className="text-xs text-gray-500">DONE</div>
                  </div>
                </div>

                {/* Compact Filter */}
                <div className="flex gap-1">
                  {[
                    { key: "all", label: "ALL", color: "gray" },
                    { key: "open", label: "OPEN", color: "orange" },
                    { key: "in_progress", label: "ACTIVE", color: "blue" },
                    { key: "resolved", label: "DONE", color: "green" },
                  ].map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setTicketFilter(option.key as any)}
                      className={`
                      px-2 py-1 text-xs font-mono transition-colors rounded
                      ${
                        ticketFilter === option.key
                          ? `bg-${option.color}-100 text-${option.color}-800 border border-${option.color}-300`
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }
                    `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tickets List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getFilteredTickets().length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <TextHierarchy level={1} muted>
                      No tickets found for the selected filter.
                    </TextHierarchy>
                  </div>
                ) : (
                  getFilteredTickets().map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-white border-2 border-black p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-400"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <TextHierarchy
                            level={1}
                            emphasis
                            className="text-lg mb-3 text-gray-900"
                          >
                            {ticket.title}
                          </TextHierarchy>
                          <div className="flex gap-2">
                            <TextBadge
                              variant={
                                ticket.status === "open"
                                  ? "warning"
                                  : ticket.status === "resolved"
                                  ? "success"
                                  : "default"
                              }
                              className="text-xs font-bold"
                            >
                              {ticket.status.toUpperCase()}
                            </TextBadge>
                            <TextBadge
                              variant={
                                ticket.priority === "urgent"
                                  ? "error"
                                  : ticket.priority === "high"
                                  ? "warning"
                                  : "default"
                              }
                              className="text-xs font-bold"
                            >
                              {ticket.priority.toUpperCase()}
                            </TextBadge>
                          </div>
                        </div>
                      </div>

                      {/* Category and Date */}
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 font-mono text-sm">
                            CATEGORY:
                          </span>
                          <TextBadge variant="default" className="text-xs">
                            {ticket.category}
                          </TextBadge>
                        </div>
                        <div className="text-gray-500 font-mono text-xs">
                          {formatDate(ticket.created_at)}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-4">
                        <div className="text-sm text-gray-600 font-mono mb-2">
                          DESCRIPTION:
                        </div>
                        <div className="text-sm text-gray-800 bg-gray-50 p-4 border-l-4 border-gray-300 rounded-r-lg">
                          {ticket.description.length > 100
                            ? `${ticket.description.substring(0, 100)}...`
                            : ticket.description}
                        </div>
                      </div>

                      {/* Resolution Notes (if exists) */}
                      {ticket.resolution_notes && (
                        <div className="mb-4">
                          <div className="text-sm text-green-600 font-mono mb-2">
                            RESOLUTION:
                          </div>
                          <div className="text-sm text-green-800 bg-green-50 p-4 border-l-4 border-green-400 rounded-r-lg">
                            {ticket.resolution_notes}
                          </div>
                        </div>
                      )}

                      {/* Footer with Manage Button */}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500 font-mono">
                          ID: {ticket.id.substring(0, 8)}...
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowTicketModal(true);
                          }}
                          className="px-4 py-2 border-2 border-black bg-white text-black font-mono text-xs hover:bg-black hover:text-white transition-colors font-bold"
                        >
                          MANAGE
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CollapsibleSection>
        </TextCard>

        {/* Performance Management Section */}
        <TextCard title="PERFORMANCE GOALS MANAGEMENT">
          <CollapsibleSection
            title="PERFORMANCE GOALS MANAGEMENT"
            isExpanded={isPerformanceManagementExpanded}
            onToggle={() =>
              setIsPerformanceManagementExpanded(
                !isPerformanceManagementExpanded
              )
            }
            badgeText={`${performanceGoals.length} goals`}
          >
            <div className="space-y-6">
              {/* Performance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border border-black">
                  <TextHierarchy level={1} emphasis>
                    {performanceGoals.length}
                  </TextHierarchy>
                  <TextHierarchy level={2} muted>
                    TOTAL GOALS
                  </TextHierarchy>
                </div>
                <div className="text-center p-4 border border-black">
                  <TextHierarchy level={1} emphasis>
                    {
                      performanceGoals.filter(
                        (g) => g.month_year === getCurrentMonthYear()
                      ).length
                    }
                  </TextHierarchy>
                  <TextHierarchy level={2} muted>
                    CURRENT MONTH
                  </TextHierarchy>
                </div>
                <div className="text-center p-4 border border-black">
                  <TextHierarchy level={1} emphasis>
                    {Math.round(
                      performanceGoals.reduce(
                        (acc, goal) =>
                          acc +
                          calculatePerformancePercentage(
                            goal.completed_hours,
                            goal.target_hours,
                            goal.completed_story_points,
                            goal.target_story_points
                          ),
                        0
                      ) / (performanceGoals.length || 1)
                    )}
                    %
                  </TextHierarchy>
                  <TextHierarchy level={2} muted>
                    AVG PERFORMANCE
                  </TextHierarchy>
                </div>
              </div>

              {/* Performance Filter */}
              <div className="flex gap-2">
                {[
                  { key: "current", label: "CURRENT MONTH" },
                  { key: "past", label: "PAST MONTHS" },
                  { key: "all", label: "ALL GOALS" },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setPerformanceFilter(option.key as any)}
                    className={`
                    px-3 py-1 border font-mono text-xs transition-colors
                    ${
                      performanceFilter === option.key
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-black hover:bg-gray-100"
                    }
                  `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Create Goal Button */}
              <div className="flex justify-between items-center">
                <TextHierarchy level={1} emphasis>
                  PERFORMANCE GOALS
                </TextHierarchy>
                <button
                  onClick={() => setShowPerformanceModal(true)}
                  className="px-4 py-2 border-2 border-black bg-white text-black font-mono text-sm hover:bg-black hover:text-white transition-colors font-bold"
                >
                  SET GOALS
                </button>
              </div>

              {/* Performance Goals List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getFilteredPerformanceGoals().length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <TextHierarchy level={1} muted>
                      No performance goals found for the selected filter.
                    </TextHierarchy>
                  </div>
                ) : (
                  getFilteredPerformanceGoals().map((goal) => {
                    const performancePercentage =
                      calculatePerformancePercentage(
                        goal.completed_hours,
                        goal.target_hours,
                        goal.completed_story_points,
                        goal.target_story_points
                      );

                    return (
                      <div
                        key={goal.id}
                        className="bg-white border-2 border-black p-6 hover:shadow-lg transition-all duration-200"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <TextHierarchy
                              level={1}
                              emphasis
                              className="text-lg mb-2"
                            >
                              {goal.user.first_name} {goal.user.last_name}
                            </TextHierarchy>
                            <div className="flex gap-2">
                              <TextBadge variant="default" className="text-xs">
                                {goal.month_year}
                              </TextBadge>
                              <TextBadge
                                variant={
                                  performancePercentage >= 100
                                    ? "success"
                                    : performancePercentage >= 70
                                    ? "warning"
                                    : "error"
                                }
                                className="text-xs"
                              >
                                {Math.round(performancePercentage)}%
                              </TextBadge>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bars */}
                        <div className="space-y-3 mb-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-mono">HOURS</span>
                              <span className="font-mono">
                                {goal.completed_hours}/{goal.target_hours}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 h-2">
                              <div
                                className="bg-blue-500 h-2 transition-all duration-300"
                                style={{
                                  width: `${Math.min(
                                    (goal.completed_hours / goal.target_hours) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-mono">STORY POINTS</span>
                              <span className="font-mono">
                                {goal.completed_story_points}/
                                {goal.target_story_points}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 h-2">
                              <div
                                className="bg-green-500 h-2 transition-all duration-300"
                                style={{
                                  width: `${Math.min(
                                    (goal.completed_story_points /
                                      goal.target_story_points) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Monthly Checklist */}
                        {goal.monthly_checklist &&
                          goal.monthly_checklist.length > 0 && (
                            <div className="mb-4">
                              <div className="text-sm text-gray-600 font-mono mb-2">
                                MONTHLY CHECKLIST:
                              </div>
                              <div className="text-xs text-gray-700 bg-gray-50 p-3 border-l-4 border-gray-300 rounded-r">
                                {goal.monthly_checklist.map(
                                  (item: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex items-center gap-2"
                                    >
                                      <span
                                        className={
                                          item.completed
                                            ? "text-green-500"
                                            : "text-gray-400"
                                        }
                                      >
                                        {item.completed ? "✓" : "○"}
                                      </span>
                                      <span>{item.title}</span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {/* Footer */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <div className="text-xs text-gray-500 font-mono">
                            ID: {goal.id.substring(0, 8)}...
                          </div>
                          <button
                            onClick={() => {
                              setSelectedUser(
                                users.find((u) => u.id === goal.user_id) || null
                              );
                              setShowPerformanceModal(true);
                            }}
                            className="px-3 py-1 border border-black bg-white text-black font-mono text-xs hover:bg-black hover:text-white transition-colors"
                          >
                            EDIT
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </CollapsibleSection>
        </TextCard>

        {/* Dynamic Checklists Management Section */}
        <TextCard title="DYNAMIC CHECKLISTS MANAGEMENT">
          <CollapsibleSection
            title="DYNAMIC CHECKLISTS MANAGEMENT"
            isExpanded={isChecklistManagementExpanded}
            onToggle={() =>
              setIsChecklistManagementExpanded(!isChecklistManagementExpanded)
            }
            badgeText={`${dynamicChecklists.length} checklists`}
          >
            <div className="space-y-6">
              {/* Error/Success Messages */}
              {checklistError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <TextHierarchy level={2} className="text-red-800 mb-2">
                    ❌ ERROR:
                  </TextHierarchy>
                  <div className="text-sm text-red-700 font-mono">
                    {checklistError}
                  </div>
                  <button
                    onClick={() => setChecklistError(null)}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                  >
                    DISMISS
                  </button>
                </div>
              )}

              {checklistSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <TextHierarchy level={2} className="text-green-800 mb-2">
                    ✅ SUCCESS:
                  </TextHierarchy>
                  <div className="text-sm text-green-700 font-mono">
                    {checklistSuccess}
                  </div>
                </div>
              )}
              {/* Checklist Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border border-black">
                  <TextHierarchy level={1} emphasis>
                    {dynamicChecklists.length}
                  </TextHierarchy>
                  <TextHierarchy level={2} muted>
                    TOTAL CHECKLISTS
                  </TextHierarchy>
                </div>
                <div className="text-center p-4 border border-black">
                  <TextHierarchy level={1} emphasis>
                    {dynamicChecklists.filter((c) => c.is_global).length}
                  </TextHierarchy>
                  <TextHierarchy level={2} muted>
                    GLOBAL CHECKLISTS
                  </TextHierarchy>
                </div>
                <div className="text-center p-4 border border-black">
                  <TextHierarchy level={1} emphasis>
                    {dynamicChecklists.filter((c) => !c.is_global).length}
                  </TextHierarchy>
                  <TextHierarchy level={2} muted>
                    CUSTOM CHECKLISTS
                  </TextHierarchy>
                </div>
              </div>

              {/* Checklist Filter */}
              <div className="flex gap-2">
                {[
                  { key: "all", label: "ALL CHECKLISTS" },
                  { key: "existing", label: "EXISTING" },
                  { key: "global", label: "GLOBAL" },
                  { key: "custom", label: "CUSTOM" },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setChecklistFilter(option.key as any)}
                    className={`
                    px-3 py-1 border font-mono text-xs transition-colors
                    ${
                      checklistFilter === option.key
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-black hover:bg-gray-100"
                    }
                  `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Create Checklist Button */}
              <div className="flex justify-between items-center">
                <TextHierarchy level={1} emphasis>
                  CHECKLIST ITEMS
                </TextHierarchy>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        setChecklistError(null);
                        const { data, error } = await getAllDynamicChecklists();
                        if (error) {
                          setChecklistError(
                            `Database check failed: ${error.message}`
                          );
                        } else {
                          setChecklistSuccess(
                            `Database connected! Found ${
                              data?.length || 0
                            } checklists.`
                          );
                          setTimeout(() => setChecklistSuccess(null), 3000);
                        }
                      } catch (err) {
                        setChecklistError(
                          `Database check error: ${
                            err instanceof Error ? err.message : "Unknown error"
                          }`
                        );
                      }
                    }}
                    className="px-3 py-2 border border-blue-300 bg-white text-blue-600 font-mono text-xs hover:bg-blue-50 transition-colors"
                  >
                    CHECK DB
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        setChecklistError(null);
                        const testData = {
                          title: `Test Checklist ${Date.now()}`,
                          description:
                            "This is a test checklist created by the owner",
                          category: "general",
                          is_global: false,
                        };
                        await handleCreateDynamicChecklist(testData);
                      } catch (err) {
                        setChecklistError(
                          `Test creation failed: ${
                            err instanceof Error ? err.message : "Unknown error"
                          }`
                        );
                      }
                    }}
                    className="px-3 py-2 border border-green-300 bg-white text-green-600 font-mono text-xs hover:bg-green-50 transition-colors"
                  >
                    TEST CREATE
                  </button>
                  <button
                    onClick={() => {
                      setSelectedChecklist(null);
                      setShowChecklistModal(true);
                    }}
                    className="px-4 py-2 border-2 border-black bg-white text-black font-mono text-sm hover:bg-black hover:text-white transition-colors font-bold"
                  >
                    CREATE CHECKLIST
                  </button>
                </div>
              </div>

              {/* Checklists List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getFilteredDynamicChecklists().length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <TextHierarchy level={1} muted>
                      No checklists found for the selected filter.
                    </TextHierarchy>
                  </div>
                ) : (
                  getFilteredDynamicChecklists().map((checklist) => (
                    <div
                      key={checklist.id}
                      className="bg-white border-2 border-black p-6 hover:shadow-lg transition-all duration-200"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <TextHierarchy
                            level={1}
                            emphasis
                            className="text-lg mb-2"
                          >
                            {checklist.title}
                          </TextHierarchy>
                          <div className="flex gap-2">
                            <TextBadge
                              variant={
                                checklist.is_global ? "success" : "default"
                              }
                              className="text-xs"
                            >
                              {checklist.is_global ? "GLOBAL" : "CUSTOM"}
                            </TextBadge>
                            <TextBadge
                              variant="muted"
                              className="text-xs capitalize"
                            >
                              {checklist.category}
                            </TextBadge>
                            {"user_assignment" in checklist &&
                              checklist.user_assignment?.is_required && (
                                <TextBadge variant="error" className="text-xs">
                                  REQUIRED
                                </TextBadge>
                              )}
                            <TextBadge
                              variant={
                                checklist.is_active ? "success" : "error"
                              }
                              className="text-xs"
                            >
                              {checklist.is_active ? "ACTIVE" : "INACTIVE"}
                            </TextBadge>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {checklist.description && (
                        <div className="mb-4">
                          <div className="text-sm text-gray-600 font-mono mb-2">
                            DESCRIPTION:
                          </div>
                          <div className="text-sm text-gray-800 bg-gray-50 p-3 border-l-4 border-gray-300 rounded-r">
                            {checklist.description}
                          </div>
                        </div>
                      )}

                      {/* Assignments Count */}
                      <div className="mb-4">
                        <div className="text-sm text-gray-600 font-mono mb-2">
                          ASSIGNMENTS:
                        </div>
                        <div className="text-sm text-gray-800">
                          {checklist.assignments?.length || 0} user(s) assigned
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500 font-mono">
                          ID: {checklist.id.substring(0, 8)}...
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedChecklist(checklist);
                              setShowChecklistModal(true);
                            }}
                            className="px-3 py-1 border border-black bg-white text-black font-mono text-xs hover:bg-black hover:text-white transition-colors"
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteDynamicChecklist(checklist.id)
                            }
                            className="px-3 py-1 border border-red-300 bg-white text-red-600 font-mono text-xs hover:bg-red-50 transition-colors"
                          >
                            DELETE
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CollapsibleSection>
        </TextCard>
      </PageLayout>

      {/* Dynamic Checklist Modal */}
      {showChecklistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white border border-black p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <TextHierarchy level={1} emphasis className="mb-4">
              {selectedChecklist ? "EDIT CHECKLIST" : "CREATE NEW CHECKLIST"}
            </TextHierarchy>

            <DynamicChecklistForm
              checklist={selectedChecklist}
              onSubmit={
                selectedChecklist
                  ? handleUpdateDynamicChecklist
                  : handleCreateDynamicChecklist
              }
              onCancel={() => {
                setShowChecklistModal(false);
                setSelectedChecklist(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Performance Goal Modal */}
      {showPerformanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white border border-black p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <TextHierarchy level={1} emphasis className="mb-4">
              {selectedUser
                ? `SET GOALS FOR ${selectedUser.first_name} ${selectedUser.last_name}`
                : "SET PERFORMANCE GOALS"}
            </TextHierarchy>

            <PerformanceGoalForm
              user={selectedUser as any}
              onSubmit={handleCreatePerformanceGoal}
              onCancel={() => {
                setShowPerformanceModal(false);
                setSelectedUser(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Ticket Management Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white border border-black p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <TextHierarchy level={1} emphasis className="mb-4">
              MANAGE TICKET
            </TextHierarchy>

            <div className="space-y-4 mb-6">
              <div>
                <TextHierarchy level={2} emphasis>
                  Title:
                </TextHierarchy>
                <div className="text-sm">{selectedTicket.title}</div>
              </div>

              <div>
                <TextHierarchy level={2} emphasis>
                  Description:
                </TextHierarchy>
                <div className="text-sm bg-gray-50 p-3 border">
                  {selectedTicket.description}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <TextHierarchy level={2} emphasis className="mb-2">
                  Status:
                </TextHierarchy>
                <div className="flex gap-2">
                  {["open", "in_progress", "resolved", "closed"].map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() =>
                          handleTicketUpdate(selectedTicket.id, { status })
                        }
                        className={`
                        px-3 py-1 border font-mono text-xs transition-colors
                        ${
                          selectedTicket.status === status
                            ? "bg-black text-white border-black"
                            : "bg-white text-black border-black hover:bg-gray-100"
                        }
                      `}
                      >
                        {status.toUpperCase()}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <TextHierarchy level={2} emphasis className="mb-2">
                  Priority:
                </TextHierarchy>
                <div className="flex gap-2">
                  {["low", "medium", "high", "urgent"].map((priority) => (
                    <button
                      key={priority}
                      onClick={() =>
                        handleTicketUpdate(selectedTicket.id, { priority })
                      }
                      className={`
                        px-3 py-1 border font-mono text-xs transition-colors
                        ${
                          selectedTicket.priority === priority
                            ? "bg-black text-white border-black"
                            : "bg-white text-black border-black hover:bg-gray-100"
                        }
                      `}
                    >
                      {priority.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <TextHierarchy level={2} emphasis className="mb-2">
                  Resolution Notes:
                </TextHierarchy>
                <textarea
                  value={selectedTicket.resolution_notes || ""}
                  onChange={(e) =>
                    setSelectedTicket({
                      ...selectedTicket,
                      resolution_notes: e.target.value,
                    })
                  }
                  placeholder="Add resolution notes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-black bg-white text-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() =>
                    handleTicketUpdate(selectedTicket.id, {
                      resolution_notes: selectedTicket.resolution_notes,
                    })
                  }
                  className="mt-2 px-3 py-1 border border-black bg-white text-black font-mono text-xs hover:bg-black hover:text-white transition-colors"
                >
                  UPDATE NOTES
                </button>
              </div>
            </div>

            <div className="flex gap-4 justify-end mt-6">
              <button
                onClick={() => {
                  setShowTicketModal(false);
                  setSelectedTicket(null);
                }}
                className="px-4 py-2 border border-black bg-white text-black font-mono text-sm hover:bg-black hover:text-white transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Checklist Modal */}
      {showExistingChecklistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white border border-black p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <TextHierarchy level={1} emphasis className="mb-4">
              EDIT EXISTING CHECKLIST
            </TextHierarchy>

            <ExistingChecklistForm
              checklist={selectedExistingChecklist}
              onSubmit={handleUpdateExistingChecklist}
              onCancel={() => {
                setShowExistingChecklistModal(false);
                setSelectedExistingChecklist(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Transaction Confirmation Dialog */}
      {showDeleteTransactionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white border border-black p-6 max-w-md w-full mx-4">
            <div className="space-y-4">
              <div>
                <TextHierarchy level={1} emphasis className="mb-2">
                  DELETE TRANSACTION
                </TextHierarchy>
                <TextHierarchy level={2} muted>
                  Are you sure you want to delete this transaction? This action
                  cannot be undone and will permanently remove the transaction
                  from the system.
                </TextHierarchy>
              </div>

              {transactionToDelete && (
                <div className="p-3 border border-gray-300 bg-gray-50">
                  <TextHierarchy
                    level={2}
                    className="font-mono text-xs text-gray-600"
                  >
                    TRANSACTION ID: {transactionToDelete.substring(0, 8)}...
                  </TextHierarchy>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <TextButton
                  onClick={handleCancelDeleteTransaction}
                  variant="default"
                  className="px-4 py-2"
                >
                  CANCEL
                </TextButton>
                <TextButton
                  onClick={handleConfirmDeleteTransaction}
                  variant="error"
                  className="px-4 py-2"
                >
                  DELETE TRANSACTION
                </TextButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
