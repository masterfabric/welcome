"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import TextCard from "@/components/ui/TextCard";
import TextButton from "@/components/ui/TextButton";
import TextHierarchy from "@/components/ui/TextHierarchy";
import TextBadge from "@/components/ui/TextBadge";
import EventTicket from "@/components/events/EventTicket";
import {
  getOwnerEvents,
  getEventParticipants,
  updateEvent,
  deleteEvent,
  createEvent,
} from "@/lib/repositories/events";
import { captureException } from "@/lib/sentry";

interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  max_participants?: number;
  participant_count: number;
  is_upcoming?: boolean;
  is_published: boolean;
  is_active: boolean;
  created_at: string;
}

interface Participant {
  id: string;
  reference_number: string;
  full_name: string;
  email: string;
  title?: string;
  company?: string;
  registration_date: string;
}

export default function OwnerEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Participant | null>(
    null
  );
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const { data, error } = await getOwnerEvents();

      if (error) {
        throw error;
      }

      // Get participant counts for each event
      const eventsWithCounts = await Promise.all(
        (data || []).map(async (event) => {
          const { data: participants } = await getEventParticipants(event.id);
          return {
            ...event,
            participant_count: participants?.length || 0,
          };
        })
      );

      setEvents(eventsWithCounts);
    } catch (err) {
      console.error("Error fetching events:", err);
      captureException(err, {
        tags: { page: "events-owner", operation: "fetch_events" },
      });
      setError(err instanceof Error ? err.message : "Failed to fetch events");
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchParticipants = async (eventId: string) => {
    try {
      setLoadingParticipants(true);
      const { data, error } = await getEventParticipants(eventId);

      if (error) {
        throw error;
      }

      setParticipants(data || []);
    } catch (err) {
      console.error("Error fetching participants:", err);
      captureException(err, {
        tags: { page: "events-owner", operation: "fetch_participants" },
        extra: { eventId },
      });
      setError(
        err instanceof Error ? err.message : "Failed to fetch participants"
      );
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleEventSelect = (event: Event) => {
    if (selectedEvent && selectedEvent.id === event.id) {
      // collapse if clicking the same card
      setSelectedEvent(null);
      setParticipants([]);
      return;
    }
    setSelectedEvent(event);
    fetchParticipants(event.id);
  };

  const handlePublishToggle = async (
    eventId: string,
    currentStatus: boolean
  ) => {
    try {
      const { error } = await updateEvent(eventId, {
        is_published: !currentStatus,
      });

      if (error) {
        throw error;
      }

      // Refresh events list
      fetchEvents();
    } catch (err) {
      console.error("Error updating event:", err);
      captureException(err, {
        tags: { page: "events-owner", operation: "update_event" },
        extra: { eventId },
      });
      setError(err instanceof Error ? err.message : "Failed to update event");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const { error } = await deleteEvent(eventId);

      if (error) {
        throw error;
      }

      // Refresh events list
      fetchEvents();
      setSelectedEvent(null);
      setParticipants([]);
    } catch (err) {
      console.error("Error deleting event:", err);
      captureException(err, {
        tags: { page: "events-owner", operation: "delete_event" },
        extra: { eventId },
      });
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      <PageLayout
        title="EVENT MANAGEMENT"
        subtitle="Create and Manage Your Events"
      >
        {/* Navigation */}
        <TextCard title="NAVIGATION">
          <div className="flex gap-3">
            <TextButton
              variant="default"
              onClick={() => router.push("/events")}
            >
              ← BACK TO EVENTS
            </TextButton>
            <TextButton
              variant={createOpen ? "warning" : "success"}
              onClick={() => setCreateOpen((v) => !v)}
            >
              {createOpen ? "HIDE CREATE FORM" : "CREATE NEW EVENT"}
            </TextButton>
          </div>
        </TextCard>

        {createOpen && (
          <TextCard title="CREATE EVENT">
            <CreateEventForm
              onCreated={() => {
                setCreateOpen(false);
                fetchEvents();
              }}
            />
          </TextCard>
        )}

        {editingEvent && (
          <TextCard title="EDIT EVENT">
            <EditEventForm
              event={editingEvent}
              onUpdated={() => {
                setEditingEvent(null);
                fetchEvents();
                // If the edited event is currently selected, refresh its data
                if (selectedEvent?.id === editingEvent.id) {
                  setSelectedEvent(null);
                }
              }}
              onCancel={() => setEditingEvent(null)}
            />
          </TextCard>
        )}

        {/* Error Message */}
        {error && (
          <TextCard title="ERROR" variant="error">
            <TextHierarchy level={1} muted>
              {error}
            </TextHierarchy>
          </TextCard>
        )}

        {/* Events List - Vertical Layout */}
        <TextCard title="ALL EVENTS">
          {loadingEvents ? (
            <TextHierarchy level={1} muted>
              Loading events...
            </TextHierarchy>
          ) : events.length === 0 ? (
            <TextHierarchy level={1} muted>
              No events found.
            </TextHierarchy>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border border-black p-4 bg-white"
                >
                  <div className="flex flex-col md:flex-row items-start justify-between mb-3 gap-4">
                    <div className="flex-1">
                      <TextHierarchy level={1} emphasis className="text-lg">
                        {event.title}
                      </TextHierarchy>
                      <p className="muted mt-1">
                        📅 {formatDate(event.event_date)}
                      </p>
                      {event.location && (
                        <p className="muted">📍 {event.location}</p>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      <TextBadge
                        variant={event.is_published ? "success" : "warning"}
                      >
                        {event.is_published ? "PUBLISHED" : "DRAFT"}
                      </TextBadge>
                      <TextBadge
                        variant={event.is_active ? "success" : "error"}
                      >
                        {event.is_active ? "ACTIVE" : "INACTIVE"}
                      </TextBadge>
                      <TextButton
                        variant="default"
                        onClick={() => setEditingEvent(event)}
                        className="text-xs"
                      >
                        EDIT
                      </TextButton>
                    </div>
                  </div>

                  {event.description && (
                    <p className="muted mb-3">{event.description}</p>
                  )}

                  <div className="flex flex-col md:flex-row items-center justify-between pt-3 border-t border-gray-200 gap-2">
                    <div className="w-full md:w-auto flex items-center gap-4">
                      <p className="muted">
                        👥 {event.participant_count} participants
                      </p>
                      {event.max_participants && (
                        <p className="muted">(max {event.max_participants})</p>
                      )}
                    </div>
                    <div className="flex flex-col w-full md:w-auto md:flex-row gap-2">
                      <TextButton
                        variant="default"
                        onClick={() => handleEventSelect(event)}
                      >
                        {selectedEvent?.id === event.id
                          ? "HIDE DETAILS"
                          : "VIEW DETAILS"}
                      </TextButton>
                      <TextButton
                        variant={event.is_published ? "warning" : "success"}
                        onClick={() =>
                          handlePublishToggle(event.id, event.is_published)
                        }
                      >
                        {event.is_published ? "UNPUBLISH" : "PUBLISH"}
                      </TextButton>
                      <TextButton
                        variant="error"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        DELETE
                      </TextButton>
                    </div>
                  </div>

                  {/* Event Details Expanded */}
                  {selectedEvent?.id === event.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <TextHierarchy level={1} emphasis className="mb-3">
                        PARTICIPANTS
                      </TextHierarchy>
                      {loadingParticipants ? (
                        <TextHierarchy level={1} muted>
                          Loading participants...
                        </TextHierarchy>
                      ) : participants.length === 0 ? (
                        <TextHierarchy level={1} muted>
                          No participants yet.
                        </TextHierarchy>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {participants.map((participant) => (
                            <div
                              key={participant.id}
                              className="border border-gray-300 p-3 rounded bg-gray-50 relative"
                            >
                              {/* Delete Icon Button - Top Right */}
                              <button
                                onClick={async () => {
                                  if (
                                    confirm(
                                      `Remove ${participant.full_name} from this event?`
                                    )
                                  ) {
                                    try {
                                      const supabase = await import(
                                        "@/lib/supabase"
                                      ).then((m) => m.supabase);
                                      const { error } = await supabase
                                        .from("event_participants")
                                        .delete()
                                        .eq("id", participant.id);

                                      if (error) throw error;

                                      // Refresh participants list
                                      if (selectedEvent) {
                                        fetchParticipants(selectedEvent.id);
                                        fetchEvents();
                                      }
                                    } catch (err) {
                                      console.error(
                                        "Delete participant error:",
                                        err
                                      );
                                      captureException(err, {
                                        tags: {
                                          page: "events-owner",
                                          operation: "delete_participant",
                                        },
                                        extra: {
                                          participantId: participant.id,
                                        },
                                      });
                                      alert("Failed to remove participant");
                                    }
                                  }
                                }}
                                className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center rounded-full"
                                title="Remove Participant"
                              >
                                ✕
                              </button>

                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-mono font-bold flex-shrink-0">
                                  {getInitials(participant.full_name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <TextHierarchy
                                    level={1}
                                    emphasis
                                    className="truncate"
                                  >
                                    {participant.full_name}
                                  </TextHierarchy>
                                  <TextHierarchy
                                    level={2}
                                    muted
                                    className="truncate text-xs"
                                  >
                                    {participant.email}
                                  </TextHierarchy>
                                  {participant.title && (
                                    <TextHierarchy
                                      level={2}
                                      muted
                                      className="text-xs"
                                    >
                                      💼 {participant.title}
                                    </TextHierarchy>
                                  )}
                                  {participant.company && (
                                    <TextHierarchy
                                      level={2}
                                      muted
                                      className="text-xs"
                                    >
                                      🏢 {participant.company}
                                    </TextHierarchy>
                                  )}
                                  <TextHierarchy
                                    level={2}
                                    muted
                                    className="text-xs mt-1"
                                  >
                                    📅{" "}
                                    {formatDate(participant.registration_date)}
                                  </TextHierarchy>
                                </div>
                              </div>
                              {/* QR Code Icon Button - Bottom Right */}
                              <button
                                onClick={() => setSelectedTicket(participant)}
                                className="absolute bottom-2 right-2 w-8 h-8 bg-white border-2 border-black hover:bg-black hover:text-white transition-colors flex items-center justify-center group"
                                title="View Ticket"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                  stroke="currentColor"
                                  className="w-5 h-5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TextCard>
      </PageLayout>

      {/* Ticket Popup Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-black text-white hover:bg-red-600 transition-colors flex items-center justify-center z-10"
            >
              ✕
            </button>

            {/* Ticket Component */}
            <div className="p-6">
              <EventTicket
                participant={{
                  participant_id: selectedTicket.id,
                  reference_number: selectedTicket.reference_number,
                  full_name: selectedTicket.full_name,
                  email: selectedTicket.email,
                  event_id: selectedEvent?.id || "",
                  event_title: selectedEvent?.title || "",
                  event_date: selectedEvent?.event_date || "",
                  event_location: selectedEvent?.location,
                  registration_date: selectedTicket.registration_date,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EditEventForm({
  event,
  onUpdated,
  onCancel,
}: {
  event: Event;
  onUpdated: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: event.title,
    description: event.description || "",
    event_date: event.event_date.slice(0, 16), // Format for datetime-local
    location: event.location || "",
    max_participants:
      event.max_participants?.toString() || ("" as number | string),
    is_upcoming: event.is_upcoming ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { error } = await updateEvent(event.id, {
        title: form.title,
        description: form.description || undefined,
        event_date: form.event_date,
        location: form.location || undefined,
        max_participants: form.max_participants
          ? Number(form.max_participants)
          : undefined,
        is_upcoming: form.is_upcoming,
      });

      if (error) throw error;

      onUpdated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <TextHierarchy level={2} className="mb-2">
          TITLE
        </TextHierarchy>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white border border-gray-600 text-black font-mono text-sm focus:border-green-500 focus:outline-none"
          placeholder="Event title"
          required
        />
      </div>
      <div>
        <TextHierarchy level={2} className="mb-2">
          DESCRIPTION
        </TextHierarchy>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white border border-gray-600 text-black font-mono text-sm focus:border-green-500 focus:outline-none"
          placeholder="Event description"
          rows={3}
        />
      </div>
      <div>
        <TextHierarchy level={2} className="mb-2">
          DATE/TIME
        </TextHierarchy>
        <input
          type="datetime-local"
          name="event_date"
          value={form.event_date}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white border border-gray-600 text-black font-mono text-sm focus:border-green-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <TextHierarchy level={2} className="mb-2">
          LOCATION
        </TextHierarchy>
        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white border border-gray-600 text-black font-mono text-sm focus:border-green-500 focus:outline-none"
          placeholder="Event location"
        />
      </div>
      <div>
        <TextHierarchy level={2} className="mb-2">
          MAX PARTICIPANTS (optional)
        </TextHierarchy>
        <input
          type="number"
          name="max_participants"
          value={form.max_participants}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white border border-gray-600 text-black font-mono text-sm focus:border-green-500 focus:outline-none"
          placeholder="Leave empty for unlimited"
          min="1"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_upcoming"
          checked={form.is_upcoming}
          onChange={handleCheckbox}
        />
        <TextHierarchy level={2}>Show in upcoming</TextHierarchy>
      </div>
      {error && (
        <div className="bg-red-900/20 border border-red-600 p-3 rounded">
          <TextHierarchy level={2} className="text-red-400">
            Error: {error}
          </TextHierarchy>
        </div>
      )}
      <div className="flex gap-3">
        <TextButton
          type="submit"
          variant="success"
          disabled={submitting}
          className="flex-1"
        >
          {submitting ? "UPDATING..." : "UPDATE EVENT"}
        </TextButton>
        <TextButton
          type="button"
          variant="default"
          onClick={onCancel}
          disabled={submitting}
        >
          CANCEL
        </TextButton>
      </div>
    </form>
  );
}

function CreateEventForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    max_participants: "" as number | string,
    is_upcoming: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { error } = await createEvent({
        title: form.title,
        description: form.description || undefined,
        event_date: form.event_date,
        location: form.location || undefined,
        max_participants: form.max_participants
          ? Number(form.max_participants)
          : undefined,
        is_upcoming: form.is_upcoming,
      });

      if (error) throw error;

      onCreated();
      setForm({
        title: "",
        description: "",
        event_date: "",
        location: "",
        max_participants: "",
        is_upcoming: true,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <TextHierarchy level={2} className="mb-2">
          TITLE
        </TextHierarchy>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white border border-gray-600 text-black font-mono text-sm focus:border-green-500 focus:outline-none"
          placeholder="Event title"
          required
        />
      </div>
      <div>
        <TextHierarchy level={2} className="mb-2">
          DESCRIPTION
        </TextHierarchy>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white border border-gray-600 text-black font-mono text-sm focus:border-green-500 focus:outline-none"
          placeholder="Event description"
          rows={3}
        />
      </div>
      <div>
        <TextHierarchy level={2} className="mb-2">
          DATE/TIME
        </TextHierarchy>
        <input
          type="datetime-local"
          name="event_date"
          value={form.event_date}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white border border-gray-600 text-black font-mono text-sm focus:border-green-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <TextHierarchy level={2} className="mb-2">
          LOCATION
        </TextHierarchy>
        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white border border-gray-600 text-black font-mono text-sm focus:border-green-500 focus:outline-none"
          placeholder="Location or Online"
        />
      </div>
      <div>
        <TextHierarchy level={2} className="mb-2">
          MAX PARTICIPANTS
        </TextHierarchy>
        <input
          type="number"
          name="max_participants"
          value={form.max_participants}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white border border-gray-600 text-black font-mono text-sm focus:border-green-500 focus:outline-none"
          placeholder="Leave empty for unlimited"
          min={0}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_upcoming"
          checked={form.is_upcoming}
          onChange={handleCheckbox}
        />
        <TextHierarchy level={2}>Show in upcoming</TextHierarchy>
      </div>
      {error && (
        <TextHierarchy level={2} className="text-red-400">
          {error}
        </TextHierarchy>
      )}
      <div className="flex gap-3">
        <TextButton type="submit" variant="success" disabled={submitting}>
          {submitting ? "CREATING..." : "CREATE EVENT"}
        </TextButton>
      </div>
    </form>
  );
}
