/*
  Warnings:

  - You are about to alter the column `role` on the `candidate` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.
  - You are about to drop the column `timestamp` on the `conversation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `candidate` MODIFY `role` ENUM('CANDIDATE', 'ADMIN') NOT NULL DEFAULT 'CANDIDATE';

-- AlterTable
ALTER TABLE `conversation` DROP COLUMN `timestamp`;

-- AlterTable
ALTER TABLE `job` ADD COLUMN `department` VARCHAR(191) NULL,
    ADD COLUMN `jobType` VARCHAR(191) NULL,
    ADD COLUMN `location` VARCHAR(191) NULL,
    ADD COLUMN `salary` VARCHAR(191) NULL;
