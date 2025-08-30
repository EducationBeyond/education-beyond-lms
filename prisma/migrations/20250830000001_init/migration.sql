-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "ReservationChannel" AS ENUM ('MEET', 'ONSITE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PairingStatus" AS ENUM ('PENDING', 'ACTIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExternalProvider" AS ENUM ('GOOGLE', 'HUBSPOT', 'MONEYFORWARD', 'LINE', 'SLACK');

-- CreateEnum
CREATE TYPE "FileOwnerType" AS ENUM ('STUDENT', 'TUTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "FileScope" AS ENUM ('PRIVATE', 'STUDENT_PARENT', 'STUDENT_TUTOR', 'PUBLIC');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CRMEntityType" AS ENUM ('PARENT', 'STUDENT', 'TUTOR');

-- CreateEnum
CREATE TYPE "MessageEntityType" AS ENUM ('PARENT', 'TUTOR');

-- Enable CITEXT extension
CREATE EXTENSION IF NOT EXISTS citext;

-- CreateTable
CREATE TABLE "parents" (
    "id" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "google_email" CITEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "birthdate" DATE,
    "gender" "Gender",
    "interests" TEXT[],
    "cautions" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutors" (
    "id" TEXT NOT NULL,
    "google_email" CITEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "affiliation" TEXT,
    "specialties" TEXT[],
    "avatar_url" TEXT,
    "payout_info" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "tutors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "google_email" CITEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "summary" TEXT NOT NULL,
    "materials" TEXT[],
    "duration_min" INTEGER NOT NULL,
    "score" INTEGER,
    "tags" TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "learning_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "start_at" TIMESTAMPTZ NOT NULL,
    "end_at" TIMESTAMPTZ NOT NULL,
    "channel" "ReservationChannel" NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pairings" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "status" "PairingStatus" NOT NULL DEFAULT 'PENDING',
    "score" DOUBLE PRECISION,
    "started_at" TIMESTAMPTZ,
    "ended_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "pairings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availabilities" (
    "id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "start_at" TIMESTAMPTZ NOT NULL,
    "end_at" TIMESTAMPTZ NOT NULL,
    "recurrence" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "provider" "ExternalProvider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "join_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_files" (
    "id" TEXT NOT NULL,
    "provider" "ExternalProvider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "owner_type" "FileOwnerType" NOT NULL,
    "scope" "FileScope" NOT NULL,
    "learning_record_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "drive_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "provider" "ExternalProvider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JPY',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "received_at" TIMESTAMPTZ,
    "due_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_contacts" (
    "id" TEXT NOT NULL,
    "provider" "ExternalProvider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "entity_type" "CRMEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "crm_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_links" (
    "id" TEXT NOT NULL,
    "provider" "ExternalProvider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "channel_url" TEXT NOT NULL,
    "entity_type" "MessageEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "message_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parents_email_key" ON "parents"("email");

-- CreateIndex
CREATE INDEX "parents_email_idx" ON "parents"("email");

-- CreateIndex
CREATE INDEX "parents_deleted_at_idx" ON "parents"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "students_google_email_key" ON "students"("google_email");

-- CreateIndex
CREATE INDEX "students_google_email_idx" ON "students"("google_email");

-- CreateIndex
CREATE INDEX "students_parent_id_idx" ON "students"("parent_id");

-- CreateIndex
CREATE INDEX "students_deleted_at_idx" ON "students"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "tutors_google_email_key" ON "tutors"("google_email");

-- CreateIndex
CREATE INDEX "tutors_google_email_idx" ON "tutors"("google_email");

-- CreateIndex
CREATE INDEX "tutors_deleted_at_idx" ON "tutors"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "admins_google_email_key" ON "admins"("google_email");

-- CreateIndex
CREATE INDEX "admins_google_email_idx" ON "admins"("google_email");

-- CreateIndex
CREATE INDEX "admins_deleted_at_idx" ON "admins"("deleted_at");

-- CreateIndex
CREATE INDEX "learning_records_student_id_idx" ON "learning_records"("student_id");

-- CreateIndex
CREATE INDEX "learning_records_tutor_id_idx" ON "learning_records"("tutor_id");

-- CreateIndex
CREATE INDEX "learning_records_date_idx" ON "learning_records"("date");

-- CreateIndex
CREATE INDEX "learning_records_deleted_at_idx" ON "learning_records"("deleted_at");

-- CreateIndex
CREATE INDEX "reservations_student_id_idx" ON "reservations"("student_id");

-- CreateIndex
CREATE INDEX "reservations_tutor_id_idx" ON "reservations"("tutor_id");

-- CreateIndex
CREATE INDEX "reservations_start_at_idx" ON "reservations"("start_at");

-- CreateIndex
CREATE INDEX "reservations_status_idx" ON "reservations"("status");

-- CreateIndex
CREATE INDEX "reservations_deleted_at_idx" ON "reservations"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "pairings_student_id_tutor_id_key" ON "pairings"("student_id", "tutor_id");

-- CreateIndex
CREATE INDEX "pairings_student_id_idx" ON "pairings"("student_id");

-- CreateIndex
CREATE INDEX "pairings_tutor_id_idx" ON "pairings"("tutor_id");

-- CreateIndex
CREATE INDEX "pairings_status_idx" ON "pairings"("status");

-- CreateIndex
CREATE INDEX "pairings_deleted_at_idx" ON "pairings"("deleted_at");

-- CreateIndex
CREATE INDEX "availabilities_tutor_id_idx" ON "availabilities"("tutor_id");

-- CreateIndex
CREATE INDEX "availabilities_start_at_idx" ON "availabilities"("start_at");

-- CreateIndex
CREATE INDEX "availabilities_deleted_at_idx" ON "availabilities"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_reservation_id_key" ON "calendar_events"("reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_provider_external_id_key" ON "calendar_events"("provider", "external_id");

-- CreateIndex
CREATE INDEX "calendar_events_provider_idx" ON "calendar_events"("provider");

-- CreateIndex
CREATE INDEX "calendar_events_deleted_at_idx" ON "calendar_events"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "drive_files_provider_external_id_key" ON "drive_files"("provider", "external_id");

-- CreateIndex
CREATE INDEX "drive_files_owner_id_owner_type_idx" ON "drive_files"("owner_id", "owner_type");

-- CreateIndex
CREATE INDEX "drive_files_scope_idx" ON "drive_files"("scope");

-- CreateIndex
CREATE INDEX "drive_files_learning_record_id_idx" ON "drive_files"("learning_record_id");

-- CreateIndex
CREATE INDEX "drive_files_deleted_at_idx" ON "drive_files"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_external_id_key" ON "payments"("provider", "external_id");

-- CreateIndex
CREATE INDEX "payments_parent_id_idx" ON "payments"("parent_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_received_at_idx" ON "payments"("received_at");

-- CreateIndex
CREATE INDEX "payments_due_date_idx" ON "payments"("due_date");

-- CreateIndex
CREATE INDEX "payments_deleted_at_idx" ON "payments"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "crm_contacts_provider_external_id_key" ON "crm_contacts"("provider", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_contacts_entity_type_entity_id_key" ON "crm_contacts"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "crm_contacts_email_idx" ON "crm_contacts"("email");

-- CreateIndex
CREATE INDEX "crm_contacts_deleted_at_idx" ON "crm_contacts"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "message_links_provider_external_id_key" ON "message_links"("provider", "external_id");

-- CreateIndex
CREATE INDEX "message_links_entity_type_entity_id_idx" ON "message_links"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "message_links_deleted_at_idx" ON "message_links"("deleted_at");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_records" ADD CONSTRAINT "learning_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_records" ADD CONSTRAINT "learning_records_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pairings" ADD CONSTRAINT "pairings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pairings" ADD CONSTRAINT "pairings_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_files" ADD CONSTRAINT "drive_files_learning_record_id_fkey" FOREIGN KEY ("learning_record_id") REFERENCES "learning_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;