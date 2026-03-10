#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SnitchClient, JeremyClient } from "./client.js";
import { registerTools } from "./tools.js";

const SNITCHMCP_API_URL = process.env.SNITCHMCP_API_URL ?? "https://snitch.live";
const SNITCHMCP_API_KEY = process.env.SNITCHMCP_API_KEY ?? process.env.SNITCH_API_KEY ?? "";
const JEREMY_API_URL = process.env.JEREMY_API_URL ?? "https://jeremy-app.ian-muench.workers.dev";
const JEREMY_API_KEY = process.env.JEREMY_API_KEY ?? "";

const server = new McpServer({ name: "snitchmcp", version: "1.0.0" });

const snitchClient = new SnitchClient(SNITCHMCP_API_URL, SNITCHMCP_API_KEY);
const jeremyClient = new JeremyClient(JEREMY_API_URL, JEREMY_API_KEY);

registerTools(server, snitchClient, jeremyClient);

const transport = new StdioServerTransport();
await server.connect(transport);
