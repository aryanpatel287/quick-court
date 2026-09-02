CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"guest_id" text,
	"title" text DEFAULT 'New chat' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid,
	"chat_id" uuid,
	"rag_file_id" uuid,
	"text" text NOT NULL,
	"markdown" text NOT NULL,
	"source" text,
	"metadata" jsonb,
	"document_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" text NOT NULL,
	"name" text NOT NULL,
	"size" integer NOT NULL,
	"file_path" text NOT NULL,
	"url" text NOT NULL,
	"file_type" text NOT NULL,
	"mimetype" text NOT NULL,
	"thumbnail_url" text,
	"width" integer,
	"height" integer,
	"ai_tags" jsonb,
	"message_id" uuid NOT NULL,
	"uploaded_by" uuid,
	"processing_status" text DEFAULT 'pending' NOT NULL,
	"rag_status" text DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"content" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"payment_id" text,
	"signature" text,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rag_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" text NOT NULL,
	"name" text NOT NULL,
	"size" integer NOT NULL,
	"file_path" text NOT NULL,
	"url" text NOT NULL,
	"file_type" text NOT NULL,
	"mimetype" text NOT NULL,
	"uploaded_by" uuid,
	"processing_status" text DEFAULT 'pending' NOT NULL,
	"rag_status" text DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"google_id" text,
	"profile_image" text DEFAULT 'https://ik.imagekit.io/2bzzjhgkg/defaul_profile_image.jpeg',
	"role" "role_enum" DEFAULT 'user' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"recovery_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_rag_file_id_rag_files_id_fk" FOREIGN KEY ("rag_file_id") REFERENCES "public"."rag_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rag_files" ADD CONSTRAINT "rag_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chats_user_id_idx" ON "chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chats_guest_id_idx" ON "chats" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "chunks_file_id_idx" ON "chunks" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "chunks_chat_id_idx" ON "chunks" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chunks_rag_file_id_idx" ON "chunks" USING btree ("rag_file_id");--> statement-breakpoint
CREATE INDEX "files_message_id_idx" ON "files" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "files_uploaded_by_idx" ON "files" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "messages_chat_id_idx" ON "messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_payment_id_idx" ON "payments" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_google_id_idx" ON "users" USING btree ("google_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_is_deleted_idx" ON "users" USING btree ("is_deleted");--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "users_recovery_expires_at_idx" ON "users" USING btree ("recovery_expires_at");