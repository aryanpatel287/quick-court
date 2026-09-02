ALTER TABLE "bookings" DROP CONSTRAINT "bookings_cancellation_fields_valid";--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_paid_at_consistency";--> statement-breakpoint
ALTER TABLE "booking_status_history" ALTER COLUMN "old_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "booking_status_history" ALTER COLUMN "new_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED'::text;--> statement-breakpoint
DROP TYPE "public"."booking_status_enum";--> statement-breakpoint
CREATE TYPE "public"."booking_status_enum" AS ENUM('CONFIRMED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
ALTER TABLE "booking_status_history" ALTER COLUMN "old_status" SET DATA TYPE "public"."booking_status_enum" USING "old_status"::"public"."booking_status_enum";--> statement-breakpoint
ALTER TABLE "booking_status_history" ALTER COLUMN "new_status" SET DATA TYPE "public"."booking_status_enum" USING "new_status"::"public"."booking_status_enum";--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED'::"public"."booking_status_enum";--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "status" SET DATA TYPE "public"."booking_status_enum" USING "status"::"public"."booking_status_enum";--> statement-breakpoint
ALTER TABLE "facilities" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "facilities" ALTER COLUMN "status" SET DEFAULT 'PENDING'::text;--> statement-breakpoint
ALTER TABLE "facility_status_history" ALTER COLUMN "old_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "facility_status_history" ALTER COLUMN "new_status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."facility_status_enum";--> statement-breakpoint
CREATE TYPE "public"."facility_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
ALTER TABLE "facilities" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"public"."facility_status_enum";--> statement-breakpoint
ALTER TABLE "facilities" ALTER COLUMN "status" SET DATA TYPE "public"."facility_status_enum" USING "status"::"public"."facility_status_enum";--> statement-breakpoint
ALTER TABLE "facility_status_history" ALTER COLUMN "old_status" SET DATA TYPE "public"."facility_status_enum" USING "old_status"::"public"."facility_status_enum";--> statement-breakpoint
ALTER TABLE "facility_status_history" ALTER COLUMN "new_status" SET DATA TYPE "public"."facility_status_enum" USING "new_status"::"public"."facility_status_enum";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'PENDING'::text;--> statement-breakpoint
DROP TYPE "public"."payment_status_enum";--> statement-breakpoint
CREATE TYPE "public"."payment_status_enum" AS ENUM('PENDING', 'SUCCESS', 'FAILED');--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"public"."payment_status_enum";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "status" SET DATA TYPE "public"."payment_status_enum" USING "status"::"public"."payment_status_enum";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER'::text;--> statement-breakpoint
DROP TYPE "public"."role_enum";--> statement-breakpoint
CREATE TYPE "public"."role_enum" AS ENUM('USER', 'FACILITY_OWNER', 'ADMIN');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER'::"public"."role_enum";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."role_enum" USING "role"::"public"."role_enum";--> statement-breakpoint
ALTER TABLE "facilities" ALTER COLUMN "venue_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."venue_type_enum";--> statement-breakpoint
CREATE TYPE "public"."venue_type_enum" AS ENUM('INDOOR', 'OUTDOOR', 'SPORTS_COMPLEX', 'STADIUM', 'OTHER');--> statement-breakpoint
ALTER TABLE "facilities" ALTER COLUMN "venue_type" SET DATA TYPE "public"."venue_type_enum" USING "venue_type"::"public"."venue_type_enum";--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cancellation_fields_valid" CHECK ((status = 'CANCELLED')
             OR (
                 cancelled_at IS NULL
                 AND cancellation_reason IS NULL
             ));--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_paid_at_consistency" CHECK ((status = 'SUCCESS' AND paid_at IS NOT NULL)
             OR
             (status <> 'SUCCESS'));