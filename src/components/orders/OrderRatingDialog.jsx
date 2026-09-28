import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

/**
 * In-app rating dialog for a completed food order or transport booking.
 * Lets the user leave a 1–5 star score and an optional comment, stored
 * as a ServiceRating linked to the order.
 */
export default function OrderRatingDialog({ open, onOpenChange, order }) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  if (!order) return null;
  const type = order._type || "food";

  const submit = async () => {
    if (score < 1 || score > 5) {
      toast({ title: "Pick a star rating first", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.ServiceRating.create({
        rating_type: type,
        related_order_id: order.id,
        score,
        comment: comment.trim(),
        voice_transcript: "",
      });
      toast({ title: "Thanks for your rating!" });
      onOpenChange(false);
      setScore(0);
      setComment("");
    } catch (e) {
      toast({ title: "Could not save rating", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate your {type === "transport" ? "trip" : "order"}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center gap-1 py-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="p-1"
              aria-label={`${n} star`}
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  (hover || score) >= n ? "fill-primary text-primary" : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 300))}
          placeholder="Quick comment (optional)…"
          rows={3}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
            Submit rating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}