-- Add desktop licensing columns to deviceCodes
ALTER TABLE `deviceCodes` ADD COLUMN `clientType` text DEFAULT 'mcp';
ALTER TABLE `deviceCodes` ADD COLUMN `machineFingerprint` text;
ALTER TABLE `deviceCodes` ADD COLUMN `fingerprintComponents` text;
ALTER TABLE `deviceCodes` ADD COLUMN `machineLabel` text;

-- Add desktop licensing columns to apiKeys
ALTER TABLE `apiKeys` ADD COLUMN `clientType` text DEFAULT 'mcp';
ALTER TABLE `apiKeys` ADD COLUMN `machineFingerprint` text;
ALTER TABLE `apiKeys` ADD COLUMN `fingerprintComponents` text;
ALTER TABLE `apiKeys` ADD COLUMN `machineLabel` text;
ALTER TABLE `apiKeys` ADD COLUMN `lastHeartbeat` text;
