"use client";

import { useState, useTransition } from "react";
import { applyGlobalReplaceAction, previewGlobalReplaceAction, undoLastReplacementAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { GLOBAL_REPLACE_EXISTING_MAX, GLOBAL_REPLACE_NEW_MAX, type ReplacementHistoryEntry } from "@/data/global-replace";
import { formatDateTime } from "@/lib/format";
import type { GlobalReplaceMatch } from "@/lib/global-replace";
import { AdminSection } from "./AdminSection";
import { TextField } from "./fields";

function groupBySection(matches: GlobalReplaceMatch[]) {
  const groups: { sectionLabel: string; items: GlobalReplaceMatch[] }[] = [];
  for (const m of matches) {
    let group = groups.find((g) => g.sectionLabel === m.sectionLabel);
    if (!group) {
      group = { sectionLabel: m.sectionLabel, items: [] };
      groups.push(group);
    }
    group.items.push(m);
  }
  return groups;
}

const snippet = (s: string) => (s.length > 70 ? `${s.slice(0, 70)}…` : s);

export function GlobalReplaceCard({ initialHistory, initialCanUndo }: { initialHistory: ReplacementHistoryEntry[]; initialCanUndo: boolean }) {
  const { toast } = useToast();
  const [existingText, setExistingText] = useState("");
  const [newText, setNewText] = useState("");
  const [caseInsensitive, setCaseInsensitive] = useState(false);
  const [partial, setPartial] = useState(false);
  const [matches, setMatches] = useState<GlobalReplaceMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [history, setHistory] = useState(initialHistory);
  const [canUndo, setCanUndo] = useState(initialCanUndo);
  const [previewPending, startPreview] = useTransition();
  const [applyPending, startApply] = useTransition();
  const [undoPending, startUndo] = useTransition();

  const readyToPreview = existingText.trim().length > 0 && newText.trim().length > 0;
  const canReplace = matches !== null && matches.length > 0;

  function resetPreview() {
    setMatches(null);
    setError(null);
  }

  function onPreview() {
    setError(null);
    startPreview(async () => {
      const res = await previewGlobalReplaceAction(existingText, newText, { caseInsensitive, partial });
      if (!res.ok) {
        setError(res.error ?? "Unable to preview.");
        setMatches(null);
        return;
      }
      setMatches(res.matches ?? []);
    });
  }

  function onApplyConfirmed() {
    startApply(async () => {
      const res = await applyGlobalReplaceAction(existingText, newText, { caseInsensitive, partial });
      if (!res.ok) {
        setConfirmOpen(false);
        setError(res.error ?? "Unable to replace text.");
        return;
      }
      setConfirmOpen(false);
      setError(null);
      setMatches(null);
      if (res.historyState) {
        setHistory(res.historyState.history);
        setCanUndo(res.historyState.canUndo);
      }
      const n = res.matchCount ?? 0;
      toast(`Text replaced successfully — ${n} occurrence${n === 1 ? "" : "s"} replaced.`);
    });
  }

  function onUndo() {
    startUndo(async () => {
      const res = await undoLastReplacementAction();
      if (!res.ok) {
        toast(res.error ?? "Unable to undo.");
        return;
      }
      if (res.historyState) {
        setHistory(res.historyState.history);
        setCanUndo(res.historyState.canUndo);
      }
      resetPreview();
      toast("Last replacement undone");
    });
  }

  const groups = matches ? groupBySection(matches) : [];

  return (
    <AdminSection title="Global Text Replacement" description="Replace matching text across user-facing content.">
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Existing Text"
            value={existingText}
            onChange={(v) => {
              setExistingText(v);
              resetPreview();
            }}
            placeholder="Enter the current text"
            max={GLOBAL_REPLACE_EXISTING_MAX}
          />
          <TextField
            label="New Text"
            value={newText}
            onChange={(v) => {
              setNewText(v);
              resetPreview();
            }}
            placeholder="Enter the replacement text"
            max={GLOBAL_REPLACE_NEW_MAX}
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={caseInsensitive}
              onChange={(e) => {
                setCaseInsensitive(e.target.checked);
                resetPreview();
              }}
              className="h-4 w-4 accent-brand"
            />
            Case insensitive
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={partial}
              onChange={(e) => {
                setPartial(e.target.checked);
                resetPreview();
              }}
              className="h-4 w-4 accent-brand"
            />
            Replace partial matches
          </label>
        </div>

        {partial && (
          <div className="rounded-xl border border-[#f0c987] bg-[#fdf3dd] p-4 text-sm text-[#8a6116]">
            <p className="font-medium">Partial match mode is riskier.</p>
            <p className="mt-1 leading-relaxed">
              Text inside longer sentences can change too — e.g. replacing “account” with “profile” could turn “View account information” into
              “View profile information.” Review the preview carefully before replacing.
            </p>
          </div>
        )}

        {error && <p role="alert" className="text-[13px] text-debit">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={onPreview} loading={previewPending} disabled={!readyToPreview || previewPending}>
            Preview Matches
          </Button>
          <Button type="button" onClick={() => setConfirmOpen(true)} disabled={!canReplace || applyPending}>
            Replace All Matches
          </Button>
          {canUndo && (
            <Button type="button" variant="secondary" onClick={onUndo} loading={undoPending} disabled={undoPending}>
              Undo Last Replacement
            </Button>
          )}
        </div>

        {matches !== null && (
          <div className="rounded-xl border border-line p-4">
            {matches.length === 0 ? (
              <p className="text-sm text-muted">No matching user-facing content found.</p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  {matches.length} match{matches.length === 1 ? "" : "es"} found
                </p>
                <div className="mt-3 space-y-3">
                  {groups.map((g) => (
                    <div key={g.sectionLabel}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{g.sectionLabel}</p>
                      <ul className="mt-1 space-y-1">
                        {g.items.map((m) => (
                          <li key={m.path} className="text-sm text-ink">
                            <span className="text-muted">— </span>
                            {m.fieldLabel}
                            <span className="ml-1.5 text-xs text-muted">“{snippet(m.currentText)}”</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Replacement history</p>
            <div className="divide-y divide-line rounded-xl border border-line">
              {history.map((h) => (
                <div key={h.id} className="px-4 py-3 text-sm">
                  <p className="break-words">
                    <span className="font-medium">“{h.existingText}”</span> <span className="text-muted">→</span>{" "}
                    <span className="font-medium">“{h.newText}”</span>
                    {h.undone && <span className="ml-2 rounded-full bg-canvas px-2 py-0.5 text-xs text-muted">Undone</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {h.matchCount} match{h.matchCount === 1 ? "" : "es"} · {formatDateTime(h.at)} · {h.adminName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal open={confirmOpen} onClose={() => !applyPending && setConfirmOpen(false)} title="Replace text everywhere?" description="This will update all matching user-facing content.">
        <div className="space-y-3">
          <p className="text-sm">
            Existing: <span className="font-medium">“{existingText}”</span>
          </p>
          <p className="text-sm">
            New: <span className="font-medium">“{newText}”</span>
          </p>
          <p className="text-sm">
            Matches: <span className="font-medium">{matches?.length ?? 0}</span>
          </p>
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)} disabled={applyPending}>
              Cancel
            </Button>
            <Button type="button" onClick={onApplyConfirmed} loading={applyPending}>
              {applyPending ? "Replacing…" : `Replace ${matches?.length ?? 0} Match${matches?.length === 1 ? "" : "es"}`}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminSection>
  );
}
