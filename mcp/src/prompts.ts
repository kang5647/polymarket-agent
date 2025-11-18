import { McpServer } from '../$node_modules/.pnpm/@modelcontextprotocol+sdk@1.17.4/$node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js';
import { z } from '../$node_modules/.pnpm/zod@3.25.76/$node_modules/zod/index.cjs';

export function setupServerPrompts(server: McpServer) {
	// TODO: Expose prompts
	//   server.prompt(
	//     'introduction',
	//     'Learn about the Todo service and how to use it',
	//     () => ({
	//       messages: [{
	//         role: 'assistant',
	//         content: {
	//           type: 'text',
	//           text: `Welcome to the Todo Service! This service helps you manage your tasks effectively.
	// Here's what you can do:
	// 1. Create new todos with titles, descriptions, and due dates
	// 2. List and filter your todos
	// 3. Update existing todos
	// 4. Mark todos as completed
	// 5. Delete todos
	// 6. View todo statistics
	// Would you like to:
	// - "Create a new todo" - I'll help you create a new task
	// - "Show my todos" - I'll list your current todos
	// - "Show today's todos" - I'll show tasks due today
	// - "View todo stats" - I'll show you statistics about your todos
	// - "Learn about filters" - I'll explain how to filter and sort todos`
	//         }
	//       }]
	//     })
	//   );
}
