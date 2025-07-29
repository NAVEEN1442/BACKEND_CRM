#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper function to print colored output
function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to run command
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Test commands
const testCommands = {
  all: {
    description: 'Run all tests',
    command: 'npx',
    args: ['jest']
  },
  coverage: {
    description: 'Run tests with coverage report',
    command: 'npx',
    args: ['jest', '--coverage']
  },
  watch: {
    description: 'Run tests in watch mode',
    command: 'npx',
    args: ['jest', '--watch']
  },
  watchAll: {
    description: 'Run all tests in watch mode',
    command: 'npx',
    args: ['jest', '--watchAll']
  },
  api: {
    description: 'Run API endpoint tests',
    command: 'npx',
    args: ['jest', 'tests/patientHistory.test.js']
  },
  middleware: {
    description: 'Run middleware tests',
    command: 'npx',
    args: ['jest', 'tests/middleware/authMiddleware.test.js']
  },
  controller: {
    description: 'Run controller tests',
    command: 'npx',
    args: ['jest', 'tests/controllers/patientController.test.js']
  },
  model: {
    description: 'Run model tests',
    command: 'npx',
    args: ['jest', 'tests/models/patientHistory.test.js']
  },
  verbose: {
    description: 'Run tests with verbose output',
    command: 'npx',
    args: ['jest', '--verbose']
  },
  silent: {
    description: 'Run tests silently',
    command: 'npx',
    args: ['jest', '--silent']
  },
  updateSnapshots: {
    description: 'Update test snapshots',
    command: 'npx',
    args: ['jest', '--updateSnapshot']
  },
  detectOpenHandles: {
    description: 'Detect open handles that prevent Jest from exiting',
    command: 'npx',
    args: ['jest', '--detectOpenHandles']
  },
  bail: {
    description: 'Stop running tests after first failure',
    command: 'npx',
    args: ['jest', '--bail']
  },
  maxWorkers: {
    description: 'Run tests with single worker (useful for debugging)',
    command: 'npx',
    args: ['jest', '--maxWorkers=1']
  }
};

// Main function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  // Display help
  if (command === 'help' || command === '--help' || command === '-h') {
    colorLog('cyan', '\n🧪 Patient History Module Test Runner\n');
    colorLog('bright', 'Available commands:\n');
    
    Object.entries(testCommands).forEach(([cmd, config]) => {
      colorLog('green', `  ${cmd.padEnd(15)} - ${config.description}`);
    });
    
    colorLog('yellow', '\nExamples:');
    colorLog('white', '  node scripts/test.js all');
    colorLog('white', '  node scripts/test.js coverage');
    colorLog('white', '  node scripts/test.js watch');
    colorLog('white', '  node scripts/test.js api');
    console.log();
    return;
  }

  // Check if command exists
  if (!testCommands[command]) {
    colorLog('red', `❌ Unknown command: ${command}`);
    colorLog('yellow', 'Run "node scripts/test.js help" to see available commands');
    process.exit(1);
  }

  const testConfig = testCommands[command];
  
  colorLog('cyan', `\n🧪 Running: ${testConfig.description}\n`);
  colorLog('blue', `Command: ${testConfig.command} ${testConfig.args.join(' ')}\n`);

  try {
    // Check if dependencies are installed
    const fs = require('fs');
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      colorLog('red', '❌ package.json not found. Make sure you\'re in the project root directory.');
      process.exit(1);
    }

    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      colorLog('yellow', '⚠️  node_modules not found. Installing dependencies...');
      await runCommand('npm', ['install']);
      colorLog('green', '✅ Dependencies installed successfully');
    }

    // Run the test command
    await runCommand(testConfig.command, testConfig.args);
    
    colorLog('green', '\n✅ Tests completed successfully!');
    
    // Show coverage info if coverage command was run
    if (command === 'coverage') {
      colorLog('cyan', '\n📊 Coverage report generated in ./coverage/');
      colorLog('blue', 'Open ./coverage/lcov-report/index.html in your browser to view detailed coverage');
    }

  } catch (error) {
    colorLog('red', `\n❌ Test execution failed: ${error.message}`);
    
    // Provide helpful debugging information
    colorLog('yellow', '\n🔍 Debugging tips:');
    colorLog('white', '  • Check if all dependencies are installed: npm install');
    colorLog('white', '  • Verify MongoDB Memory Server is working: npm test -- --detectOpenHandles');
    colorLog('white', '  • Run tests with verbose output: node scripts/test.js verbose');
    colorLog('white', '  • Run a single test file to isolate issues');
    
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  colorLog('red', `\n💥 Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  colorLog('red', `\n💥 Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  colorLog('red', `\n💥 Script failed: ${error.message}`);
  process.exit(1);
});