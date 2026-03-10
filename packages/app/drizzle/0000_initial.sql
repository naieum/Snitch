-- snitchMCP Initial Migration
-- Generated from Drizzle schema

-- Better-auth tables

CREATE TABLE IF NOT EXISTS `user` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `emailVerified` integer NOT NULL DEFAULT 0,
  `image` text,
  `stripeCustomerId` text,
  `subscriptionTier` text DEFAULT 'free',
  `createdAt` integer NOT NULL,
  `updatedAt` integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `user` (`email`);

CREATE TABLE IF NOT EXISTS `session` (
  `id` text PRIMARY KEY NOT NULL,
  `expiresAt` integer NOT NULL,
  `token` text NOT NULL,
  `createdAt` integer NOT NULL,
  `updatedAt` integer NOT NULL,
  `ipAddress` text,
  `userAgent` text,
  `userId` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS `session_token_unique` ON `session` (`token`);

CREATE TABLE IF NOT EXISTS `account` (
  `id` text PRIMARY KEY NOT NULL,
  `accountId` text NOT NULL,
  `providerId` text NOT NULL,
  `userId` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `accessToken` text,
  `refreshToken` text,
  `idToken` text,
  `accessTokenExpiresAt` integer,
  `refreshTokenExpiresAt` integer,
  `scope` text,
  `password` text,
  `createdAt` integer NOT NULL,
  `updatedAt` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `verification` (
  `id` text PRIMARY KEY NOT NULL,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expiresAt` integer NOT NULL,
  `createdAt` integer,
  `updatedAt` integer
);

-- Application tables

CREATE TABLE IF NOT EXISTS `rulesets` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `category` text,
  `tags` text,
  `isPublic` integer DEFAULT 0,
  `ownerId` text REFERENCES `user`(`id`) ON DELETE CASCADE,
  `ruleCount` integer DEFAULT 0,
  `createdAt` text DEFAULT (datetime('now')),
  `updatedAt` text DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS `idx_rulesets_owner` ON `rulesets` (`ownerId`);
CREATE INDEX IF NOT EXISTS `idx_rulesets_category` ON `rulesets` (`category`);

CREATE TABLE IF NOT EXISTS `rules` (
  `id` text PRIMARY KEY NOT NULL,
  `rulesetId` text REFERENCES `rulesets`(`id`) ON DELETE CASCADE,
  `title` text NOT NULL,
  `description` text,
  `severity` text DEFAULT 'warning',
  `language` text,
  `framework` text,
  `filePattern` text,
  `pattern` text,
  `goodExample` text,
  `badExample` text,
  `createdAt` text DEFAULT (datetime('now')),
  `updatedAt` text DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS `idx_rules_ruleset` ON `rules` (`rulesetId`);
CREATE INDEX IF NOT EXISTS `idx_rules_language` ON `rules` (`language`);

CREATE TABLE IF NOT EXISTS `projects` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `languages` text,
  `frameworks` text,
  `ownerId` text REFERENCES `user`(`id`) ON DELETE CASCADE,
  `createdAt` text DEFAULT (datetime('now')),
  `updatedAt` text DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS `idx_projects_owner` ON `projects` (`ownerId`);

CREATE TABLE IF NOT EXISTS `projectRulesets` (
  `projectId` text NOT NULL REFERENCES `projects`(`id`) ON DELETE CASCADE,
  `rulesetId` text NOT NULL REFERENCES `rulesets`(`id`) ON DELETE CASCADE,
  PRIMARY KEY (`projectId`, `rulesetId`)
);

CREATE TABLE IF NOT EXISTS `memories` (
  `id` text PRIMARY KEY NOT NULL,
  `projectId` text REFERENCES `projects`(`id`) ON DELETE CASCADE,
  `content` text NOT NULL,
  `context` text,
  `source` text,
  `createdAt` text DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS `idx_memories_project` ON `memories` (`projectId`);

CREATE TABLE IF NOT EXISTS `apiKeys` (
  `id` text PRIMARY KEY NOT NULL,
  `userId` text NOT NULL,
  `name` text NOT NULL,
  `keyHash` text NOT NULL,
  `keyPrefix` text NOT NULL,
  `permissions` text DEFAULT 'read',
  `lastUsedAt` text,
  `createdAt` text DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS `idx_api_keys_hash` ON `apiKeys` (`keyHash`);
CREATE INDEX IF NOT EXISTS `idx_api_keys_user` ON `apiKeys` (`userId`);

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` text PRIMARY KEY NOT NULL,
  `userId` text UNIQUE REFERENCES `user`(`id`) ON DELETE CASCADE,
  `stripeCustomerId` text,
  `stripeSubscriptionId` text,
  `status` text DEFAULT 'active',
  `tier` text DEFAULT 'free',
  `createdAt` text DEFAULT (datetime('now')),
  `updatedAt` text DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS `idx_subscriptions_user` ON `subscriptions` (`userId`);
CREATE INDEX IF NOT EXISTS `idx_subscriptions_stripe` ON `subscriptions` (`stripeCustomerId`);

CREATE TABLE IF NOT EXISTS `usageRecords` (
  `id` text PRIMARY KEY NOT NULL,
  `userId` text NOT NULL,
  `action` text NOT NULL,
  `count` integer DEFAULT 0,
  `period` text NOT NULL
);
CREATE INDEX IF NOT EXISTS `idx_usage_user_period` ON `usageRecords` (`userId`, `period`);

CREATE TABLE IF NOT EXISTS `requestLogs` (
  `id` text PRIMARY KEY NOT NULL,
  `userId` text,
  `method` text NOT NULL,
  `path` text NOT NULL,
  `statusCode` integer,
  `latency` integer,
  `userAgent` text,
  `ip` text,
  `timestamp` text DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS `idx_logs_timestamp` ON `requestLogs` (`timestamp`);
CREATE INDEX IF NOT EXISTS `idx_logs_user` ON `requestLogs` (`userId`);
CREATE INDEX IF NOT EXISTS `idx_logs_status` ON `requestLogs` (`statusCode`);
