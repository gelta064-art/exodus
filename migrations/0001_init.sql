-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "charCount" INTEGER NOT NULL,
    "coverUrl" TEXT,
    "coverPrompt" TEXT,
    "voiceId" TEXT NOT NULL DEFAULT 'tongtong',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "progress" REAL NOT NULL DEFAULT 0,
    "lastChunk" INTEGER NOT NULL DEFAULT 0,
    "shelf" TEXT,
    "rating" INTEGER,
    "review" TEXT,
    "reviewAt" DATETIME
);

-- CreateTable
CREATE TABLE "VoiceProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "voiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL DEFAULT 'amber',
    "gender" TEXT NOT NULL DEFAULT 'neutral',
    "language" TEXT NOT NULL DEFAULT 'en',
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AudioChunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "charCount" INTEGER NOT NULL,
    "audioUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AudioChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "reader" TEXT NOT NULL,
    "readerAvatar" TEXT NOT NULL DEFAULT '',
    "documentTitle" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LivingBook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "coverPrompt" TEXT NOT NULL,
    "coverUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LivingPage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "artPrompt" TEXT NOT NULL,
    "artUrl" TEXT,
    "artStatus" TEXT NOT NULL DEFAULT 'pending',
    "videoUrl" TEXT,
    "videoStatus" TEXT NOT NULL DEFAULT 'pending',
    "ambientAudioUrl" TEXT,
    "audioStatus" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "LivingPage_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "LivingBook" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AudioChunk_documentId_idx" ON "AudioChunk"("documentId");

-- CreateIndex
CREATE INDEX "LivingPage_bookId_idx" ON "LivingPage"("bookId");

