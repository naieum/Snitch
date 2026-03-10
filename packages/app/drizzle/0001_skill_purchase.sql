-- Add skill purchase tracking to user table
ALTER TABLE `user` ADD COLUMN `skillPurchasedAt` integer;
ALTER TABLE `user` ADD COLUMN `skillVersion` text;

-- Device codes for MCP device authorization flow
CREATE TABLE IF NOT EXISTS `deviceCodes` (
  `deviceCode` text PRIMARY KEY NOT NULL,
  `userCode` text NOT NULL,
  `userId` text,
  `accessToken` text,
  `expiresAt` integer NOT NULL,
  `status` text DEFAULT 'pending',
  `createdAt` integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `deviceCodes_userCode_unique` ON `deviceCodes` (`userCode`);
CREATE INDEX IF NOT EXISTS `idx_device_codes_status` ON `deviceCodes` (`status`);
