import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { AnalyzerServer } from './server.js';

async function main() {
  const analyzer = new AnalyzerServer();
  const transport = new StdioServerTransport();
  
  await analyzer.getServer().connect(transport);
  console.error('Analyzer MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
