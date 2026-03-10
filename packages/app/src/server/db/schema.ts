import {
  sqliteTable,
  text,
  integer,
  index,
  primaryKey,
} from "drizzle-orm/sqlite-core";

// ─── Better-auth tables ─────────────────────────────────────────────

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  stripeCustomerId: text("stripeCustomerId"),
  subscriptionTier: text("subscriptionTier").default("free"),
  skillPurchasedAt: integer("skillPurchasedAt", { mode: "timestamp" }),
  skillVersion: text("skillVersion"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// ─── Application tables ─────────────────────────────────────────────

export const rulesets = sqliteTable(
  "rulesets",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category"),
    tags: text("tags"),
    isPublic: integer("isPublic").default(0),
    ownerId: text("ownerId").references(() => user.id, {
      onDelete: "cascade",
    }),
    ruleCount: integer("ruleCount").default(0),
    createdAt: text("createdAt").default("datetime('now')"),
    updatedAt: text("updatedAt").default("datetime('now')"),
  },
  (table) => [
    index("idx_rulesets_owner").on(table.ownerId),
    index("idx_rulesets_category").on(table.category),
  ]
);

export const rules = sqliteTable(
  "rules",
  {
    id: text("id").primaryKey(),
    rulesetId: text("rulesetId").references(() => rulesets.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    description: text("description"),
    severity: text("severity").default("warning"),
    language: text("language"),
    framework: text("framework"),
    filePattern: text("filePattern"),
    pattern: text("pattern"),
    goodExample: text("goodExample"),
    badExample: text("badExample"),
    createdAt: text("createdAt"),
    updatedAt: text("updatedAt"),
  },
  (table) => [
    index("idx_rules_ruleset").on(table.rulesetId),
    index("idx_rules_language").on(table.language),
  ]
);

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    languages: text("languages"),
    frameworks: text("frameworks"),
    ownerId: text("ownerId").references(() => user.id, {
      onDelete: "cascade",
    }),
    createdAt: text("createdAt"),
    updatedAt: text("updatedAt"),
  },
  (table) => [index("idx_projects_owner").on(table.ownerId)]
);

export const projectRulesets = sqliteTable(
  "projectRulesets",
  {
    projectId: text("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    rulesetId: text("rulesetId")
      .notNull()
      .references(() => rulesets.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.rulesetId] }),
  ]
);

export const memories = sqliteTable(
  "memories",
  {
    id: text("id").primaryKey(),
    projectId: text("projectId").references(() => projects.id, {
      onDelete: "cascade",
    }),
    content: text("content").notNull(),
    context: text("context"),
    source: text("source"),
    createdAt: text("createdAt"),
  },
  (table) => [index("idx_memories_project").on(table.projectId)]
);

export const apiKeys = sqliteTable(
  "apiKeys",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    name: text("name").notNull(),
    keyHash: text("keyHash").notNull(),
    keyPrefix: text("keyPrefix").notNull(),
    permissions: text("permissions").default("read"),
    lastUsedAt: text("lastUsedAt"),
    createdAt: text("createdAt"),
    clientType: text("clientType").default("mcp"),
    machineFingerprint: text("machineFingerprint"),
    fingerprintComponents: text("fingerprintComponents"), // JSON string of component hashes
    machineLabel: text("machineLabel"),
    lastHeartbeat: text("lastHeartbeat"),
  },
  (table) => [
    index("idx_api_keys_hash").on(table.keyHash),
    index("idx_api_keys_user").on(table.userId),
  ]
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    stripeCustomerId: text("stripeCustomerId"),
    stripeSubscriptionId: text("stripeSubscriptionId"),
    status: text("status").default("active"),
    tier: text("tier").default("free"),
    createdAt: text("createdAt"),
    updatedAt: text("updatedAt"),
  },
  (table) => [
    index("idx_subscriptions_user").on(table.userId),
    index("idx_subscriptions_stripe").on(table.stripeCustomerId),
  ]
);

export const usageRecords = sqliteTable(
  "usageRecords",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    action: text("action").notNull(),
    count: integer("count").default(0),
    period: text("period").notNull(),
  },
  (table) => [
    index("idx_usage_user_period").on(table.userId, table.period),
  ]
);

// ─── Scan history ───────────────────────────────────────────────────

export const scans = sqliteTable(
  "scans",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("projectId").references(() => projects.id, {
      onDelete: "set null",
    }),
    projectName: text("projectName").notNull(),
    scanType: text("scanType").notNull(),
    categoriesScanned: text("categoriesScanned"),
    totalFindings: integer("totalFindings").notNull().default(0),
    criticalCount: integer("criticalCount").default(0),
    highCount: integer("highCount").default(0),
    mediumCount: integer("mediumCount").default(0),
    lowCount: integer("lowCount").default(0),
    source: text("source").default("mcp"),
    findings: text("findings"), // JSON string
    createdAt: text("createdAt").notNull(),
  },
  (table) => [
    index("idx_scans_user").on(table.userId),
    index("idx_scans_project").on(table.projectId),
  ]
);

// ─── Integrations / Webhooks ────────────────────────────────────────

export const integrations = sqliteTable(
  "integrations",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(), // slack | teams | discord
    webhookUrl: text("webhookUrl").notNull(),
    threshold: text("threshold").default("high"), // critical | high | medium | all
    weeklyDigest: integer("weeklyDigest").default(0),
    createdAt: text("createdAt").notNull(),
    updatedAt: text("updatedAt"),
  },
  (table) => [index("idx_integrations_user").on(table.userId)]
);

// ─── Device authorization codes ─────────────────────────────────────

export const deviceCodes = sqliteTable(
  "deviceCodes",
  {
    deviceCode: text("deviceCode").primaryKey(),
    userCode: text("userCode").notNull().unique(),
    userId: text("userId"),
    accessToken: text("accessToken"),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    status: text("status").default("pending"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    clientType: text("clientType").default("mcp"),
    machineFingerprint: text("machineFingerprint"),
    fingerprintComponents: text("fingerprintComponents"), // JSON string of component hashes
    machineLabel: text("machineLabel"),
  },
  (table) => [index("idx_device_codes_status").on(table.status)]
);

// ─── Request logs ───────────────────────────────────────────────────

export const requestLogs = sqliteTable(
  "requestLogs",
  {
    id: text("id").primaryKey(),
    userId: text("userId"),
    method: text("method").notNull(),
    path: text("path").notNull(),
    statusCode: integer("statusCode"),
    latency: integer("latency"),
    userAgent: text("userAgent"),
    ip: text("ip"),
    timestamp: text("timestamp"),
  },
  (table) => [
    index("idx_logs_timestamp").on(table.timestamp),
    index("idx_logs_user").on(table.userId),
    index("idx_logs_status").on(table.statusCode),
  ]
);
