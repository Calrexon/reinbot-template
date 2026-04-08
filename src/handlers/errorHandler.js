const { WebhookClient, EmbedBuilder } = require('discord.js');

module.exports = {
  handleErrors: (client, webhookUrl) => {
    if (!webhookUrl) {
      console.warn('Webhook URL tidak disediakan. Error handler tidak diaktifkan.');
      return;
    }

    const webhookClient = new WebhookClient({ url: webhookUrl });
    const MAX_LOG_LENGTH = 2000; // Discord embed description limit
    const LOG_INTERVAL = 5000; // 5 seconds
    const LOG_BUFFER_SIZE = 10; // Number of logs to buffer before sending
    const LOG_LEVELS = ['error', 'warn', 'info', 'debug', 'log'];
    
    let logBuffer = [];
    let lastLogSent = 0;
    let consoleBuffer = '';

    // Function to send logs to webhook
    const sendLogs = async (force = false) => {
      const now = Date.now();
      
      // Only send if buffer has content and either:
      // - We've reached buffer size
      // - It's been longer than LOG_INTERVAL since last send
      // - We're forcing a send (like on process exit)
      if (logBuffer.length > 0 && 
          (logBuffer.length >= LOG_BUFFER_SIZE || 
           now - lastLogSent >= LOG_INTERVAL || 
           force)) {
        
        const logsToSend = [...logBuffer];
        logBuffer = [];
        lastLogSent = now;

        try {
          // Format logs into embed
          const logText = logsToSend.map(log => {
            const timestamp = new Date(log.timestamp).toISOString();
            return `[${timestamp}] [${log.level.toUpperCase()}] ${log.message}`;
          }).join('\n');

          const embed = new EmbedBuilder()
            .setTitle('Console Logs')
            .setDescription(`\`\`\`${logText.slice(0, MAX_LOG_LENGTH)}\`\`\``)
            .setColor('#5865F2')
            .setTimestamp();

          await webhookClient.send({ embeds: [embed] });
        } catch (error) {
          console.error('Failed to send logs to webhook:', error);
        }
      }
    };

    // Function to send error embeds
    const sendEmbed = (title, description, color = 'Red') => {
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(`\`\`\`${description.slice(0, MAX_LOG_LENGTH)}\`\`\``)
        .setColor(color)
        .setTimestamp();

      webhookClient.send({ embeds: [embed] }).catch(console.error);
    };

    // Capture console output
    const originalConsole = {};
    LOG_LEVELS.forEach(level => {
      originalConsole[level] = console[level];
      console[level] = (...args) => {
        // Call original console method first
        originalConsole[level].apply(console, args);
        
        // Format the log message
        const message = args
          .map(arg => 
            typeof arg === 'object' ? 
            JSON.stringify(arg, replaceErrors) : 
            String(arg)
          ).join(' ');
        
        // Add to buffer
        logBuffer.push({
          level,
          message,
          timestamp: Date.now()
        });
        
        // Check if we should send logs
        sendLogs();
      };
    });

    // Helper function for circular JSON references
    function replaceErrors(key, value) {
      if (value instanceof Error) {
        const error = {};
        Object.getOwnPropertyNames(value).forEach(prop => {
          error[prop] = value[prop];
        });
        return error;
      }
      return value;
    }

    // Error handlers
    process.on('uncaughtException', (err) => {
      originalConsole.error('Uncaught Exception:', err);
      sendEmbed('Uncaught Exception', err.stack || String(err));
      sendLogs(true); // Force send any buffered logs
    });

    process.on('unhandledRejection', (reason, promise) => {
      originalConsole.error('Unhandled Rejection at:', promise, 'reason:', reason);
      sendEmbed(
        'Unhandled Rejection',
        `Promise: ${String(promise)}\nReason: ${reason?.stack || reason}`
      );
      sendLogs(true);
    });

    process.on('warning', (warning) => {
      originalConsole.warn('Warning:', warning);
      sendEmbed('Warning', warning.stack || String(warning), 'Yellow');
      sendLogs();
    });

    process.on('exit', () => {
      sendLogs(true); // Send any remaining logs before exiting
    });

    // Discord.js specific handlers
    client.on('rateLimit', (info) => {
      originalConsole.warn('Rate Limit:', info);
      sendEmbed('Rate Limit', JSON.stringify(info, null, 2), 'Yellow');
      sendLogs();
    });

    client.on('error', (error) => {
      originalConsole.error('Discord.js Error:', error);
      sendEmbed('Discord.js Error', error.stack || String(error));
      sendLogs(true);
    });

    // Periodically flush logs even if buffer isn't full
    setInterval(() => sendLogs(), LOG_INTERVAL);
  },
};