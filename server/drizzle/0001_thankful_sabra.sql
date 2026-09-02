CREATE TYPE "public"."booking_status_enum" AS ENUM('confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."currency_enum" AS ENUM('INR');--> statement-breakpoint
CREATE TYPE "public"."facility_status_enum" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."payment_status_enum" AS ENUM('pending', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."role_enum" AS ENUM('user', 'facility_owner', 'admin');--> statement-breakpoint
CREATE TYPE "public"."venue_type_enum" AS ENUM('indoor', 'outdoor', 'sports_complex', 'stadium', 'other');--> statement-breakpoint
CREATE TABLE "amenities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "amenities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "booking_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"changed_by" uuid,
	"old_status" "booking_status_enum",
	"new_status" "booking_status_enum" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_reference" text NOT NULL,
	"user_id" uuid NOT NULL,
	"court_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"price_amount" numeric(12, 2) NOT NULL,
	"price_currency" "currency_enum" DEFAULT 'INR' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"total_currency" "currency_enum" DEFAULT 'INR' NOT NULL,
	"status" "booking_status_enum" DEFAULT 'confirmed' NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_booking_reference_unique" UNIQUE("booking_reference"),
	CONSTRAINT "bookings_valid_time" CHECK ("bookings"."start_time" < "bookings"."end_time"),
	CONSTRAINT "bookings_positive_duration" CHECK ("bookings"."duration_minutes" > 0),
	CONSTRAINT "bookings_price_positive" CHECK ("bookings"."price_amount" > 0),
	CONSTRAINT "bookings_total_amount_non_negative" CHECK ("bookings"."total_amount" >= 0),
	CONSTRAINT "bookings_currency_consistency" CHECK ("bookings"."price_currency" = "bookings"."total_currency"),
	CONSTRAINT "bookings_cancellation_fields_valid" CHECK ((status = 'cancelled')
             OR (
                 cancelled_at IS NULL
                 AND cancellation_reason IS NULL
             ))
);
--> statement-breakpoint
CREATE TABLE "court_operating_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"court_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time,
	"end_time" time,
	"is_closed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "court_operating_hours_day_check" CHECK ("court_operating_hours"."day_of_week" BETWEEN 0 AND 6),
	CONSTRAINT "court_operating_hours_valid_time" CHECK ((is_closed = true)
             OR (
                 is_closed = false
                 AND start_time IS NOT NULL
                 AND end_time IS NOT NULL
                 AND start_time < end_time
             ))
);
--> statement-breakpoint
CREATE TABLE "courts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"sport_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price_amount" numeric(12, 2) NOT NULL,
	"price_currency" "currency_enum" DEFAULT 'INR' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courts_price_positive" CHECK ("courts"."price_amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"address_line" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"venue_type" "venue_type_enum" NOT NULL,
	"status" "facility_status_enum" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "facilities_latitude_valid" CHECK (latitude IS NULL
             OR latitude BETWEEN -90 AND 90),
	CONSTRAINT "facilities_longitude_valid" CHECK (longitude IS NULL
             OR longitude BETWEEN -180 AND 180)
);
--> statement-breakpoint
CREATE TABLE "facility_amenities" (
	"facility_id" uuid NOT NULL,
	"amenity_id" uuid NOT NULL,
	CONSTRAINT "facility_amenities_facility_id_amenity_id_pk" PRIMARY KEY("facility_id","amenity_id")
);
--> statement-breakpoint
CREATE TABLE "facility_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"image_key" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "facility_photos_display_order_check" CHECK ("facility_photos"."display_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "facility_sports" (
	"facility_id" uuid NOT NULL,
	"sport_id" uuid NOT NULL,
	CONSTRAINT "facility_sports_facility_id_sport_id_pk" PRIMARY KEY("facility_id","sport_id")
);
--> statement-breakpoint
CREATE TABLE "facility_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"old_status" "facility_status_enum",
	"new_status" "facility_status_enum" NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"court_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "maintenance_blocks_valid_time" CHECK ("maintenance_blocks"."start_time" < "maintenance_blocks"."end_time")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"booking_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_check" CHECK ("reviews"."rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "sports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "sports_name_unique" UNIQUE("name"),
	CONSTRAINT "sports_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_google_id_unique";--> statement-breakpoint
DROP INDEX "users_email_idx";--> statement-breakpoint
DROP INDEX "users_google_id_idx";--> statement-breakpoint
DROP INDEX "users_is_deleted_idx";--> statement-breakpoint
DROP INDEX "users_deleted_at_idx";--> statement-breakpoint
DROP INDEX "users_recovery_expires_at_idx";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "order_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'INR'::"public"."currency_enum";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "currency" SET DATA TYPE "public"."currency_enum" USING "currency"::"public"."currency_enum";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."payment_status_enum";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "status" SET DATA TYPE "public"."payment_status_enum" USING "status"::"public"."payment_status_enum";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "profile_image" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "booking_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_court_id_courts_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_operating_hours" ADD CONSTRAINT "court_operating_hours_court_id_courts_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courts" ADD CONSTRAINT "courts_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courts" ADD CONSTRAINT "courts_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_amenities" ADD CONSTRAINT "facility_amenities_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_amenities" ADD CONSTRAINT "facility_amenities_amenity_id_amenities_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_photos" ADD CONSTRAINT "facility_photos_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_sports" ADD CONSTRAINT "facility_sports_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_sports" ADD CONSTRAINT "facility_sports_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_status_history" ADD CONSTRAINT "facility_status_history_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_status_history" ADD CONSTRAINT "facility_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_blocks" ADD CONSTRAINT "maintenance_blocks_court_id_courts_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_blocks" ADD CONSTRAINT "maintenance_blocks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_status_history_booking_idx" ON "booking_status_history" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_status_history_created_at_idx" ON "booking_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "bookings_user_id_idx" ON "bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookings_court_id_idx" ON "bookings" USING btree ("court_id");--> statement-breakpoint
CREATE INDEX "bookings_court_start_idx" ON "bookings" USING btree ("court_id","start_time");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_start_time_idx" ON "bookings" USING btree ("start_time");--> statement-breakpoint
CREATE UNIQUE INDEX "court_operating_hours_court_day_unique_idx" ON "court_operating_hours" USING btree ("court_id","day_of_week");--> statement-breakpoint
CREATE INDEX "courts_facility_id_idx" ON "courts" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "courts_sport_id_idx" ON "courts" USING btree ("sport_id");--> statement-breakpoint
CREATE INDEX "courts_facility_sport_idx" ON "courts" USING btree ("facility_id","sport_id");--> statement-breakpoint
CREATE UNIQUE INDEX "courts_facility_name_unique_idx" ON "courts" USING btree ("facility_id","name");--> statement-breakpoint
CREATE INDEX "facilities_owner_id_idx" ON "facilities" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "facilities_status_idx" ON "facilities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "facilities_city_idx" ON "facilities" USING btree ("city");--> statement-breakpoint
CREATE INDEX "facilities_venue_type_idx" ON "facilities" USING btree ("venue_type");--> statement-breakpoint
CREATE INDEX "facility_photos_facility_id_idx" ON "facility_photos" USING btree ("facility_id");--> statement-breakpoint
CREATE UNIQUE INDEX "facility_photos_one_primary_idx" ON "facility_photos" USING btree ("facility_id") WHERE "facility_photos"."is_primary" = true;--> statement-breakpoint
CREATE INDEX "facility_sports_sport_id_idx" ON "facility_sports" USING btree ("sport_id");--> statement-breakpoint
CREATE INDEX "facility_status_history_facility_idx" ON "facility_status_history" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "facility_status_history_created_at_idx" ON "facility_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "maintenance_blocks_court_time_idx" ON "maintenance_blocks" USING btree ("court_id","start_time");--> statement-breakpoint
CREATE INDEX "reviews_facility_id_idx" ON "reviews" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "reviews_user_id_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_user_booking_unique_idx" ON "reviews" USING btree ("user_id","booking_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_booking_id_unique_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_google_id_unique_idx" ON "users" USING btree ("google_id");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "users_deleted_idx" ON "users" USING btree ("is_deleted");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_non_negative" CHECK ("payments"."amount" >= 0);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_paid_at_consistency" CHECK ((status = 'success' AND paid_at IS NOT NULL)
             OR
             (status <> 'success'));