-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- Enable CITEXT extension
CREATE EXTENSION IF NOT EXISTS citext;

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "public"."ReservationChannel" AS ENUM ('MEET', 'ONSITE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."PairingStatus" AS ENUM ('PENDING', 'ACTIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ExternalProvider" AS ENUM ('GOOGLE', 'HUBSPOT', 'MONEYFORWARD', 'LINE', 'SLACK');

-- CreateEnum
CREATE TYPE "public"."FileOwnerType" AS ENUM ('STUDENT', 'TUTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."FileScope" AS ENUM ('PRIVATE', 'STUDENT_PARENT', 'STUDENT_TUTOR', 'PUBLIC');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."CRMEntityType" AS ENUM ('PARENT', 'STUDENT', 'TUTOR');

-- CreateEnum
CREATE TYPE "public"."MessageEntityType" AS ENUM ('PARENT', 'TUTOR');

-- CreateEnum
CREATE TYPE "public"."MessageSender" AS ENUM ('STUDENT', 'TUTOR');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('STUDENT', 'TUTOR', 'PARENT');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" CITEXT,
    "email_verified" TIMESTAMPTZ(6),
    "name" TEXT,
    "image" TEXT,
    "password_hash" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "oauth_token_secret" TEXT,
    "oauth_token" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("provider","provider_account_id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."parents" (
    "id" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "address_detail" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "first_name_kana" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "last_name_kana" TEXT NOT NULL,
    "name_alphabet" TEXT NOT NULL,
    "password" TEXT,
    "phone_number" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "prefecture" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."students" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "birthdate" DATE NOT NULL,
    "gender" "public"."Gender" NOT NULL,
    "interests" TEXT[],
    "cautions" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "email" CITEXT,
    "entry_type" TEXT,
    "first_name" TEXT NOT NULL,
    "first_name_kana" TEXT NOT NULL,
    "gifted_episodes" TEXT NOT NULL,
    "how_did_you_know" TEXT,
    "last_name" TEXT NOT NULL,
    "last_name_kana" TEXT NOT NULL,
    "name_alphabet" TEXT NOT NULL,
    "password" TEXT,
    "school_name" TEXT NOT NULL,
    "user_id" TEXT,
    "line_user_id" TEXT,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tutors" (
    "id" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL,
    "specialties" TEXT[],
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "account_number" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "address_detail" TEXT NOT NULL,
    "bank_code" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "branch_code" TEXT NOT NULL,
    "branch_name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "education" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "first_name_kana" TEXT NOT NULL,
    "interview_calendar_url" TEXT,
    "last_name" TEXT NOT NULL,
    "last_name_kana" TEXT NOT NULL,
    "lesson_calendar_url" TEXT,
    "name_alphabet" TEXT NOT NULL,
    "nearest_station" TEXT NOT NULL,
    "password" TEXT,
    "phone_number" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "prefecture" TEXT NOT NULL,
    "self_introduction" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slack_user_id" TEXT,

    CONSTRAINT "tutors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."AdminRole" NOT NULL DEFAULT 'ADMIN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "email" CITEXT NOT NULL,
    "password" TEXT,
    "user_id" TEXT,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."learning_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "summary" TEXT NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "additional_notes" TEXT,
    "good_points" TEXT,
    "homework" TEXT,
    "improvement_points" TEXT,
    "student_late" BOOLEAN NOT NULL DEFAULT false,
    "tutor_late" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "learning_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reservations" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "channel" "public"."ReservationChannel" NOT NULL,
    "status" "public"."ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pairings" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "status" "public"."PairingStatus" NOT NULL DEFAULT 'PENDING',
    "score" DOUBLE PRECISION,
    "started_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "line_group_id" TEXT,
    "slack_channel_id" TEXT,

    CONSTRAINT "pairings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."calendar_events" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "provider" "public"."ExternalProvider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "join_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."drive_files" (
    "id" TEXT NOT NULL,
    "provider" "public"."ExternalProvider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "owner_type" "public"."FileOwnerType" NOT NULL,
    "scope" "public"."FileScope" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "drive_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "provider" "public"."ExternalProvider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JPY',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "received_at" TIMESTAMPTZ(6),
    "due_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crm_contacts" (
    "id" TEXT NOT NULL,
    "provider" "public"."ExternalProvider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "entity_type" "public"."CRMEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "crm_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_links" (
    "id" TEXT NOT NULL,
    "provider" "public"."ExternalProvider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "channel_url" TEXT NOT NULL,
    "entity_type" "public"."MessageEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "message_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "pairing_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_type" "public"."MessageSender" NOT NULL,
    "content" TEXT NOT NULL,
    "message_type" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "status" "public"."MessageStatus" NOT NULL DEFAULT 'SENT',
    "external_id" TEXT,
    "thread_id" TEXT,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."external_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_type" "public"."UserType" NOT NULL,
    "provider" "public"."ExternalProvider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "channel_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "external_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "public"."sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "parents_email_key" ON "public"."parents"("email");

-- CreateIndex
CREATE UNIQUE INDEX "parents_user_id_key" ON "public"."parents"("user_id");

-- CreateIndex
CREATE INDEX "parents_email_idx" ON "public"."parents"("email");

-- CreateIndex
CREATE INDEX "parents_deleted_at_idx" ON "public"."parents"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "public"."students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "public"."students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_line_user_id_key" ON "public"."students"("line_user_id");

-- CreateIndex
CREATE INDEX "students_parent_id_idx" ON "public"."students"("parent_id");

-- CreateIndex
CREATE INDEX "students_deleted_at_idx" ON "public"."students"("deleted_at");

-- CreateIndex
CREATE INDEX "students_line_user_id_idx" ON "public"."students"("line_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tutors_email_key" ON "public"."tutors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tutors_user_id_key" ON "public"."tutors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tutors_slack_user_id_key" ON "public"."tutors"("slack_user_id");

-- CreateIndex
CREATE INDEX "tutors_email_idx" ON "public"."tutors"("email");

-- CreateIndex
CREATE INDEX "tutors_deleted_at_idx" ON "public"."tutors"("deleted_at");

-- CreateIndex
CREATE INDEX "tutors_slack_user_id_idx" ON "public"."tutors"("slack_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "public"."admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_user_id_key" ON "public"."admins"("user_id");

-- CreateIndex
CREATE INDEX "admins_email_idx" ON "public"."admins"("email");

-- CreateIndex
CREATE INDEX "admins_deleted_at_idx" ON "public"."admins"("deleted_at");

-- CreateIndex
CREATE INDEX "learning_records_student_id_idx" ON "public"."learning_records"("student_id");

-- CreateIndex
CREATE INDEX "learning_records_tutor_id_idx" ON "public"."learning_records"("tutor_id");

-- CreateIndex
CREATE INDEX "learning_records_date_idx" ON "public"."learning_records"("date");

-- CreateIndex
CREATE INDEX "learning_records_deleted_at_idx" ON "public"."learning_records"("deleted_at");

-- CreateIndex
CREATE INDEX "reservations_student_id_idx" ON "public"."reservations"("student_id");

-- CreateIndex
CREATE INDEX "reservations_tutor_id_idx" ON "public"."reservations"("tutor_id");

-- CreateIndex
CREATE INDEX "reservations_start_at_idx" ON "public"."reservations"("start_at");

-- CreateIndex
CREATE INDEX "reservations_status_idx" ON "public"."reservations"("status");

-- CreateIndex
CREATE INDEX "reservations_deleted_at_idx" ON "public"."reservations"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "pairings_line_group_id_key" ON "public"."pairings"("line_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "pairings_slack_channel_id_key" ON "public"."pairings"("slack_channel_id");

-- CreateIndex
CREATE INDEX "pairings_student_id_idx" ON "public"."pairings"("student_id");

-- CreateIndex
CREATE INDEX "pairings_tutor_id_idx" ON "public"."pairings"("tutor_id");

-- CreateIndex
CREATE INDEX "pairings_status_idx" ON "public"."pairings"("status");

-- CreateIndex
CREATE INDEX "pairings_deleted_at_idx" ON "public"."pairings"("deleted_at");

-- CreateIndex
CREATE INDEX "pairings_line_group_id_idx" ON "public"."pairings"("line_group_id");

-- CreateIndex
CREATE INDEX "pairings_slack_channel_id_idx" ON "public"."pairings"("slack_channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "pairings_student_id_tutor_id_key" ON "public"."pairings"("student_id", "tutor_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_reservation_id_key" ON "public"."calendar_events"("reservation_id");

-- CreateIndex
CREATE INDEX "calendar_events_provider_idx" ON "public"."calendar_events"("provider");

-- CreateIndex
CREATE INDEX "calendar_events_deleted_at_idx" ON "public"."calendar_events"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_provider_external_id_key" ON "public"."calendar_events"("provider", "external_id");

-- CreateIndex
CREATE INDEX "drive_files_owner_id_owner_type_idx" ON "public"."drive_files"("owner_id", "owner_type");

-- CreateIndex
CREATE INDEX "drive_files_scope_idx" ON "public"."drive_files"("scope");

-- CreateIndex
CREATE INDEX "drive_files_deleted_at_idx" ON "public"."drive_files"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "drive_files_provider_external_id_key" ON "public"."drive_files"("provider", "external_id");

-- CreateIndex
CREATE INDEX "payments_parent_id_idx" ON "public"."payments"("parent_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "public"."payments"("status");

-- CreateIndex
CREATE INDEX "payments_received_at_idx" ON "public"."payments"("received_at");

-- CreateIndex
CREATE INDEX "payments_due_date_idx" ON "public"."payments"("due_date");

-- CreateIndex
CREATE INDEX "payments_deleted_at_idx" ON "public"."payments"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_external_id_key" ON "public"."payments"("provider", "external_id");

-- CreateIndex
CREATE INDEX "crm_contacts_email_idx" ON "public"."crm_contacts"("email");

-- CreateIndex
CREATE INDEX "crm_contacts_deleted_at_idx" ON "public"."crm_contacts"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "crm_contacts_provider_external_id_key" ON "public"."crm_contacts"("provider", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_contacts_entity_type_entity_id_key" ON "public"."crm_contacts"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "message_links_entity_type_entity_id_idx" ON "public"."message_links"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "message_links_deleted_at_idx" ON "public"."message_links"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "message_links_provider_external_id_key" ON "public"."message_links"("provider", "external_id");

-- CreateIndex
CREATE INDEX "messages_pairing_id_idx" ON "public"."messages"("pairing_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_sender_type_idx" ON "public"."messages"("sender_id", "sender_type");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "public"."messages"("created_at");

-- CreateIndex
CREATE INDEX "messages_status_idx" ON "public"."messages"("status");

-- CreateIndex
CREATE INDEX "messages_deleted_at_idx" ON "public"."messages"("deleted_at");

-- CreateIndex
CREATE INDEX "external_accounts_user_id_user_type_idx" ON "public"."external_accounts"("user_id", "user_type");

-- CreateIndex
CREATE INDEX "external_accounts_provider_idx" ON "public"."external_accounts"("provider");

-- CreateIndex
CREATE INDEX "external_accounts_deleted_at_idx" ON "public"."external_accounts"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "external_accounts_provider_external_id_key" ON "public"."external_accounts"("provider", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_accounts_user_id_user_type_provider_key" ON "public"."external_accounts"("user_id", "user_type", "provider");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parents" ADD CONSTRAINT "parents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tutors" ADD CONSTRAINT "tutors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admins" ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."learning_records" ADD CONSTRAINT "learning_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."learning_records" ADD CONSTRAINT "learning_records_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pairings" ADD CONSTRAINT "pairings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pairings" ADD CONSTRAINT "pairings_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."calendar_events" ADD CONSTRAINT "calendar_events_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_pairing_id_fkey" FOREIGN KEY ("pairing_id") REFERENCES "public"."pairings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

