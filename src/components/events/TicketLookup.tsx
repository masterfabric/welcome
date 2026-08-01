"use client";

import { useState } from "react";
import TextCard from "@/components/ui/TextCard";
import TextButton from "@/components/ui/TextButton";
import TextHierarchy from "@/components/ui/TextHierarchy";
import TextBadge from "@/components/ui/TextBadge";
import EventTicket from "./EventTicket";
import {
  getParticipantByReference,
  getParticipantsByEmail,
} from "@/lib/repositories/events";

interface Participant {
  participant_id: string;
  reference_number: string;
  full_name: string;
  email: string;
  title?: string;
  company?: string;
  event_id: string;
  event_title: string;
  event_date: string;
  event_location?: string;
  registration_date: string;
}

export default function TicketLookup() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lookupType, setLookupType] = useState<"reference" | "email">(
    "reference"
  );
  const [referenceNumber, setReferenceNumber] = useState("");
  const [email, setEmail] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReferenceLookup = async () => {
    if (!referenceNumber.trim()) {
      setError("Please enter a reference number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await getParticipantByReference(referenceNumber);

      if (error) {
        throw error;
      }

      setParticipants(data ? [data] : []);
    } catch (err) {
      console.error("Reference lookup error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to find participant"
      );
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLookup = async () => {
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await getParticipantsByEmail(email);

      if (error) {
        throw error;
      }

      setParticipants(data || []);
    } catch (err) {
      console.error("Email lookup error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to find participants"
      );
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupType === "reference") {
      handleReferenceLookup();
    } else {
      handleEmailLookup();
    }
  };

  return (
    <div className="space-y-6">
      <TextCard title="TICKET LOOKUP">
        {/* Collapsible Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between mb-4 p-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors"
        >
          <p className="emphasis">
            🔍 {isExpanded ? "HIDE TICKET SEARCH" : "SEARCH FOR YOUR TICKET"}
          </p>
          <span className="text-xl font-bold leading-tight pr-1">
            {isExpanded ? "▲" : "▼"}
          </span>
        </button>

        {isExpanded && (
          <div className="space-y-4">
            {/* Lookup Type Selection */}
            <div className="flex gap-3">
              <TextButton
                variant={lookupType === "reference" ? "success" : "default"}
                onClick={() => {
                  setLookupType("reference");
                  setError(null);
                  setParticipants([]);
                }}
              >
                REFERENCE NUMBER
              </TextButton>
              <TextButton
                variant={lookupType === "email" ? "success" : "default"}
                onClick={() => {
                  setLookupType("email");
                  setError(null);
                  setParticipants([]);
                }}
              >
                EMAIL ADDRESS
              </TextButton>
            </div>

            {/* Lookup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {lookupType === "reference" ? (
                <div>
                  <p className="mb-2">REFERENCE NUMBER</p>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) =>
                      setReferenceNumber(e.target.value.toUpperCase())
                    }
                    placeholder="Enter your reference number"
                    className="w-full px-3 py-2 bg-white border border-gray-600 text-black font-mono text-sm focus:border-green-500 focus:outline-none uppercase"
                  />
                </div>
              ) : (
                <div>
                  <TextHierarchy level={2} className="mb-2">
                    EMAIL ADDRESS
                  </TextHierarchy>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-3 py-2 bg-white border border-gray-600 text-black font-mono text-sm focus:border-green-500 focus:outline-none"
                  />
                </div>
              )}

              <TextButton
                type="submit"
                variant="success"
                disabled={loading}
                className="w-full"
              >
                {loading ? "SEARCHING..." : "FIND TICKETS"}
              </TextButton>
            </form>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-600 p-3 rounded">
                <TextHierarchy level={2} className="text-red-400">
                  <TextBadge variant="error">ERROR</TextBadge> {error}
                </TextHierarchy>
              </div>
            )}

            {/* No Results */}
            {!loading &&
              !error &&
              participants.length === 0 &&
              (referenceNumber || email) && (
                <div className="bg-white border-2 border-gray-600 p-4 rounded">
                  <TextHierarchy level={2} emphasis>
                    <TextBadge variant="warning">NO TICKETS FOUND</TextBadge>
                  </TextHierarchy>
                  <TextHierarchy level={2} muted className="mt-2">
                    {lookupType === "reference"
                      ? "No tickets found with this reference number."
                      : "No tickets found with this email address."}
                  </TextHierarchy>
                </div>
              )}
          </div>
        )}
      </TextCard>

      {/* Display Tickets */}
      {participants.length > 0 && (
        <div className="space-y-4">
          <TextHierarchy level={1} emphasis>
            YOUR TICKETS ({participants.length})
          </TextHierarchy>
          {participants.map((participant) => (
            <EventTicket
              key={participant.participant_id}
              participant={participant}
            />
          ))}
        </div>
      )}
    </div>
  );
}
