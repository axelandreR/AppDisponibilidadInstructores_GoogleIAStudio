-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "dni" VARCHAR(20),
    "role" "user_role" NOT NULL,
    "permissions" JSONB DEFAULT '{}',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_periods" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN DEFAULT false,
    "is_open_for_submission" BOOLEAN DEFAULT false,

    CONSTRAINT "academic_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "instructor_id" VARCHAR(50) NOT NULL,
    "period_id" VARCHAR(20) NOT NULL,
    "slots" JSONB NOT NULL,
    "comments" TEXT,
    "is_final" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_avail_instructor_period" ON "availability_versions"("instructor_id", "period_id");

-- CreateIndex
CREATE INDEX "idx_avail_final_reporting" ON "availability_versions"("period_id", "is_final");

-- AddForeignKey
ALTER TABLE "availability_versions" ADD CONSTRAINT "availability_versions_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_versions" ADD CONSTRAINT "availability_versions_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "academic_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
