-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionType` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `sectionOrder` INTEGER NOT NULL,
    `defaultTimeSeconds` INTEGER NOT NULL DEFAULT 45,

    UNIQUE INDEX `QuestionType_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `typeId` VARCHAR(191) NOT NULL,
    `prompt` VARCHAR(191) NOT NULL,
    `passage` VARCHAR(191) NULL,
    `difficulty` INTEGER NOT NULL DEFAULT 2,
    `explanation` VARCHAR(191) NOT NULL,
    `fastStrategy` VARCHAR(191) NOT NULL,
    `commonTrap` VARCHAR(191) NOT NULL,
    `takeaway` VARCHAR(191) NOT NULL,
    `calculatorAllowed` BOOLEAN NOT NULL DEFAULT true,
    `tags` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Question_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnswerChoice` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `orderIndex` INTEGER NOT NULL,
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `AnswerChoice_questionId_label_key`(`questionId`, `label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MockTestSession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `mode` ENUM('FULL_MOCK', 'FULL_WRONG', 'MINI_WRONG', 'WEAK_TYPE_WRONG') NOT NULL,
    `status` ENUM('READY', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'READY',
    `title` VARCHAR(191) NOT NULL,
    `config` JSON NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MockTestSessionQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `questionTypeId` VARCHAR(191) NOT NULL,
    `orderIndex` INTEGER NOT NULL,
    `timeLimitSeconds` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `MockTestSessionQuestion_sessionId_orderIndex_key`(`sessionId`, `orderIndex`),
    UNIQUE INDEX `MockTestSessionQuestion_sessionId_questionId_key`(`sessionId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NULL,
    `selectedChoiceId` VARCHAR(191) NULL,
    `selfAssessment` ENUM('CORRECT', 'UNSURE', 'WRONG') NULL,
    `elapsedSeconds` INTEGER NOT NULL DEFAULT 0,
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,
    `attemptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WrongAnswerHistory` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `questionTypeId` VARCHAR(191) NOT NULL,
    `wrongCount` INTEGER NOT NULL DEFAULT 0,
    `unsureCount` INTEGER NOT NULL DEFAULT 0,
    `correctCount` INTEGER NOT NULL DEFAULT 0,
    `strengthScore` DOUBLE NOT NULL DEFAULT 0,
    `lastOutcome` ENUM('CORRECT', 'UNSURE', 'WRONG') NULL,
    `lastAttemptedAt` DATETIME(3) NULL,
    `reviewState` ENUM('NEW', 'REVIEWING', 'IMPROVING', 'STABLE') NOT NULL DEFAULT 'NEW',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WrongAnswerHistory_userId_questionId_key`(`userId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIReviewLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NULL,
    `provider` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `prompt` VARCHAR(191) NOT NULL,
    `response` VARCHAR(191) NOT NULL,
    `latencyMs` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Memo` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Memo_sessionId_questionId_key`(`sessionId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `QuestionType`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerChoice` ADD CONSTRAINT `AnswerChoice_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MockTestSession` ADD CONSTRAINT `MockTestSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MockTestSessionQuestion` ADD CONSTRAINT `MockTestSessionQuestion_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `MockTestSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MockTestSessionQuestion` ADD CONSTRAINT `MockTestSessionQuestion_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MockTestSessionQuestion` ADD CONSTRAINT `MockTestSessionQuestion_questionTypeId_fkey` FOREIGN KEY (`questionTypeId`) REFERENCES `QuestionType`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAttempt` ADD CONSTRAINT `UserAttempt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAttempt` ADD CONSTRAINT `UserAttempt_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAttempt` ADD CONSTRAINT `UserAttempt_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `MockTestSession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WrongAnswerHistory` ADD CONSTRAINT `WrongAnswerHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WrongAnswerHistory` ADD CONSTRAINT `WrongAnswerHistory_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WrongAnswerHistory` ADD CONSTRAINT `WrongAnswerHistory_questionTypeId_fkey` FOREIGN KEY (`questionTypeId`) REFERENCES `QuestionType`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIReviewLog` ADD CONSTRAINT `AIReviewLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIReviewLog` ADD CONSTRAINT `AIReviewLog_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIReviewLog` ADD CONSTRAINT `AIReviewLog_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `MockTestSession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Memo` ADD CONSTRAINT `Memo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Memo` ADD CONSTRAINT `Memo_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Memo` ADD CONSTRAINT `Memo_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `MockTestSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

