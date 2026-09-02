ALTER TABLE "bookings" DROP CONSTRAINT "bookings_cancellation_fields_valid";--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_paid_at_consistency";--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cancellation_fields_valid" CHECK ((status::text = 'CANCELLED')
             OR (
                 cancelled_at IS NULL
                 AND cancellation_reason IS NULL
             ));--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_paid_at_consistency" CHECK ((status::text = 'SUCCESS' AND paid_at IS NOT NULL)
             OR
             (status::text <> 'SUCCESS'));