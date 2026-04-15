import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { AnalyzeInputSchema } from './types/schemas.js';
export class AnalyzerServer {
    server;
    constructor() {
        this.server = new Server({
            name: 'mcp-legacy-analyzer',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
        // Error handling
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'analyze_legacy_code',
                    description: 'Analyzes legacy code using AST engine',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            code: {
                                type: 'string',
                                description: 'The source code to analyze',
                            },
                            filePath: {
                                type: 'string',
                                description: 'Optional file path of the source code',
                            },
                        },
                        required: ['code'],
                    },
                },
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            if (request.params.name !== 'analyze_legacy_code') {
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
            }
            const input = AnalyzeInputSchema.safeParse(request.params.arguments);
            if (!input.success) {
                throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${input.error.message}`);
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Hola Jack, estoy listo para analizar tu código legacy',
                    },
                ],
            };
        });
    }
    getServer() {
        return this.server;
    }
}
