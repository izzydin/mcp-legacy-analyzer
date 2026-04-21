import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { AnalyzeInputSchema, ComponentStructureInputSchema } from './types/schemas.js';
import { parseSourceCode } from './utils/parser.js';
import { ComponentVisitor } from './analyzer/visitors/ComponentVisitor.js';
import { AnalysisEngine } from './analyzer/engine.js';
import { GhostHunterRule } from './analyzer/rules/GhostHunterRule.js';
import { ConcurrentScoutRule } from './analyzer/rules/ConcurrentScoutRule.js';
import { Reporter } from './utils/reporter.js';
import fs from 'fs';

export class AnalyzerServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'mcp-legacy-analyzer',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
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
        {
          name: 'analyze_component_structure',
          description: 'Analyzes the component structure of a React codebase file',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Path to the source code file'
              },
              code: {
                type: 'string',
                description: 'Source code string to analyze'
              }
            }
          }
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'analyze_legacy_code') {
        const input = AnalyzeInputSchema.safeParse(request.params.arguments);
        if (!input.success) {
          throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${input.error.message}`);
        }

        let sourceCode = input.data.code;
        if (!sourceCode && input.data.filePath) {
          try {
            sourceCode = fs.readFileSync(input.data.filePath, 'utf-8');
          } catch (err: any) {
             throw new McpError(ErrorCode.InvalidParams, `Failed to read file: ${err.message}`);
          }
        }

        try {
          const ast = parseSourceCode(sourceCode!);
          const engine = new AnalysisEngine();
          engine.registerRules([GhostHunterRule, ConcurrentScoutRule]);
          
          const context = engine.execute(ast);
          const report = Reporter.generateHealthReport(context.diagnostics);

          return {
            content: [{ type: 'text', text: report }],
          };
        } catch (err: any) {
          // Gracefully handle syntax errors
          const errorReport = Reporter.generateHealthReport([{
            ruleId: 'parse-error',
            severity: 'error',
            message: `Syntax Error preventing analysis: ${err.message}`,
            action: 'Fix the syntax error and re-run the analyzer.',
            line: err.loc?.line ?? 0,
            column: err.loc?.column ?? 0
          }]);

          return {
            content: [{ type: 'text', text: errorReport }],
            isError: true
          };
        }
      }

      if (request.params.name === 'analyze_component_structure') {
        const input = ComponentStructureInputSchema.safeParse(request.params.arguments);
        if (!input.success) {
          throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${input.error.message}`);
        }

        let sourceCode = input.data.code;
        if (!sourceCode && input.data.filePath) {
          try {
            sourceCode = fs.readFileSync(input.data.filePath, 'utf-8');
          } catch (err: any) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({ error: `Failed to read file at ${input.data.filePath}: ${err.message}` }, null, 2)
              }],
              isError: true,
            };
          }
        }

        try {
          // Fallback parsing gracefully
          const ast = parseSourceCode(sourceCode!);
          const components = ComponentVisitor.extractComponents(ast);
          
          const classCount = components.filter(c => c.type === 'Class').length;
          const functionalCount = components.filter(c => c.type === 'Functional').length;

          const report = {
            summary: `Found ${classCount} Class Component(s), ${functionalCount} Functional Component(s)`,
            components: components
          };

          return {
            content: [{
              type: 'text',
              text: JSON.stringify(report, null, 2)
            }]
          };
        } catch (err: any) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ error: `Graceful Fallback - Failed to parse code: ${err.message}` }, null, 2)
            }],
            isError: true,
          };
        }
      }

      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
    });
  }

  public getServer() {
    return this.server;
  }
}
