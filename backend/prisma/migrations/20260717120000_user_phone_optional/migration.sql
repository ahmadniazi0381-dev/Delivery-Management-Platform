-- AlterTable: allow Google users without phone until profile/checkout
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;
